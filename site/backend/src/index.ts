import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { csrfProtection } from './middleware/csrf.js';
import { errorHandler } from './lib/errors.js';

import { authRouter } from './routes/auth.js';
import { projectsRouter } from './routes/projects.js';
import { workspacesRouter } from './routes/workspaces.js';
import { consultationRouter } from './routes/consultation.js';
import { stepsRouter } from './routes/steps.js';
import { platformRouter } from './routes/platform.js';

const app = express();

// 1. Sécurité HTTP avec Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// 2. CORS restreint aux origines Frontend autorisées, avec support des cookies
app.use(
  cors({
    origin: config.FRONTEND_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  })
);

// 3. Parsers de corps de requête et cookies
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// 4. Rate limiting global
app.use('/api', apiLimiter);

// 5. Protection CSRF (applique le token pour les requêtes modifiantes)
app.use(csrfProtection);

// 6. Route de vérification de santé
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: config.NODE_ENV,
    orchestratorUrl: config.ORCHESTRATOR_URL,
    timestamp: new Date().toISOString(),
  });
});

// 7. Montage des modules d'API
app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api', workspacesRouter);
app.use('/api/consultation', consultationRouter);
app.use('/api/steps', stepsRouter);
app.use('/api', platformRouter);

// 8. Gestionnaire d'erreurs centralisé
app.use(errorHandler);

const server = app.listen(config.PORT, () => {
  console.log(`=======================================================`);
  console.log(`  Plateforme Mémoire de Recherche — Backend Gateway`);
  console.log(`  Serveur actif sur      : http://localhost:${config.PORT}`);
  console.log(`  Frontend autorisé      : ${config.FRONTEND_ORIGIN}`);
  console.log(`  Plateforme Orchestrator: ${config.ORCHESTRATOR_URL}`);
  console.log(`=======================================================`);
});

// Arrêt gracieux
process.on('SIGTERM', () => {
  server.close(() => console.log('Serveur arrêté proprement.'));
});

export { app, server };

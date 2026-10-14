import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  // Origine(s) autorisée(s) du frontend (CORS + contrôle d'origine CSRF).
  // Une LISTE séparée par des virgules est acceptée : la même instance doit pouvoir être
  // atteinte en local (http://localhost:5173) ET par un lien public (tunnel HTTPS), sinon
  // toute requête modifiante est refusée en 403 BAD_ORIGIN depuis le lien public.
  FRONTEND_ORIGIN: z.string().min(1).default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET doit contenir au moins 32 caractères'),
  JWT_TTL_HOURS: z.coerce.number().positive().default(12),
  ORCHESTRATOR_URL: z.string().url().default('http://127.0.0.1:8000'),
  CONSULTATION_RATE_PER_MINUTE: z.coerce.number().int().positive().default(8),
  CONSULTATION_RATE_PER_DAY: z.coerce.number().int().positive().default(150),
  ENGINE_MAX_CONCURRENCY: z.coerce.number().int().positive().default(8),
  CONSULTATION_MAX_CHARS: z.coerce.number().int().positive().default(4000),
  // Délai maximal d'un LANCEMENT D'ÉTAPE (l'agent peut travailler 25 min sur la revue de
  // littérature). Distinct des appels ordinaires, volontairement brefs : un appel normal qui
  // n'a rien répondu au bout de 30 s est un appel en panne.
  ETAPE_TIMEOUT_MS: z.coerce.number().int().positive().default(1_800_000),
  APPEL_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  // On n'affiche que les noms de variables en erreur, jamais leurs valeurs.
  const fields = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n  ');
  console.error(`Configuration invalide :\n  ${fields}`);
  process.exit(1);
}

export const config = {
  ...parsed.data,
  // Liste des origines autorisées (une seule valeur = comportement d'origine, inchangé).
  FRONTEND_ORIGINS: parsed.data.FRONTEND_ORIGIN.split(',')
    .map((origine) => origine.trim())
    .filter(Boolean),
  isProd: parsed.data.NODE_ENV === 'production',
  SESSION_COOKIE: 'mr_session',
  CSRF_COOKIE: 'mr_csrf',
};

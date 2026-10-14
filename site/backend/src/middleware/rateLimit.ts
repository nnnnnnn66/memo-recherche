import type { Request } from 'express';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { config } from '../config.js';
import type { AuthedRequest } from './auth.js';

const userOrIpKey = (req: Request) => {
  const user = (req as Partial<AuthedRequest>).user;
  return user ? `u:${user.id}` : `ip:${ipKeyGenerator(req.ip ?? '0.0.0.0')}`;
};

const json = (message: string, code: string) => ({ error: message, code });

/** Plafond général de l'API (protection contre le scraping / le flood). */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: json('Trop de requêtes, réessayez dans quelques minutes.', 'RATE_LIMITED'),
});

/** Anti force brute sur la connexion / l'inscription. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: json('Trop de tentatives. Patientez 15 minutes.', 'RATE_LIMITED'),
});

/** Limitation stricte vers le moteur sémantique — par utilisateur, à la minute. */
export const consultationMinuteLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: config.CONSULTATION_RATE_PER_MINUTE,
  keyGenerator: userOrIpKey,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: json(
    `Limite atteinte : ${config.CONSULTATION_RATE_PER_MINUTE} consultations par minute. Prenez le temps de relire la dernière réponse.`,
    'RATE_LIMITED',
  ),
});

/** Quota journalier par utilisateur. */
export const consultationDailyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  limit: config.CONSULTATION_RATE_PER_DAY,
  keyGenerator: userOrIpKey,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: json('Quota journalier de consultations atteint. Il sera renouvelé demain.', 'QUOTA_EXCEEDED'),
});

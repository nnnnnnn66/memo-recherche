import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { config } from '../config.js';
import { HttpError } from '../lib/errors.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

/**
 * Protection CSRF "double submit cookie" + contrôle d'origine.
 *  - Le serveur dépose un jeton aléatoire dans un cookie lisible par le JS (mr_csrf).
 *  - Toute requête modifiante doit renvoyer ce jeton dans l'en-tête X-CSRF-Token.
 *  - Un site tiers ne peut ni lire le cookie, ni forger l'en-tête.
 * Combiné au cookie de session SameSite=Strict.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  let token: string | undefined = req.cookies?.[config.CSRF_COOKIE];
  if (!token) {
    token = crypto.randomBytes(32).toString('hex');
    res.cookie(config.CSRF_COOKIE, token, {
      httpOnly: false,
      secure: config.isProd,
      sameSite: 'strict',
      path: '/',
    });
  }

  if (SAFE_METHODS.has(req.method)) return next();

  // Les routes d'authentification initiale (login / register) ne doivent pas bloquer
  // un nouvel utilisateur qui n'a pas encore reçu son premier cookie CSRF.
  if (req.path === '/api/auth/login' || req.path === '/api/auth/register') {
    return next();
  }

  // L'origine de la requête doit figurer dans la LISTE autorisée : en local comme derrière le
  // lien public. Une valeur unique se comporte exactement comme avant.
  const origin = req.get('origin');
  if (origin && !config.FRONTEND_ORIGINS.includes(origin)) {
    return next(new HttpError(403, 'Origine non autorisée', 'BAD_ORIGIN'));
  }

  const header = req.get('x-csrf-token');
  if (!header || !req.cookies?.[config.CSRF_COOKIE] || !safeEqual(header, req.cookies[config.CSRF_COOKIE])) {
    return next(new HttpError(403, 'Jeton CSRF invalide ou manquant', 'CSRF'));
  }
  next();
}

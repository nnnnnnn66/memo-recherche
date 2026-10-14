import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/errors.js';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthedRequest extends Request {
  user: AuthUser;
}

interface SessionPayload {
  sub: string;
}

const cookieOptions = () => ({
  httpOnly: true,
  secure: config.isProd,
  sameSite: 'strict' as const,
  path: '/',
  maxAge: config.JWT_TTL_HOURS * 3600 * 1000,
});

export function setSessionCookie(res: Response, userId: string) {
  const token = jwt.sign({ sub: userId } satisfies SessionPayload, config.JWT_SECRET, {
    expiresIn: `${config.JWT_TTL_HOURS}h`,
    algorithm: 'HS256',
  });
  res.cookie(config.SESSION_COOKIE, token, cookieOptions());
}

export function clearSessionCookie(res: Response) {
  const { maxAge: _ignored, ...opts } = cookieOptions();
  res.clearCookie(config.SESSION_COOKIE, opts);
}

/** Vérifie le cookie de session HttpOnly et charge l'utilisateur actif. */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[config.SESSION_COOKIE];
    if (!token) throw new HttpError(401, 'Authentification requise', 'UNAUTHENTICATED');

    let payload: SessionPayload;
    try {
      payload = jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'] }) as SessionPayload;
    } catch {
      throw new HttpError(401, 'Session expirée ou invalide', 'UNAUTHENTICATED');
    }

    const user = await prisma.user.findFirst({
      where: { id: payload.sub, status: 'active' },
      select: { id: true, name: true, email: true },
    });
    if (!user) throw new HttpError(401, 'Compte introuvable ou désactivé', 'UNAUTHENTICATED');

    (req as AuthedRequest).user = user;
    next();
  } catch (err) {
    next(err);
  }
}

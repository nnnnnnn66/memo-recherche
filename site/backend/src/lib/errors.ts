import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

export const notFound = (what = 'Ressource') => new HttpError(404, `${what} introuvable`, 'NOT_FOUND');

/** Enveloppe un handler async pour transmettre les erreurs à Express. */
export const asyncHandler =
  <T extends Request>(fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req as T, res, next).catch(next);
  };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (res.headersSent) {
    res.end();
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Données invalides',
      code: 'VALIDATION_ERROR',
      details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, code: err.code });
    return;
  }
  console.error('[erreur non gérée]', err);
  res.status(500).json({ error: 'Erreur interne du serveur', code: 'INTERNAL' });
}

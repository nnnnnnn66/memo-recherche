import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { setSessionCookie, clearSessionCookie, requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { asyncHandler, HttpError } from '../lib/errors.js';

export const authRouter = Router();

const RegisterSchema = z.object({
  name: z.string().trim().max(100).optional(),
  email: z.string().trim().email('Format email invalide').toLowerCase(),
  password: z.string().min(4, 'Le mot de passe / code doit comporter au moins 4 caractères').max(100),
});

const LoginSchema = z.object({
  email: z.string().trim().email('Format email invalide').toLowerCase(),
  password: z.string().min(1, 'Mot de passe requis'),
});

authRouter.post(
  '/register',
  authLimiter,
  asyncHandler(async (req, res) => {
    const data = RegisterSchema.parse(req.body);

    const existing = await prisma.user.findFirst({
      where: { email: data.email },
    });
    if (existing) {
      throw new HttpError(409, 'Cet email est déjà associé à un compte.', 'EMAIL_EXISTS');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const displayName = data.name?.trim() || data.email.split('@')[0].replace(/[._-]/g, ' ');

    const user = await prisma.user.create({
      data: {
        name: displayName,
        email: data.email,
        passwordHash,
      },
      select: { id: true, name: true, email: true },
    });

    setSessionCookie(res, user.id);
    res.status(201).json({ user });
  })
);

authRouter.post(
  '/login',
  authLimiter,
  asyncHandler(async (req, res) => {
    const data = LoginSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: { email: data.email, status: 'active' },
    });
    if (!user) {
      throw new HttpError(401, 'Identifiants incorrects.', 'INVALID_CREDENTIALS');
    }

    const match = await bcrypt.compare(data.password, user.passwordHash);
    if (!match) {
      throw new HttpError(401, 'Identifiants incorrects.', 'INVALID_CREDENTIALS');
    }

    setSessionCookie(res, user.id);
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  })
);

authRouter.post('/logout', (req, res) => {
  clearSessionCookie(res);
  res.json({ success: true });
});

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthedRequest;
    res.json({ user: authReq.user });
  })
);

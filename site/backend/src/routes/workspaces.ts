import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { asyncHandler, notFound } from '../lib/errors.js';

export const workspacesRouter = Router();
workspacesRouter.use('/projects', requireAuth);

const SaveWorkspaceSchema = z.object({
  content: z.string(),
  note: z.string().max(255).optional(),
});

workspacesRouter.get(
  '/projects/:projectId/steps/:stepId/versions',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthedRequest;
    const projectId = req.params.projectId as string;
    const stepNumber = parseInt(req.params.stepId as string, 10);

    const project = await prisma.researchProject.findFirst({
      where: { id: projectId, ownerId: authReq.user.id },
    });
    if (!project) throw notFound('Projet');

    const versions = await prisma.stepWorkspace.findMany({
      where: { projectId, stepId: stepNumber },
      orderBy: { revision: 'desc' },
      select: {
        id: true,
        revision: true,
        wordCount: true,
        note: true,
        createdAt: true,
      },
    });

    res.json({ versions });
  })
);

workspacesRouter.get(
  '/projects/:projectId/steps/:stepId',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthedRequest;
    const projectId = req.params.projectId as string;
    const stepNumber = parseInt(req.params.stepId as string, 10);
    const revQuery = req.query.revision ? parseInt(req.query.revision as string, 10) : undefined;

    const project = await prisma.researchProject.findFirst({
      where: { id: projectId, ownerId: authReq.user.id },
    });
    if (!project) throw notFound('Projet');

    const workspace = await prisma.stepWorkspace.findFirst({
      where: {
        projectId,
        stepId: stepNumber,
        ...(revQuery ? { revision: revQuery } : {}),
      },
      orderBy: { revision: 'desc' },
    });

    res.json({ workspace: workspace || null });
  })
);

workspacesRouter.post(
  '/projects/:projectId/steps/:stepId',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthedRequest;
    const projectId = req.params.projectId as string;
    const stepNumber = parseInt(req.params.stepId as string, 10);
    const data = SaveWorkspaceSchema.parse(req.body);

    const project = await prisma.researchProject.findFirst({
      where: { id: projectId, ownerId: authReq.user.id },
    });
    if (!project) throw notFound('Projet');

    const words = data.content.trim().length > 0 ? data.content.trim().split(/\s+/).length : 0;

    const last = await prisma.stepWorkspace.findFirst({
      where: { projectId, stepId: stepNumber },
      orderBy: { revision: 'desc' },
      select: { revision: true },
    });
    const nextRevision = (last?.revision ?? 0) + 1;

    const created = await prisma.stepWorkspace.create({
      data: {
        projectId,
        stepId: stepNumber,
        revision: nextRevision,
        content: data.content,
        wordCount: words,
        note: data.note,
      },
    });

    await prisma.researchProject.update({
      where: { id: projectId },
      data: { updatedAt: new Date() },
    });

    res.status(201).json({ workspace: created });
  })
);

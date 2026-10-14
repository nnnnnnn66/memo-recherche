// ============================================================================
//  Gestion des Projets de Recherche & Synchronisation Dossier Orchestrateur
//  Un mémoire = un dossier {etudiant}/{session} sur l'orchestrateur
// ============================================================================

import { Router, type Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { orchestratorClient } from '../services/orchestratorClient.js';
import { asyncHandler, notFound } from '../lib/errors.js';

export const projectsRouter = Router();
projectsRouter.use(requireAuth);

const CreateProjectSchema = z.object({
  title: z.string().trim().min(3, 'Le titre doit faire au moins 3 caractères').max(255),
  domain: z.string().trim().min(2, 'Le domaine de recherche est requis').max(160),
});

const UpdateProjectSchema = z.object({
  title: z.string().trim().min(3).max(255).optional(),
  domain: z.string().trim().min(2).max(160).optional(),
  status: z.enum(['draft', 'in_progress', 'completed', 'archived']).optional(),
});

// Liste des projets de l'étudiant
projectsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthedRequest;
    const projects = await prisma.researchProject.findMany({
      where: { ownerId: authReq.user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { workspaces: true, sessions: true },
        },
      },
    });
    res.json({ projects });
  })
);

// 3. Ouvrir un dossier (un mémoire)
// POST /dossiers/{etudiant}/{session}
projectsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthedRequest;
    const data = CreateProjectSchema.parse(req.body);

    const project = await prisma.researchProject.create({
      data: {
        title: data.title,
        domain: data.domain,
        ownerId: authReq.user.id,
      },
    });

    // Ouvre le dossier correspondant sur l'orchestrateur
    try {
      await orchestratorClient.openDossier(authReq.user.id, project.id, {
        sujet: data.title,
        sujet_contexte: data.domain,
      });
    } catch (err) {
      console.warn(`[Orchestrator] Notification création dossier:`, err);
    }

    res.status(201).json({ project });
  })
);

// Détail d'un projet
projectsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthedRequest;
    const id = req.params.id as string;
    const project = await prisma.researchProject.findFirst({
      where: { id, ownerId: authReq.user.id },
      include: {
        workspaces: {
          orderBy: { revision: 'desc' },
        },
        sessions: {
          orderBy: { updatedAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!project) throw notFound('Projet');

    // S'assure que le dossier est ouvert sur l'orchestrateur
    try {
      await orchestratorClient.openDossier(authReq.user.id, project.id, {
        sujet: project.title,
        sujet_contexte: project.domain,
      });
    } catch (err) {
      // Ignorer si déjà ouvert ou en attente
    }

    res.json({ project });
  })
);

// 4. Où en est l'étudiant : GET /projects/:id/dossier
projectsRouter.get(
  '/:id/dossier',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthedRequest;
    const id = req.params.id as string;
    const project = await prisma.researchProject.findFirst({
      where: { id, ownerId: authReq.user.id },
    });
    if (!project) throw notFound('Projet');

    try {
      await orchestratorClient.openDossier(authReq.user.id, project.id, {
        sujet: project.title,
        sujet_contexte: project.domain,
      });
    } catch {}

    const dossier = await orchestratorClient.getDossier(authReq.user.id, project.id);
    res.json(dossier);
  })
);

// 5. Lancer l'étape ouverte : POST /projects/:id/etape
projectsRouter.post(
  '/:id/etape',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthedRequest;
    const id = req.params.id as string;
    const project = await prisma.researchProject.findFirst({
      where: { id, ownerId: authReq.user.id },
    });
    if (!project) throw notFound('Projet');

    const result = await orchestratorClient.runEtape(authReq.user.id, project.id);
    res.json(result);
  })
);

// 6. Détail d'une étape : GET /projects/:id/etape?n=X
projectsRouter.get(
  '/:id/etape',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthedRequest;
    const id = req.params.id as string;
    const n = req.query.n ? parseInt(String(req.query.n), 10) : undefined;
    const project = await prisma.researchProject.findFirst({
      where: { id, ownerId: authReq.user.id },
    });
    if (!project) throw notFound('Projet');

    const detail = await orchestratorClient.getEtapeDetail(authReq.user.id, project.id, n);
    res.json(detail);
  })
);

// 7. Question libre : POST /projects/:id/question
projectsRouter.post(
  '/:id/question',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthedRequest;
    const id = req.params.id as string;
    const question = req.body.question;
    if (!question || typeof question !== 'string' || !question.trim()) {
      res.status(400).json({ error: 'La question est requise' });
      return;
    }
    const project = await prisma.researchProject.findFirst({
      where: { id, ownerId: authReq.user.id },
    });
    if (!project) throw notFound('Projet');

    const routing = await orchestratorClient.askQuestion(authReq.user.id, project.id, question.trim());
    res.json(routing);
  })
);

// 8. Documents : GET /projects/:id/documents
projectsRouter.get(
  '/:id/documents',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthedRequest;
    const id = req.params.id as string;
    const project = await prisma.researchProject.findFirst({
      where: { id, ownerId: authReq.user.id },
    });
    if (!project) throw notFound('Projet');

    const docs = await orchestratorClient.getDocuments(authReq.user.id, project.id);
    res.json(docs);
  })
);

// 8b. Téléchargement PDF : GET /projects/:id/documents/:docId/fichier
projectsRouter.get(
  '/:id/documents/:docId/fichier',
  asyncHandler(async (req, res: Response) => {
    const authReq = req as AuthedRequest;
    const id = String(req.params.id);
    const docId = String(req.params.docId);
    const project = await prisma.researchProject.findFirst({
      where: { id, ownerId: authReq.user.id },
    });
    if (!project) throw notFound('Projet');

    const upstreamRes = await orchestratorClient.getDocumentFileResponse(authReq.user.id, project.id, docId);
    res.setHeader('Content-Type', upstreamRes.headers.get('content-type') || 'application/pdf');
    const disposition = upstreamRes.headers.get('content-disposition');
    if (disposition) {
      res.setHeader('Content-Disposition', disposition);
    } else {
      res.setHeader('Content-Disposition', `attachment; filename="document-${docId}.pdf"`);
    }

    const arrayBuffer = await upstreamRes.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  })
);

// 8c. Bibliographie : GET /projects/:id/bibliographie
projectsRouter.get(
  '/:id/bibliographie',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthedRequest;
    const id = req.params.id as string;
    const format = (req.query.format as string) || 'bibtex';
    const project = await prisma.researchProject.findFirst({
      where: { id, ownerId: authReq.user.id },
    });
    if (!project) throw notFound('Projet');

    const bib = await orchestratorClient.getBibliographie(authReq.user.id, project.id, format);
    if (format === 'bibtex') {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="bibliographie.bib"');
      res.send(bib);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.send(bib);
    }
  })
);

// Mise à jour d'un projet
projectsRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthedRequest;
    const id = req.params.id as string;
    const data = UpdateProjectSchema.parse(req.body);

    const existing = await prisma.researchProject.findFirst({
      where: { id, ownerId: authReq.user.id },
    });
    if (!existing) throw notFound('Projet');

    const updated = await prisma.researchProject.update({
      where: { id },
      data,
    });

    res.json({ project: updated });
  })
);

// Suppression (archivage) d'un projet
projectsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthedRequest;
    const id = req.params.id as string;

    const project = await prisma.researchProject.findFirst({
      where: { id, ownerId: authReq.user.id },
    });
    if (!project) throw notFound('Projet');

    await prisma.researchProject.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.json({ success: true, message: 'Projet archivé' });
  })
);

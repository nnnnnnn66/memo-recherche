// ============================================================================
//  Consultation & Orientation Socratique — Délégué à l'Orchestrateur
//  Règles absolues :
//   - L'orchestrateur est le SEUL interlocuteur (POST /dossiers/{etudiant}/{session}/question)
//   - Aucun appel direct à un modèle de langage
//   - Le site affiche tel quel, sans réécrire ni reformuler
// ============================================================================

import { Router, type Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { consultationMinuteLimiter, consultationDailyLimiter } from '../middleware/rateLimit.js';
import { orchestratorClient } from '../services/orchestratorClient.js';
import type { QuestionRoutingResponse } from '../services/orchestratorClient.js';
import { asyncHandler, notFound } from '../lib/errors.js';
import { blocsDepuisRoutage, reponseDeLEtape } from '../services/productionLecture.js';
import { config } from '../config.js';

export const consultationRouter = Router();
consultationRouter.use(requireAuth);

const ConsultationQuerySchema = z.object({
  projectId: z.string().min(1, 'ID de projet requis'),
  sessionId: z.string().optional(),
  stepId: z.coerce.number().int().positive().optional(),
  prompt: z.string().trim().min(3, 'La requête doit faire au moins 3 caractères').max(
    config.CONSULTATION_MAX_CHARS,
    `Requête limitée à ${config.CONSULTATION_MAX_CHARS} caractères`
  ),
});

// Sessions d'un projet
consultationRouter.get(
  '/projects/:projectId/sessions',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthedRequest;
    const projectId = req.params.projectId as string;

    const project = await prisma.researchProject.findFirst({
      where: { id: projectId, ownerId: authReq.user.id },
    });
    if (!project) throw notFound('Projet');

    const sessions = await prisma.consultationSession.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      include: {
        step: { select: { id: true, title: true } },
        _count: { select: { messages: true } },
      },
    });

    res.json({ sessions });
  })
);

// Création d'une session
consultationRouter.post(
  '/projects/:projectId/sessions',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthedRequest;
    const projectId = req.params.projectId as string;
    const { title, stepId } = req.body || {};

    const project = await prisma.researchProject.findFirst({
      where: { id: projectId, ownerId: authReq.user.id },
    });
    if (!project) throw notFound('Projet');

    const session = await prisma.consultationSession.create({
      data: {
        projectId,
        title: (typeof title === 'string' && title.trim()) ? title.trim().slice(0, 100) : 'Nouvelle consultation',
        stepId: stepId ? Number(stepId) : undefined,
      },
      include: {
        step: { select: { id: true, title: true } },
        _count: { select: { messages: true } },
      },
    });

    res.status(201).json({ session });
  })
);

// Suppression / archivage d'une session
consultationRouter.delete(
  '/sessions/:sessionId',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthedRequest;
    const sessionId = req.params.sessionId as string;

    const session = await prisma.consultationSession.findFirst({
      where: {
        id: sessionId,
        project: { ownerId: authReq.user.id },
      },
    });
    if (!session) throw notFound('Session de consultation');

    await prisma.consultationSession.update({
      where: { id: sessionId },
      data: { deletedAt: new Date() },
    });

    res.json({ success: true, message: 'Session archivée avec succès' });
  })
);

// Messages d'une session
consultationRouter.get(
  '/sessions/:sessionId/messages',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthedRequest;
    const sessionId = req.params.sessionId as string;

    const session = await prisma.consultationSession.findFirst({
      where: {
        id: sessionId,
        project: { ownerId: authReq.user.id },
      },
      include: {
        step: { select: { id: true, title: true } },
      },
    });
    if (!session) throw notFound('Session de consultation');

    const messages = await prisma.consultationMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ session, messages });
  })
);

// Consultation : Question transmise à l'orchestrateur (POST /dossiers/{etudiant}/{session}/question)
consultationRouter.post(
  '/',
  consultationMinuteLimiter,
  consultationDailyLimiter,
  asyncHandler(async (req, res: Response) => {
    const authReq = req as AuthedRequest;
    const data = ConsultationQuerySchema.parse(req.body);

    const project = await prisma.researchProject.findFirst({
      where: { id: data.projectId, ownerId: authReq.user.id },
    });
    if (!project) throw notFound('Projet');

    let sessionId = data.sessionId;
    let session = sessionId
      ? await prisma.consultationSession.findFirst({
          where: { id: sessionId, projectId: project.id },
        })
      : null;

    if (!session) {
      const autoTitle = data.prompt.length > 50 ? `${data.prompt.slice(0, 47)}...` : data.prompt;
      session = await prisma.consultationSession.create({
        data: {
          projectId: project.id,
          stepId: data.stepId,
          title: autoTitle,
        },
      });
      sessionId = session.id;
    }

    const studentMessage = await prisma.consultationMessage.create({
      data: {
        sessionId: session.id,
        role: 'student',
        content: data.prompt,
        status: 'complete',
      },
    });

    // En-têtes Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    res.write(`event: session\ndata: ${JSON.stringify({ sessionId: session.id, studentMessageId: studentMessage.id })}\n\n`);

    try {
      // 1. S'assure que le dossier existe sur l'orchestrateur
      await orchestratorClient.openDossier(authReq.user.id, project.id, {
        sujet: project.title,
        sujet_contexte: project.domain,
      });

      // 2. L'AGENT QUI PORTE LA QUESTION RÉPOND.
      // L'orchestrateur désigne l'étape compétente et fait répondre SON agent à partir du dossier
      // réel ; si la question appartient en fait à une autre étape, il appelle directement cet
      // agent-là. C'est la demande du porteur : l'agent choisi répond à toutes les demandes, et
      // la réponse arrive dans le fil. Répondre n'écrit rien dans le dossier et ne consomme
      // aucune analyse.
      const reponse = await orchestratorClient.interroger(
        authReq.user.id,
        project.id,
        data.prompt
      );
      const routing: QuestionRoutingResponse = reponse.routage ?? {
        etape: null, agent: null, libelle: null, indices: [], confiance: '',
        autres_etapes: [],
      } as unknown as QuestionRoutingResponse;

      const numeroRepondu = reponse.etape ?? undefined;
      const moteur = reponse.agent ? `${reponse.agent}-step${reponse.etape ?? 0}` : 'orchestrator';
      const blocs: string[] = [];

      if (reponse.repondu && reponse.reponse) {
        blocs.push(reponse.reponse);
        if (reponse.relaye_depuis?.libelle) {
          blocs.push(
            `_Ta question ne relevait pas de l'étape « ${reponse.relaye_depuis.libelle} » : ` +
              `je suis allé la poser à l'agent de l'étape « ${reponse.libelle ?? ''} », ` +
              'qui te répond ci-dessus._'
          );
        }
      } else {
        // Jamais de silence ni de fausse réponse : on dit ce qui se passe, avec les mots du porteur.
        blocs.push(
          reponse.message ||
            "Je n'ai pas pu obtenir de réponse à l'instant. Reformule ta question ou réessaie."
        );
      }

      const agentName = reponse.libelle
        ? `Étape ${reponse.etape} — ${reponse.libelle}`
        : reponse.agent || `Agent Étape ${numeroRepondu ?? '?'}`;
      const indices = Array.isArray(routing.indices) ? routing.indices : [];
      const confiance =
        typeof routing.confiance === 'string' ? routing.confiance : String(routing.confiance ?? '');
      const reason = reponse.libelle
        ? `Réponse de l'agent qui porte l'étape ${reponse.etape} — ${reponse.libelle}.`
        : "Question traitée par la plateforme.";

      res.write(`event: agent\ndata: ${JSON.stringify({
        slug: reponse.agent ?? 'orchestrator',
        stepId: numeroRepondu ?? 0,
        name: agentName,
        reason,
        method: 'orchestrator',
        engine: moteur,
        provider: 'memo-platform',
      })}\n\n`);

      // Le rattachement peut être INCERTAIN (deux étapes à égalité) : l'orchestrateur le dit, on le
      // répète à l'étudiant au lieu de faire passer un choix douteux pour une évidence.
      const responseText = blocs.join('\n\n');

      // Découpage en micro-deltas pour une sensation fluide d'affichage
      const chunkSize = 20;
      for (let i = 0; i < responseText.length; i += chunkSize) {
        const chunk = responseText.slice(i, i + chunkSize);
        res.write(`event: delta\ndata: ${JSON.stringify({ text: chunk })}\n\n`);
      }

      // Sauvegarde du message dans la base
      const guideMessage = await prisma.consultationMessage.create({
        data: {
          sessionId: session.id,
          role: 'guide',
          content: responseText,
          status: 'complete',
          // Le MÊME identifiant que dans l'événement `agent` : c'est lui qui permet au site de
          // réafficher le bon agent (nom, icône) quand l'étudiant recharge sa conversation.
          engine: moteur,
        },
      });

      res.write(`event: complete\ndata: ${JSON.stringify({
        messageId: guideMessage.id,
        fullText: responseText,
        engine: moteur,
      })}\n\n`);

      res.end();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      res.write(`event: error\ndata: ${JSON.stringify({ error: errorMsg })}\n\n`);
      if (!res.writableEnded) res.end();
    }
  })
);

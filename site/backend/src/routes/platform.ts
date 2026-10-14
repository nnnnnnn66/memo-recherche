// ============================================================================
//  Passerelle Plateforme & Orchestrateur (FastAPI)
//  Le site affiche, l'orchestrateur produit et vérifie.
//  Tous les appels sont délégués à http://127.0.0.1:8000 (ou ORCHESTRATOR_URL)
// ============================================================================

import { Router, type Response } from 'express';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { orchestratorClient } from '../services/orchestratorClient.js';
import { cleSuivi, demarrer, suivi, vuDeLExterieur } from '../services/etapesEnCours.js';
import { messageDeProduction } from '../services/productionLecture.js';
import { asyncHandler, notFound } from '../lib/errors.js';

export const platformRouter = Router();

// ============================================================================
// 1. Carte du parcours & Agents (Accès public / connecté)
// ============================================================================

// GET /api/parcours : Les 12 étapes de la plateforme
platformRouter.get(
  '/parcours',
  asyncHandler(async (req, res) => {
    const parcours = await orchestratorClient.getParcours();
    res.json(parcours);
  })
);

// GET /api/agents : État des 12 agents et en_ligne
platformRouter.get(
  '/agents',
  asyncHandler(async (req, res) => {
    const agents = await orchestratorClient.getAgents();
    res.json(agents);
  })
);

// ============================================================================
// 2. Opérations Dossier pour l'étudiant connecté
//    etudiant = req.user.id
//    session  = project.id
// ============================================================================
platformRouter.use('/dossiers', requireAuth);

/**
 * Helper : vérifie que le mémoire (projet) appartient bien à l'étudiant
 * et initialise le dossier sur l'orchestrateur si ce n'est pas encore fait.
 */
async function ensureStudentDossier(userId: string, projectId: string) {
  const project = await prisma.researchProject.findFirst({
    where: { id: projectId, ownerId: userId },
  });
  if (!project) throw notFound('Mémoire de recherche');

  // Idempotent : ouvre ou met à jour le dossier sur la plateforme.
  // `sujet_contexte` est un OBJET (une chaîne brute provoque un HTTP 422 et le
  // dossier n'est jamais créé) : la plateforme encapsule une chaîne en
  // `{ contexte: … }`, le client normalise donc toute valeur en objet.
  try {
    await orchestratorClient.openDossier(userId, projectId, {
      sujet: project.title,
      sujet_contexte: { contexte: project.domain },
    });
  } catch (err) {
    // Si l'orchestrateur renvoie une erreur mais que le dossier existe déjà, on continue
    console.warn(`[Orchestrator] Notification ouverture dossier:`, err);
  }

  return project;
}

// 4. GET /api/dossiers/:session : Où en est l'étudiant
platformRouter.get(
  '/dossiers/:session',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthedRequest;
    const session = String(req.params.session);
    await ensureStudentDossier(authReq.user.id, session);

    const dossier = await orchestratorClient.getDossier(authReq.user.id, session);
    res.json(dossier);
  })
);

// ============================================================================
//  La production d'une étape ARRIVE DANS LA CONVERSATION
//  L'écran de chat ne montre plus que le fil et la saisie : ce que les panneaux
//  affichaient (production, verdict, manques, limites, questions) devient un
//  MESSAGE de l'agent — donc persisté, et relisible après un rechargement.
// ============================================================================
async function enregistrerProductionEnConversation(
  projectId: string,
  enveloppe: Record<string, unknown>
): Promise<string | null> {
  const contenu = messageDeProduction(enveloppe);
  if (!contenu) return null;

  const numero = typeof enveloppe.etape === 'number' ? enveloppe.etape : undefined;
  const libelle = typeof enveloppe.libelle === 'string' && enveloppe.libelle
    ? enveloppe.libelle
    : `Étape ${numero ?? ''}`.trim();
  const resultat = (enveloppe.resultat ?? {}) as Record<string, unknown>;
  const agent = typeof resultat.agent === 'string' ? resultat.agent : '';
  const titre = `${libelle} — production de l'agent`.slice(0, 100);

  let session = await prisma.consultationSession.findFirst({
    where: { projectId, title: titre, deletedAt: null },
    orderBy: { updatedAt: 'desc' },
  });
  if (!session) {
    session = await prisma.consultationSession.create({
      data: { projectId, title: titre },
    });
  }

  await prisma.consultationMessage.create({
    data: {
      sessionId: session.id,
      role: 'guide',
      content: contenu,
      status: 'complete',
      // `<agent>-step<N>` : c'est ce que le site lit pour afficher le bon agent (nom, icône).
      engine: `${agent || 'orchestrator'}-step${numero ?? 0}`,
    },
  });
  await prisma.consultationSession.update({
    where: { id: session.id },
    data: { updatedAt: new Date() },
  });
  return session.id;
}

// 5. POST /api/dossiers/:session/etape : LANCER l'étape ouverte et rendre la main TOUT DE SUITE.
//    Le travail continue en arrière-plan ; le site suit l'avancement (GET .../etape/suivi).
//    Pourquoi : une étape dure 20 s à 25 min. Dans la requête, l'écran restait en attente et le lien
//    public COUPAIT au bout de ~2 min (HTTP 524 mesuré) alors que l'agent travaillait encore.
platformRouter.post(
  '/dossiers/:session/etape',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthedRequest;
    const session = String(req.params.session);
    await ensureStudentDossier(authReq.user.id, session);

    const cle = cleSuivi(authReq.user.id, session);
    const dejaEnCours = suivi(cle);
    if (dejaEnCours && dejaEnCours.etat === 'en_cours') {
      // Deuxième clic (ou rechargement) : on NE relance PAS — une analyse est facturée.
      res.status(202).json({
        ...vuDeLExterieur(dejaEnCours),
        message: "Cette étape est déjà en cours : elle continue, inutile de la relancer.",
      });
      return;
    }

    // Numéro de l'étape ouverte, pour l'afficher pendant l'attente.
    let numero: number | undefined;
    try {
      const dossier = await orchestratorClient.getDossier(authReq.user.id, session);
      numero = dossier.etape_ouverte;
    } catch {
      // L'information est une commodité d'affichage : son absence ne bloque pas le lancement.
    }

    const lancement = demarrer(cle, numero, async () => {
      const enveloppe = (await orchestratorClient.runEtape(authReq.user.id, session)) as unknown as
        Record<string, unknown>;
      // La production rejoint la CONVERSATION (message persisté) : c'est désormais là que
      // l'étudiante la lit, l'écran de chat n'ayant plus de panneau de production.
      let sessionConversation: string | null = null;
      try {
        sessionConversation = await enregistrerProductionEnConversation(session, enveloppe);
      } catch (err) {
        console.warn('[Conversation] production non enregistrée :', err);
      }
      return { resultat: enveloppe, sessionId: sessionConversation };
    });

    res.status(202).json({
      ...vuDeLExterieur(lancement.suivi),
      message: lancement.demarre
        ? "L'étape est lancée. Tu peux rester sur cette page : le résultat s'affichera dès qu'il sera prêt."
        : "Cette étape est déjà en cours : elle continue, inutile de la relancer.",
    });
  })
);

// 5 bis. GET /api/dossiers/:session/etape/suivi : où en est le lancement ?
platformRouter.get(
  '/dossiers/:session/etape/suivi',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthedRequest;
    const session = String(req.params.session);
    const courant = suivi(cleSuivi(authReq.user.id, session));
    if (!courant) {
      // Aucun lancement connu (jamais lancé, ou serveur redémarré) : le site lit alors l'état réel
      // du dossier sur la plateforme — la vérité est là-bas, pas dans ce registre.
      res.json({ etat: 'inconnu', etape: null, duree_s: 0 });
      return;
    }
    res.json(vuDeLExterieur(courant));
  })
);

// 6. GET /api/dossiers/:session/etape?n=X : Détail de l'étape pour l'affichage
platformRouter.get(
  '/dossiers/:session/etape',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthedRequest;
    const session = String(req.params.session);
    const n = req.query.n ? parseInt(String(req.query.n), 10) : undefined;
    await ensureStudentDossier(authReq.user.id, session);

    const detail = await orchestratorClient.getEtapeDetail(authReq.user.id, session, n);
    res.json(detail);
  })
);

// 7. POST /api/dossiers/:session/question : Question libre de l'étudiant
platformRouter.post(
  '/dossiers/:session/question',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthedRequest;
    const session = String(req.params.session);
    const question = req.body.question;
    if (!question || typeof question !== 'string' || !question.trim()) {
      res.status(400).json({ error: 'La question est requise' });
      return;
    }

    await ensureStudentDossier(authReq.user.id, session);

    const routing = await orchestratorClient.askQuestion(
      authReq.user.id,
      session,
      question.trim()
    );
    res.json(routing);
  })
);

// 8. GET /api/dossiers/:session/documents : Documents retrouvés
platformRouter.get(
  '/dossiers/:session/documents',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthedRequest;
    const session = String(req.params.session);
    await ensureStudentDossier(authReq.user.id, session);

    const docs = await orchestratorClient.getDocuments(authReq.user.id, session);
    res.json(docs);
  })
);

// 8b. GET /api/dossiers/:session/documents/:doc_id/fichier : Télécharger le PDF réel
platformRouter.get(
  '/dossiers/:session/documents/:docId/fichier',
  asyncHandler(async (req, res: Response) => {
    const authReq = req as AuthedRequest;
    const session = String(req.params.session);
    const docId = String(req.params.docId);
    await ensureStudentDossier(authReq.user.id, session);

    const upstreamRes = await orchestratorClient.getDocumentFileResponse(
      authReq.user.id,
      session,
      docId
    );

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

// 8c. GET /api/dossiers/:session/bibliographie : Télécharger la bibliographie
platformRouter.get(
  '/dossiers/:session/bibliographie',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthedRequest;
    const session = String(req.params.session);
    const format = (req.query.format as string) || 'bibtex';
    await ensureStudentDossier(authReq.user.id, session);

    const bib = await orchestratorClient.getBibliographie(authReq.user.id, session, format);
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

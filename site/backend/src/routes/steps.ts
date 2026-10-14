// ============================================================================
//  Référentiel des Étapes — Délégué à l'Orchestrateur (GET /parcours)
//  Règle 7 : Ne PAS écrire la liste des étapes en dur dans le site.
//  La vérité est celle de la plateforme (12 étapes).
// ============================================================================

import { Router } from 'express';
import { orchestratorClient } from '../services/orchestratorClient.js';
import { asyncHandler, notFound } from '../lib/errors.js';

export const stepsRouter = Router();

// Liste des étapes récupérée dynamiquement depuis l'orchestrateur
stepsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const parcours = await orchestratorClient.getParcours();
    const steps = parcours.map((p) => ({
      id: p.position,
      position: p.position,
      slug: `etape_${p.position}`,
      title: p.libelle,
      libelle: p.libelle,
      description: p.resume,
      resume: p.resume,
      guidance: p.resume,
    }));
    res.json({ steps, parcours });
  })
);

// Détail d'une étape par sa position
stepsRouter.get(
  '/:identifier',
  asyncHandler(async (req, res) => {
    const identifier = String(req.params.identifier);
    const pos = parseInt(identifier, 10);
    const parcours = await orchestratorClient.getParcours();
    const step = parcours.find((p) => p.position === pos);
    if (!step) throw notFound('Étape méthodologique');

    res.json({
      step: {
        id: step.position,
        position: step.position,
        slug: `etape_${step.position}`,
        title: step.libelle,
        libelle: step.libelle,
        description: step.resume,
        resume: step.resume,
        guidance: step.resume,
      },
    });
  })
);

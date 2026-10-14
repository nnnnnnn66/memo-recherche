/**
 * RENDU D'UNE PRODUCTION D'AGENT POUR LA CONVERSATION
 *
 * Décision d'interface : l'écran de chat ne montre QUE la conversation et la saisie. Tout ce que
 * l'écran affichait auparavant dans des panneaux (production de l'agent, verdict du contrôle
 * indépendant, manques, limites, questions) arrive donc DANS LE FIL, comme un message de l'agent —
 * et il est PERSISTÉ, donc il survit à un rechargement de la page.
 *
 * Deux règles tenues ici :
 *  - le texte de l'agent est restitué VERBATIM (jamais un résumé inventé) ;
 *  - les champs de machine (identifiants, versions, horodatages) ne sont pas montrés à l'étudiante.
 */

/** Clés qui portent le texte réellement produit, par ordre de préférence. */
const CLES_SUBSTANCE = [
  'proposition',
  'texte_complet',
  'texte',
  'synthese',
  'synthesis',
  'resume',
  'summary',
  'statement',
  'reformulated',
  'conclusion',
  'protocole',
  'protocol',
];

const LONGUEUR_MINIMALE = 40;
const LONGUEUR_MAXIMALE = 4000;

/** Champs de MACHINE : ils ne disent rien à l'étudiante. */
const CLES_TECHNIQUES = new Set([
  'agent', 'engine', 'provider', 'model', 'version', 'schema_version', 'generated_at',
  'cree_le', 'maj_le', 'updated_at', 'created_at', 'hash', 'sha256', 'research_id',
  'student_id', 'session_id', 'doc_id', 'source_id', 'id', 'code', 'status', 'statut',
  'verification_status', 'verificateur', 'verifier', 'validation',
]);

const SECTIONS: Array<{ cles: string[]; titre: string }> = [
  {
    titre: 'Ce qui reste à préciser',
    cles: ['unknowns', 'missing_information', 'identified_unknowns', 'identified_gaps', 'informations_manquantes'],
  },
  {
    titre: 'Limites de cette production',
    cles: ['limits_of_this_output', 'limites', 'limits', 'identified_limits', 'limites_identifiees'],
  },
  {
    titre: 'Questions à trancher',
    cles: ['questions_for_human', 'questions', 'questions_for_student', 'clarification_questions'],
  },
  {
    titre: 'Points signalés par le contrôle',
    cles: ['verification_flags', 'signalements', 'flags', 'concerns'],
  },
];

/** Phrase d'explication du verdict, pour que « verified » ne reste pas un mot technique. */
const VERDICTS: Record<string, string> = {
  verified: "Rien n'a été contesté par le contrôle indépendant de cette étape.",
  validated: "Rien n'a été contesté par le contrôle indépendant de cette étape.",
  corrected: 'Le contrôle indépendant a signalé des points à corriger ; ils figurent ci-dessous.',
  provisional: "Le contrôle est partiel : certains éléments n'ont pas pu être vérifiés.",
  verification_failed: "Le contrôle indépendant n'a pas pu aboutir : relis cette production avec attention.",
  rejected: 'Le contrôle a émis des réserves sur cette production : à toi de juger, en connaissance de cause.',
  pending: 'Le contrôle indépendant est encore en attente.',
};

function estTechnique(cle: string): boolean {
  return CLES_TECHNIQUES.has(cle) || /_id$/.test(cle) || /^id_/.test(cle);
}

function aplatir(valeur: unknown, profondeur = 0): string[] {
  if (valeur === null || valeur === undefined || valeur === '') return [];
  if (typeof valeur === 'string') {
    const texte = valeur.trim();
    return texte.length >= 3 ? [texte] : [];
  }
  if (typeof valeur === 'number' || typeof valeur === 'boolean') return [String(valeur)];
  if (Array.isArray(valeur)) return valeur.flatMap((element) => aplatir(element, profondeur + 1));
  if (typeof valeur === 'object' && profondeur < 3) {
    const objet = valeur as Record<string, unknown>;
    for (const cle of ['texte', 'message', 'question', 'description', 'libelle', 'label', 'constat', 'manque', 'point']) {
      if (typeof objet[cle] === 'string' && objet[cle]) return [String(objet[cle]).trim()];
    }
    return Object.keys(objet).sort().flatMap((cle) => aplatir(objet[cle], profondeur + 1));
  }
  return [];
}

function estMetadonnee(valeur: string): boolean {
  const v = valeur.trim();
  return (
    /^\d{4}-\d{2}-\d{2}T/.test(v) ||
    /^[0-9a-f]{24,}$/.test(v) ||
    /^[A-Z]\d{1,3}$/.test(v) ||
    v.length < LONGUEUR_MINIMALE
  );
}

/** Le texte que l'agent a réellement produit, restitué tel quel. */
export function extraitProduction(resultat: unknown): string {
  if (!resultat || typeof resultat !== 'object') return '';
  const candidats: Array<{ cle: string; texte: string }> = [];

  const collecter = (cle: string, valeur: unknown, profondeur: number) => {
    if (profondeur > 3) return;
    if (typeof valeur === 'string') {
      if (valeur.trim().length >= LONGUEUR_MINIMALE) candidats.push({ cle, texte: valeur.trim() });
      return;
    }
    if (Array.isArray(valeur)) {
      for (const element of valeur) collecter(cle, element, profondeur + 1);
      return;
    }
    if (valeur && typeof valeur === 'object') {
      for (const [sousCle, sousValeur] of Object.entries(valeur as Record<string, unknown>)) {
        if (estTechnique(sousCle)) continue;
        collecter(sousCle, sousValeur, profondeur + 1);
      }
    }
  };

  for (const [cle, valeur] of Object.entries(resultat as Record<string, unknown>)) {
    if (estTechnique(cle)) continue;
    collecter(cle, valeur, 0);
  }
  const utiles = candidats.filter((c) => !estMetadonnee(c.texte));
  if (utiles.length === 0) return '';

  for (const preferee of CLES_SUBSTANCE) {
    const trouve = utiles.find((c) => c.cle === preferee);
    if (trouve) return couper(trouve.texte);
  }
  return couper(utiles.reduce((a, b) => (b.texte.length > a.texte.length ? b : a)).texte);
}

function couper(texte: string): string {
  if (texte.length <= LONGUEUR_MAXIMALE) return texte;
  return texte.slice(0, LONGUEUR_MAXIMALE).trimEnd() + '\n\n[…] Production tronquée pour l’affichage.';
}

/**
 * Le message que l'étudiante lit dans sa conversation après une étape : verdict du contrôle
 * indépendant, production de l'agent, puis ce qui manque / les limites / les questions.
 *
 * `enveloppe` est la réponse COMPLÈTE de la plateforme :
 * { etape, libelle, statut, verdict, resultat, verificateur, etape_suivante, ... }
 */
export function messageDeProduction(enveloppe: unknown): string {
  if (!enveloppe || typeof enveloppe !== 'object') return '';
  const e = enveloppe as Record<string, unknown>;
  const resultat = (e.resultat ?? {}) as Record<string, unknown>;
  const lignes: string[] = [];

  const libelle = typeof e.libelle === 'string' ? e.libelle : 'Étape';
  lignes.push(`**${libelle}**`);

  const verdict = typeof e.verdict === 'string' ? e.verdict : '';
  if (verdict) {
    lignes.push(`_Contrôle indépendant : ${VERDICTS[verdict.toLowerCase()] ?? verdict}_`);
    const verificateur = (e.verificateur ?? {}) as Record<string, unknown>;
    const corrections = aplatir(verificateur.corrections);
    if (corrections.length > 0) {
      const motif = typeof verificateur.motif === 'string' && verificateur.motif
        ? ` — ${verificateur.motif}` : '';
      lignes.push(`**À corriger${motif}**\n${corrections.map((c) => `- ${c}`).join('\n')}`);
    }
  }

  const production = extraitProduction(resultat);
  if (production) {
    lignes.push(production);
  } else {
    lignes.push(
      "L'agent n'a pas produit de texte rédigé pour cette étape : ni la structure de données ni un " +
        'résumé inventé ne remplacent sa production.'
    );
  }

  for (const section of SECTIONS) {
    for (const source of [resultat, e]) {
      let trouve = false;
      for (const cle of section.cles) {
        if (!(cle in source)) continue;
        const items = aplatir(source[cle]).filter(Boolean);
        if (items.length > 0) {
          lignes.push(`**${section.titre}**\n${items.map((item) => `- ${item}`).join('\n')}`);
          trouve = true;
          break;
        }
      }
      if (trouve) break;
    }
  }

  return lignes.join('\n\n');
}

/**
 * LA RÉPONSE DE L'AGENT D'UNE ÉTAPE CHOISIE.
 *
 * L'étudiante désigne une des 12 étapes : son agent prend la parole. S'il a déjà produit quelque
 * chose pour cette étape, il répond par sa production (et son verdict). S'il n'a rien produit
 * encore, il le DIT et indique le geste à faire — on ne fabrique jamais une réponse.
 *
 * `detail` est la fiche d'étape de la plateforme :
 * { numero, libelle, resume, statut, a_venir, verdict, resultat, inconnues, limites, questions… }
 */
export function reponseDeLEtape(detail: unknown): string {
  if (!detail || typeof detail !== 'object') return '';
  const d = detail as Record<string, unknown>;
  const libelle = typeof d.libelle === 'string' && d.libelle ? d.libelle : 'cette étape';
  const resultat = d.resultat;
  const aProduit =
    !!resultat && typeof resultat === 'object' && Object.keys(resultat as object).length > 0;

  if (!aProduit) {
    const resume = typeof d.resume === 'string' && d.resume ? `\n\n_${d.resume}_` : '';
    const numero = typeof d.numero === 'number' ? ` ${d.numero}` : '';
    return (
      `Je n'ai pas encore travaillé l'étape « ${libelle} » pour ton mémoire.${resume}\n\n` +
      `Lance l'étape${numero} depuis la liste des 12 étapes, et je te répondrai avec ma production, ` +
      'contrôlée par un vérificateur indépendant.'
    );
  }
  return messageDeProduction(d);
}

/**
 * Réponse quand AUCUNE étape n'a été choisie : on s'appuie sur ce que la plateforme a rattaché,
 * en restituant la production réelle — jamais la phrase de renvoi seule.
 */
export function blocsDepuisRoutage(routing: {
  etape?: number | null;
  libelle?: string | null;
  message?: string;
  extrait?: {
    proposition?: string;
    inconnues?: string[];
    questions?: string[];
    signalements?: string[];
  } | null;
}): string[] {
  const blocs: string[] = [];
  const extrait = routing.extrait ?? undefined;
  const production = (extrait?.proposition ?? '').trim();

  const lister = (titre: string, items?: string[]) => {
    const propres = (items ?? []).map((item) => String(item).trim()).filter(Boolean);
    if (propres.length > 0) {
      blocs.push(`**${titre}**\n${propres.map((item) => `- ${item}`).join('\n')}`);
    }
  };

  if (production) {
    blocs.push(production);
    lister('Ce qui reste à préciser', extrait?.inconnues);
    lister('Questions à trancher', extrait?.questions);
    lister('Points signalés par le contrôle indépendant', extrait?.signalements);
  } else if (routing.etape) {
    blocs.push(
      `Je n'ai pas encore de production pour l'étape « ${routing.libelle ?? routing.etape} ». ` +
        'Lance-la et je te répondrai précisément sur ce point.'
    );
  } else {
    blocs.push(routing.message || "Je n'ai pas réussi à rattacher ta question à une étape.");
  }
  return blocs;
}

// ============================================================================
//  Référentiel des 12 Spécialistes Méthodologiques Universitaires (Frontend)
//  Aligné sur le référentiel méthodologique et la nomenclature des 12 étapes.
// ============================================================================

export interface AgentDescriptor {
  id: number;
  position: number;
  slug: string;
  name: string;
  icon: string;
  iconName: string;
  title: string;
  shortDesc: string;
  skills: string[];
  placeholder: string;
  suggestedPrompts: string[];
}

export const ACADEMIC_AGENTS: AgentDescriptor[] = [
  {
    id: 1,
    position: 1,
    slug: 'subject_agent',
    name: 'Spécialiste Sujet',
    icon: 'Compass',
    iconName: 'Compass',
    title: 'Sujet du mémoire',
    shortDesc: 'Délimitation 3D (espace, temps, concept) et faisabilité du terrain',
    skills: [
      'Délimitation spatiale (terrain, entreprise, zone d\'étude)',
      'Délimitation temporelle (période observée)',
      'Faisabilité d\'accès aux données et contacts',
      'Filtrage des sujets trop vastes ou infaisables',
    ],
    placeholder: "Posez votre question au Spécialiste Sujet ou soumettez votre idée de sujet pour cadrer son périmètre...",
    suggestedPrompts: [
      "Comment bien délimiter mon sujet dans l'espace et dans le temps ?",
      "Voici mon idée de sujet : est-elle trop vaste pour un mémoire de Master ?",
      "Comment justifier la pertinence scientifique de mon sujet face au jury ?",
    ],
  },
  {
    id: 2,
    position: 2,
    slug: 'research_problem_agent',
    name: 'Spécialiste Problème',
    icon: 'Search',
    iconName: 'Search',
    title: 'Problème de recherche',
    shortDesc: 'Écart entre la situation observée et la situation attendue',
    skills: [
      'Identification du dysfonctionnement empirique',
      'Formulation du manque à gagner ou de l\'énigme scientifique',
      'Distinction entre problème managérial et problème de recherche',
    ],
    placeholder: "Décrivez le dysfonctionnement ou la tension observée sur le terrain au Spécialiste Problème...",
    suggestedPrompts: [
      "Quelle est la différence entre un problème de gestion et un problème de recherche ?",
      "Voici le dysfonctionnement constaté sur mon terrain : comment en faire un problème scientifique ?",
      "Quelles données chiffrées dois-je apporter pour attester de la réalité de mon problème ?",
    ],
  },
  {
    id: 3,
    position: 3,
    slug: 'literature_review_agent',
    name: 'Spécialiste Revue de littérature',
    icon: 'BookOpen',
    iconName: 'BookOpen',
    title: 'Revue de littérature',
    shortDesc: 'État de l\'art, cartographie des auteurs et détection du gap scientifique',
    skills: [
      'Structuration par courants conceptuels (anti-catalogue)',
      'Confrontation des thèses divergentes d\'auteurs',
      'Mise en valeur du vide théorique (research gap)',
    ],
    placeholder: "Échangez avec le Spécialiste Revue de littérature sur vos auteurs et votre cadre théorique...",
    suggestedPrompts: [
      "Comment organiser ma revue de littérature par concepts plutôt que par liste d'auteurs ?",
      "Comment faire ressortir le vide théorique (le GAP) que mon travail va combler ?",
      "Quels critères pour sélectionner les 5 articles scientifiques de référence sur mon thème ?",
    ],
  },
  {
    id: 4,
    position: 4,
    slug: 'problematization_agent',
    name: 'Spécialiste Problématique',
    icon: 'Layers',
    iconName: 'Layers',
    title: 'Problématique',
    shortDesc: 'Angle d\'attaque théorique reliant le problème concret aux concepts',
    skills: [
      'Articulation problème de terrain / théories scientifiques',
      'Définition du prisme d\'analyse précis',
      'Posture critique sans préjuger de la réponse',
    ],
    placeholder: "Soumettez votre articulation conceptuelle au Spécialiste Problématique...",
    suggestedPrompts: [
      "Comment articuler mon constat de terrain avec mon cadre théorique ?",
      "Sous quel angle d'attaque conceptuel puis-je aborder cette énigme ?",
      "Ma problématique est-elle formulée de façon neutre et scientifiquement rigoureuse ?",
    ],
  },
  {
    id: 5,
    position: 5,
    slug: 'research_question_agent',
    name: 'Spécialiste Question de recherche',
    icon: 'HelpCircle',
    iconName: 'HelpCircle',
    title: 'Question de recherche',
    shortDesc: 'Architecture de la question centrale ouverte et des questions spécifiques',
    skills: [
      'Formulation d\'une question principale ouverte et testable',
      'Déclinaison en 2 à 3 questions secondaires complémentaires',
      'Élimination des questions fermées (oui/non)',
    ],
    placeholder: "Formulez votre question principale et vos sous-questions avec le Spécialiste Question de recherche...",
    suggestedPrompts: [
      "Ma question centrale est-elle suffisamment ouverte et orientée vers le terrain ?",
      "Comment décliner ma question principale en 2 ou 3 questions secondaires cohérentes ?",
      "Quels mots d'accroche recommandez-vous pour éviter une réponse fermée par oui/non ?",
    ],
  },
  {
    id: 6,
    position: 6,
    slug: 'research_objectives_agent',
    name: 'Spécialiste Objectifs',
    icon: 'Target',
    iconName: 'Target',
    title: 'Objectifs de recherche',
    shortDesc: 'Opérationnalisation des visées avec verbes d\'action mesurables',
    skills: [
      'Objectif général aligné avec la question principale',
      'Objectifs spécifiques mesurables (Identifier, Évaluer, Modéliser...)',
      'Correspondance bijective question/objectif',
    ],
    placeholder: "Soumettez vos objectifs opérationnels au Spécialiste Objectifs...",
    suggestedPrompts: [
      "Quels verbes d'action scientifiques me conseillez-vous pour mes objectifs spécifiques ?",
      "Mes objectifs correspondent-ils bien point par point à mes questions de recherche ?",
      "Comment transformer une intention floue en objectif scientifique vérifiable ?",
    ],
  },
  {
    id: 7,
    position: 7,
    slug: 'research_hypotheses_agent',
    name: 'Spécialiste Hypothèses',
    icon: 'Lightbulb',
    iconName: 'Lightbulb',
    title: 'Hypothèses de recherche',
    shortDesc: 'Relations entre variables (X -> Y) et testabilité empirique',
    skills: [
      'Identification des variables indépendantes et dépendantes',
      'Formulation de postulats réfutables et vérifiables sur le terrain',
      'Élimination des évidences et des jugements de valeur',
    ],
    placeholder: "Proposez vos hypothèses de travail au Spécialiste Hypothèses pour tester leur réfutabilité...",
    suggestedPrompts: [
      "Quelles sont mes variables indépendantes (causes) et dépendantes (effets) ?",
      "Mes hypothèses sont-elles formulées de manière à pouvoir être infirmées sur le terrain ?",
      "Comment éviter de formuler des hypothèses évidentes ou tautologiques ?",
    ],
  },
  {
    id: 8,
    position: 8,
    slug: 'methodology_diagnostic_agent',
    name: 'Spécialiste Diagnostic',
    icon: 'Scale',
    iconName: 'Scale',
    title: 'Diagnostic méthodologique',
    shortDesc: 'Posture épistémologique et choix de la démarche (déductive/inductive)',
    skills: [
      'Paradigme épistémologique (positivisme, interprétativisme, constructivisme)',
      'Démarche logique (déductive, inductive, abductive)',
      'Harmonie entre nature des hypothèses et paradigme',
    ],
    placeholder: "Interrogez le Spécialiste Diagnostic sur votre posture épistémologique et votre démarche...",
    suggestedPrompts: [
      "Dois-je choisir une posture positiviste ou interprétativiste pour mon sujet ?",
      "Quelle est la différence concrète entre démarche déductive et inductive sur le terrain ?",
      "Mon choix épistémologique est-il cohérent avec mes hypothèses ?",
    ],
  },
  {
    id: 9,
    position: 9,
    slug: 'methodology_agent',
    name: 'Spécialiste Méthodologie',
    icon: 'MapPin',
    iconName: 'MapPin',
    title: 'Méthodologie & Terrain',
    shortDesc: 'Protocole d\'enquête, échantillon, outils de collecte et cadre d\'analyse',
    skills: [
      'Définition de la population cible et échantillonnage',
      'Conception du guide d\'entretien ou du questionnaire',
      'Plan d\'analyse des données (statistique, analyse thématique)',
    ],
    placeholder: "Soumettez votre protocole de collecte et votre échantillonnage au Spécialiste Méthodologie...",
    suggestedPrompts: [
      "Quelle taille d'échantillon minimale me faut-il pour que mes résultats soient fiables ?",
      "Comment construire une grille d'entretien semi-directif couvrant toutes mes variables ?",
      "Quelles précautions déontologiques dois-je mentionner pour mon enquête de terrain ?",
    ],
  },
  {
    id: 10,
    position: 10,
    slug: 'research_results_analysis_agent',
    name: 'Spécialiste Résultats',
    icon: 'BarChart3',
    iconName: 'BarChart3',
    title: 'Analyse des résultats',
    shortDesc: 'Présentation factuelle, confrontation aux hypothèses et discussion',
    skills: [
      'Distinction entre présentation des données et discussion scientifique',
      'Confrontation méthodique aux hypothèses initiales',
      'Croisement avec les auteurs de la revue de littérature',
    ],
    placeholder: "Partagez vos données de dépouillement avec le Spécialiste Résultats pour structurer la discussion...",
    suggestedPrompts: [
      "Une de mes hypothèses est infirmée par le terrain : comment la valoriser dans mon mémoire ?",
      "Comment structurer la discussion de mes résultats en lien avec les auteurs de ma revue ?",
      "Comment séparer la présentation pure des résultats et leur interprétation critique ?",
    ],
  },
  {
    id: 11,
    position: 11,
    slug: 'research_coherence_verifier',
    name: 'Spécialiste Cohérence Globale',
    icon: 'ShieldCheck',
    iconName: 'ShieldCheck',
    title: 'Vérificateur de cohérence',
    shortDesc: 'Audit de bout en bout de l\'alignement constructif de toute la recherche',
    skills: [
      'Contrôle de la chaîne causale Sujet -> Objectifs -> Méthode -> Résultats',
      'Détection des ruptures logiques et des contresens méthodologiques',
      'Évaluation de la solidité scientifique globale',
    ],
    placeholder: "Demandez au Spécialiste Cohérence Globale d'auditer l'alignement de l'ensemble de votre mémoire...",
    suggestedPrompts: [
      "Pouvez-vous auditer la cohérence entre ma question centrale, mes hypothèses et mes résultats ?",
      "Y a-t-il un décalage entre mon sujet de départ et ce que j'ai réellement mesuré sur le terrain ?",
      "Quels points faibles un jury universitaire pourrait-il attaquer dans ma démarche ?",
    ],
  },
  {
    id: 12,
    position: 12,
    slug: 'research_conclusion_agent',
    name: 'Spécialiste Conclusion',
    icon: 'GraduationCap',
    iconName: 'GraduationCap',
    title: 'Conclusion & Perspectives',
    shortDesc: 'Synthèse des réponses, apports managériaux/théoriques, limites et ouverture',
    skills: [
      'Réponse synthétique à la question centrale',
      'Valorisation des contributions managériales et académiques',
      'Reconnaissance lucide et honnête des limites de l\'étude',
      'Ouverture vers des perspectives de recherches futures',
    ],
    placeholder: "Structurez votre conclusion, vos apports et vos limites avec le Spécialiste Conclusion...",
    suggestedPrompts: [
      "Comment formuler de manière percutante la réponse finale à ma question centrale ?",
      "Quelles sont les limites méthodologiques acceptables à reconnaître devant le jury ?",
      "Comment ouvrir sur de futures perspectives de recherche sans dévaloriser mon travail ?",
    ],
  },
];

export function getAgentByIdOrSlug(idOrSlug?: number | string): AgentDescriptor {
  if (!idOrSlug) return ACADEMIC_AGENTS[0];
  if (typeof idOrSlug === 'number') {
    return ACADEMIC_AGENTS.find((a) => a.id === idOrSlug) || ACADEMIC_AGENTS[0];
  }
  return ACADEMIC_AGENTS.find((a) => a.slug === idOrSlug) || ACADEMIC_AGENTS[0];
}

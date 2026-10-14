import { PrismaClient } from '@prisma/client';

declare const process: { exit: (code?: number) => never };

const prisma = new PrismaClient();

/**
 * Les 12 étapes méthodologiques de la plateforme Mémoire de Recherche
 * Alignées sur l'architecture des 12 agents méthodologiques universitaires.
 */
const STEPS = [
  {
    id: 1,
    position: 1,
    slug: 'subject_agent',
    title: 'Sujet du mémoire',
    description: 'Choisir, délimiter et justifier un sujet de recherche pertinent, faisable et ancré dans le contexte académique.',
    guidance: 'Délimitez votre sujet selon trois dimensions : spatiale (terrain d\'étude), temporelle (période observée) et conceptuelle (champ disciplinaire). Vérifiez l\'accessibilité des données et la faisabilité dans les délais impartis.',
  },
  {
    id: 2,
    position: 2,
    slug: 'research_problem_agent',
    title: 'Problème de recherche',
    description: 'Identifier l\'écart entre une situation observée (le constat de terrain) et une situation souhaitée ou théorique.',
    guidance: 'Formulez le problème sous forme d\'une tension ou d\'une contradiction : qu\'est-ce qui pose problème ? Pourquoi ce dysfonctionnement ou ce manque de connaissances mérite-t-il une investigation scientifique ?',
  },
  {
    id: 3,
    position: 3,
    slug: 'literature_review_agent',
    title: 'Revue de littérature',
    description: 'Recenser, synthétiser et confronter l\'état de l\'art scientifique sur votre thème.',
    guidance: 'Structurez votre revue par axes thématiques et théoriques plutôt que par liste d\'auteurs. Confrontez les thèses convergentes et divergentes pour faire émerger le vide théorique que comblera votre étude.',
  },
  {
    id: 4,
    position: 4,
    slug: 'problematization_agent',
    title: 'Problématique',
    description: 'Construire l\'angle d\'attaque théorique et conceptuel pour aborder le problème de recherche.',
    guidance: 'La problématique articule le problème concret avec les théories scientifiques mobilisées. Elle démontre sous quel prisme d\'analyse précis vous allez interroger votre objet de recherche.',
  },
  {
    id: 5,
    position: 5,
    slug: 'research_question_agent',
    title: 'Question de recherche',
    description: 'Formuler la question principale (centrale) et la décliner en questions spécifiques d\'investigation.',
    guidance: 'La question principale doit être ouverte, précise et orientée vers la recherche empirique. Déclinez-la en 2 à 3 questions secondaires qui exploreront chacune une facette de la problématique.',
  },
  {
    id: 6,
    position: 6,
    slug: 'research_objectives_agent',
    title: 'Objectifs de recherche',
    description: 'Fixer la visée opérationnelle de l\'étude : objectif général et objectifs spécifiques mesurables.',
    guidance: 'Faites correspondre chaque question à un objectif. Commencez toujours par un verbe d\'action scientifique observable (déterminer, évaluer, modéliser, comparer, analyser).',
  },
  {
    id: 7,
    position: 7,
    slug: 'research_hypotheses_agent',
    title: 'Hypothèses',
    description: 'Formuler des réponses anticipées, plausibles et empiriquement vérifiables aux questions posées.',
    guidance: 'Une bonne hypothèse énonce une relation postulée entre deux variables ou dimensions (ex: "La variable X influence positivement Y"). Elle doit pouvoir être confirmée ou infirmée sur le terrain.',
  },
  {
    id: 8,
    position: 8,
    slug: 'methodology_diagnostic_agent',
    title: 'Diagnostic / orientation méthodologique',
    description: 'Évaluer la faisabilité méthodologique et choisir la posture épistémologique et la démarche.',
    guidance: 'Choisissez et justifiez votre paradigme (positiviste, interprétatif, constructiviste) et votre démarche (inductive, déductive ou abductive) en fonction de la nature de vos hypothèses et de l\'accès au terrain.',
  },
  {
    id: 9,
    position: 9,
    slug: 'methodology_agent',
    title: 'Méthodologie',
    description: 'Détailler le protocole d\'enquête : population cible, échantillonnage, outils de collecte et cadre d\'analyse.',
    guidance: 'Précisez l\'approche (quantitative, qualitative ou mixte), la taille et la méthode d\'échantillonnage, la construction des outils (questionnaire, guide d\'entretien) et les considérations déontologiques.',
  },
  {
    id: 10,
    position: 10,
    slug: 'research_results_analysis_agent',
    title: 'Analyse des résultats',
    description: 'Traiter les données recueillies, présenter les résultats factuels et les discuter scientifiquement.',
    guidance: 'Présentez d\'abord les résultats bruts structurés (tableaux, graphiques, verbatim), puis confrontez-les directement à vos hypothèses et aux auteurs clés cités dans votre revue de littérature.',
  },
  {
    id: 11,
    position: 11,
    slug: 'research_coherence_verifier',
    title: 'Vérificateur global de cohérence',
    description: 'Vérifier l\'alignement strict et l\'harmonie de l\'ensemble de l\'édifice de recherche (alignement constructif).',
    guidance: 'Vérifiez la chaîne de cohérence : Sujet → Problème → Question centrale → Objectifs → Hypothèses → Méthodologie → Résultats. Assurez-vous qu\'aucune contradiction ou rupture logique n\'existe.',
  },
  {
    id: 12,
    position: 12,
    slug: 'research_conclusion_agent',
    title: 'Conclusion',
    description: 'Synthétiser les apports majeurs, identifier les limites scientifiques et proposer des perspectives d\'ouverture.',
    guidance: 'Rappelez la réponse à la question centrale, valorisez vos contributions managériales ou académiques, reconnaissez avec honnêteté les limites de l\'étude et ouvrez sur de futures pistes de recherche.',
  },
];

async function main() {
  for (const step of STEPS) {
    await prisma.methodologyStep.upsert({
      where: { id: step.id },
      update: {
        title: step.title,
        description: step.description,
        guidance: step.guidance,
        slug: step.slug,
        position: step.position,
      },
      create: step,
    });
  }
  console.log(`✔ ${STEPS.length} étapes méthodologiques initialisées dans la base.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

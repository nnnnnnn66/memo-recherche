import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
/** Les 9 étapes du parcours méthodologique (référentiel stable). */
const STEPS = [
    {
        id: 1, position: 1, slug: 'sujet', title: 'Le sujet',
        description: 'Choisir, délimiter et justifier un sujet de recherche pertinent et faisable.',
        guidance: 'Un bon sujet est précis (lieu, période, population), faisable (accès aux données, délais) et original. Formulez-le en une phrase, puis justifiez son intérêt scientifique et social.',
    },
    {
        id: 2, position: 2, slug: 'problematique', title: 'La problématique',
        description: 'Transformer le sujet en question de recherche centrale.',
        guidance: 'Partez du constat (le contexte), identifiez le problème (l’écart ou la tension), puis formulez une question centrale ouverte, déclinée en questions spécifiques.',
    },
    {
        id: 3, position: 3, slug: 'hypotheses-objectifs', title: 'Hypothèses et objectifs',
        description: 'Formuler des réponses provisoires vérifiables et fixer les objectifs de l’étude.',
        guidance: 'Chaque hypothèse doit être vérifiable et liée à une question spécifique. L’objectif général répond à la question centrale ; les objectifs spécifiques commencent par un verbe d’action (identifier, analyser, évaluer).',
    },
    {
        id: 4, position: 4, slug: 'revue-litterature', title: 'La revue de littérature',
        description: 'Situer la recherche dans l’état des connaissances.',
        guidance: 'Organisez la revue par thèmes ou courants, non par auteur. Confrontez les travaux, repérez les limites et montrez la place de votre recherche. Citez des sources vérifiables (normes APA ou ISO 690).',
    },
    {
        id: 5, position: 5, slug: 'cadre-theorique', title: 'Le cadre théorique et conceptuel',
        description: 'Définir les concepts clés et la théorie mobilisée.',
        guidance: 'Définissez chaque concept, puis opérationnalisez-le en dimensions et indicateurs mesurables. Justifiez le choix de la théorie de référence.',
    },
    {
        id: 6, position: 6, slug: 'methodologie', title: 'La méthodologie',
        description: 'Justifier l’approche, la population, l’échantillon et les outils.',
        guidance: 'Précisez l’approche (qualitative, quantitative, mixte), le terrain, la population, la technique d’échantillonnage, les outils (questionnaire, entretien, grille) et les considérations éthiques.',
    },
    {
        id: 7, position: 7, slug: 'collecte-donnees', title: 'La collecte des données',
        description: 'Préparer et conduire le travail de terrain.',
        guidance: 'Pré-testez vos outils, planifiez le calendrier, documentez les difficultés rencontrées et assurez la confidentialité des répondants.',
    },
    {
        id: 8, position: 8, slug: 'analyse-resultats', title: 'Analyse et discussion des résultats',
        description: 'Présenter, interpréter et discuter les résultats.',
        guidance: 'Présentez les résultats de façon factuelle (tableaux, graphiques commentés), puis discutez-les à la lumière des hypothèses et de la revue de littérature.',
    },
    {
        id: 9, position: 9, slug: 'redaction-soutenance', title: 'Rédaction finale et soutenance',
        description: 'Finaliser le document et préparer la soutenance.',
        guidance: 'Soignez l’introduction et la conclusion, harmonisez les références, relisez la cohérence d’ensemble. Pour la soutenance, préparez une présentation de 15 à 20 minutes centrée sur la démarche et les apports.',
    },
];
async function main() {
    for (const step of STEPS) {
        await prisma.methodologyStep.upsert({
            where: { id: step.id },
            update: { title: step.title, description: step.description, guidance: step.guidance, slug: step.slug, position: step.position },
            create: step,
        });
    }
    console.log(`✔ ${STEPS.length} étapes méthodologiques initialisées.`);
}
main()
    .catch((err) => {
    console.error(err);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());

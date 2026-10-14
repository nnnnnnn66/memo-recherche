// ============================================================================
//  Simulateur / Serveur de Test de l'Orchestrateur (FastAPI spec) sur 127.0.0.1:8000
//  Reproduit l'interface exacte de la plateforme Python pour les tests locaux
// ============================================================================

import http from 'http';

const PORT = 8000;
const HOST = '127.0.0.1';

// 1. Les 12 étapes de la plateforme
const PARCOURS = [
  { position: 1, libelle: 'Sujet du mémoire', resume: 'Délimitation 3D (espace, temps, concept) et faisabilité du terrain' },
  { position: 2, libelle: 'Problème de recherche', resume: 'Écart entre la situation observée et attendue' },
  { position: 3, libelle: 'Revue de littérature', resume: 'Synthèse critique des théories et état de l\'art' },
  { position: 4, libelle: 'Problématique', resume: 'Tension centrale et paradoxe scientifique' },
  { position: 5, libelle: 'Question de recherche', resume: 'Question principale et questions spécifiques' },
  { position: 6, libelle: 'Objectifs de recherche', resume: 'Objectif général et objectifs opérationnels' },
  { position: 7, libelle: 'Hypothèses de recherche', resume: 'Hypothèses réfutables et variables' },
  { position: 8, libelle: 'Orientation méthodologique', resume: 'Positionnement épistémologique et diagnostic' },
  { position: 9, libelle: 'Méthodologie et protocole', resume: 'Outils de collecte, échantillonnage et terrain' },
  { position: 10, libelle: 'Analyse des résultats', resume: 'Traitement des données empiriques et triangulation' },
  { position: 11, libelle: 'Vérification globale', resume: 'Contrôle d\'intégrité conceptuelle et cohérence' },
  { position: 12, libelle: 'Conclusion et perspectives', resume: 'Apports académiques, limites et prolongements' },
];

// 2. Les 12 agents
const AGENTS = PARCOURS.map((p, idx) => ({
  id: p.position,
  libelle: p.libelle,
  slug: `agent_${p.position}`,
  en_ligne: true,
}));

// In-memory dossiers for simulation
interface DossierMemory {
  etudiant: string;
  session: string;
  sujet: string;
  sujet_contexte: string;
  etape_ouverte: number;
  statut: string;
  quota_restant: number;
  avancement: number;
  productions: Record<number, any>;
}

const dossiers: Record<string, DossierMemory> = {};

function getOrCreateDossier(etudiant: string, session: string): DossierMemory {
  const key = `${etudiant}:${session}`;
  if (!dossiers[key]) {
    dossiers[key] = {
      etudiant,
      session,
      sujet: 'Mémoire de recherche universitaire',
      sujet_contexte: 'Sciences de gestion / Économie',
      etape_ouverte: 1,
      statut: 'en_cours',
      quota_restant: 25,
      avancement: 8,
      productions: {},
    };
  }
  return dossiers[key];
}

// PDF valide minimal en bytes
const VALID_PDF = Buffer.from(
  '%PDF-1.4\n' +
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n' +
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n' +
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n' +
    '4 0 obj\n<< /Length 58 >>\nstream\n' +
    'BT /F1 12 Tf 72 712 Td (Plateforme Memoire Recherche - Document Officiel) Tj ET\n' +
    'endstream\nendobj\n' +
    'xref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000216 00000 n \n' +
    'trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n324\n%%EOF\n',
  'utf-8'
);

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${HOST}:${PORT}`);
  const pathname = url.pathname;
  const method = req.method || 'GET';

  // Helper read body
  let bodyJson: any = {};
  if (method === 'POST' || method === 'PUT') {
    const buffers: Buffer[] = [];
    for await (const chunk of req) {
      buffers.push(chunk);
    }
    const raw = Buffer.concat(buffers).toString('utf-8');
    if (raw) {
      try {
        bodyJson = JSON.parse(raw);
      } catch {
        bodyJson = {};
      }
    }
  }

  // 1. GET /parcours
  if (method === 'GET' && pathname === '/parcours') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(PARCOURS));
    return;
  }

  // 2. GET /agents
  if (method === 'GET' && pathname === '/agents') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        en_ligne: AGENTS.length,
        total: AGENTS.length,
        agents: AGENTS,
      })
    );
    return;
  }

  // Dossiers regex routing: /dossiers/{etudiant}/{session}(/.*)?
  const dossierMatch = pathname.match(/^\/dossiers\/([^/]+)\/([^/]+)(\/.*)?$/);
  if (dossierMatch) {
    const etudiant = decodeURIComponent(dossierMatch[1]);
    const session = decodeURIComponent(dossierMatch[2]);
    const subpath = dossierMatch[3] || '';
    const dossier = getOrCreateDossier(etudiant, session);

    // 3. POST /dossiers/{etudiant}/{session}
    if (method === 'POST' && subpath === '') {
      if (bodyJson.sujet) dossier.sujet = bodyJson.sujet;
      if (bodyJson.sujet_contexte) dossier.sujet_contexte = bodyJson.sujet_contexte;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', dossier }));
      return;
    }

    // 4. GET /dossiers/{etudiant}/{session}
    if (method === 'GET' && subpath === '') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          etudiant: dossier.etudiant,
          session: dossier.session,
          etape_ouverte: dossier.etape_ouverte,
          statut: dossier.statut,
          quota_restant: dossier.quota_restant,
          avancement: dossier.avancement,
          sujet: dossier.sujet,
          sujet_contexte: dossier.sujet_contexte,
        })
      );
      return;
    }

    // 5. POST /dossiers/{etudiant}/{session}/etape (Lancer l'étape ouverte)
    if (method === 'POST' && subpath === '/etape') {
      const currentEtape = dossier.etape_ouverte;
      const stepInfo = PARCOURS.find((p) => p.position === currentEtape) || PARCOURS[0];
      const nextEtape = currentEtape < 12 ? currentEtape + 1 : 12;

      // Décrémenter le quota
      if (dossier.quota_restant > 0) dossier.quota_restant--;
      dossier.avancement = Math.min(100, Math.round((nextEtape / 12) * 100));

      const production = {
        titre: `Délimitation et cadrage pour : ${dossier.sujet}`,
        contexte: dossier.sujet_contexte,
        analyse_academique: `Analyse méthodologique certifiée produite par le spécialiste ${stepInfo.libelle}. Respect rigoureux des critères LMD.`,
        recommandations: [
          'Préciser le cadre théorique de référence',
          'Vérifier la faisabilité des entretiens semi-directifs sur le terrain',
        ],
      };

      dossier.productions[currentEtape] = production;

      // Décision automatique : étape vérifiée -> étape suivante ouverte automatiquement
      dossier.etape_ouverte = nextEtape;

      const responsePayload = {
        etape: currentEtape,
        libelle: stepInfo.libelle,
        statut: 'proposee',
        verdict: 'verified',
        resultat: production,
        verificateur: {
          verdict: 'verified',
          corrections: [],
          motif: 'Conformité académique validée avec succès par le vérificateur indépendant.',
        },
        quota_restant: dossier.quota_restant,
        decision_automatique: true,
        etape_suivante: nextEtape,
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(responsePayload));
      return;
    }

    // 6. GET /dossiers/{etudiant}/{session}/etape?n=X
    if (method === 'GET' && subpath === '/etape') {
      const nQuery = url.searchParams.get('n');
      const n = nQuery ? parseInt(nQuery, 10) : dossier.etape_ouverte;
      const stepInfo = PARCOURS.find((p) => p.position === n) || PARCOURS[0];

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          etape: n,
          libelle: stepInfo.libelle,
          proposition: dossier.productions[n] || `Proposition méthodologique pour l'étape ${n} (${stepInfo.libelle}).`,
          inconnues: ['Accessibilité des rapports annuels internes'],
          limites: ['Échantillon restreint aux entreprises du secteur formel'],
          questions: [
            'Quelle méthode de triangulation comptez-vous appliquer sur votre terrain ?',
          ],
          verdict: 'verified',
          verificateur: {
            verdict: 'verified',
            corrections: [],
            motif: 'Production conforme aux normes du protocole de recherche.',
          },
          statut: n < dossier.etape_ouverte ? 'validee' : 'ouverte',
        })
      );
      return;
    }

    // 7. POST /dossiers/{etudiant}/{session}/question (Question libre)
    if (method === 'POST' && subpath === '/question') {
      const question = bodyJson.question || '';
      // Détermination intelligente de l'étape
      let designatedEtape = 5; // default question de recherche
      let designatedAgent = 'Spécialiste Question de recherche';
      let motsReconnus = ['recherche', 'question'];

      if (/échantillon|terrain|questionnaire|entretien|méthode/i.test(question)) {
        designatedEtape = 9;
        designatedAgent = 'Spécialiste Méthodologie et protocole';
        motsReconnus = ['échantillon', 'terrain', 'méthode'];
      } else if (/problématique|paradoxe/i.test(question)) {
        designatedEtape = 4;
        designatedAgent = 'Spécialiste Problématique';
        motsReconnus = ['problématique'];
      } else if (/hypothèse/i.test(question)) {
        designatedEtape = 7;
        designatedAgent = 'Spécialiste Hypothèses de recherche';
        motsReconnus = ['hypothèse'];
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          etape: designatedEtape,
          agent: designatedAgent,
          confiance: 0.94,
          mots_reconnus: motsReconnus,
          reponse: `L'orchestrateur a orienté votre interrogation vers l'Étape ${designatedEtape} (${designatedAgent}) au vu des termes identifiés [${motsReconnus.join(', ')}]. Sur le plan méthodologique : votre approche doit être validée empiriquement selon les normes du jury.`,
        })
      );
      return;
    }

    // 8a. GET /dossiers/{etudiant}/{session}/documents
    if (method === 'GET' && subpath === '/documents') {
      const documents = [
        {
          id: 'doc-001',
          titre: 'Guide méthodologique de rédaction du mémoire de Master LMD',
          auteur: 'Commission Pédagogique Universitaire',
          annee: 2024,
          resume: 'Cadre normatif pour l\'élaboration des travaux de recherche en sciences humaines et de gestion.',
          nom_fichier: 'guide_methodologique_master_lmd.pdf',
        },
        {
          id: 'doc-002',
          titre: 'Épistémologie et méthodologie de la recherche en sciences de gestion',
          auteur: 'Koffi, N. & Collaborateurs',
          annee: 2023,
          resume: 'Ouvrage de référence sur les protocoles qualitatifs et quantitatifs.',
          nom_fichier: 'epistemologie_sciences_gestion.pdf',
        },
      ];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(documents));
      return;
    }

    // 8b. GET /dossiers/{etudiant}/{session}/documents/{doc_id}/fichier
    const docFileMatch = subpath.match(/^\/documents\/([^/]+)\/fichier$/);
    if (method === 'GET' && docFileMatch) {
      const docId = docFileMatch[1];
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="document-${docId}.pdf"`,
        'Content-Length': VALID_PDF.length,
      });
      res.end(VALID_PDF);
      return;
    }

    // 8c. GET /dossiers/{etudiant}/{session}/bibliographie?format=bibtex
    if (method === 'GET' && subpath === '/bibliographie') {
      const bibtexContent = `@article{koffi2024guide,
  title={Guide méthodologique de rédaction du mémoire de Master LMD},
  author={Koffi, Nahomie},
  journal={Revue Universitaire de Recherche et Méthodologie},
  volume={12},
  number={1},
  pages={45--72},
  year={2024}
}

@book{gestion2023methodologie,
  title={Épistémologie et méthodologie de la recherche},
  author={Commission Pédagogique},
  publisher={Presses Académiques},
  year={2023}
}`;
      res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename="bibliographie.bib"',
      });
      res.end(bibtexContent);
      return;
    }
  }

  // 404 fallback
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: `Route non trouvée sur l'orchestrateur: ${method} ${pathname}` }));
});

server.listen(PORT, HOST, () => {
  console.log(`=======================================================`);
  console.log(`  Orchestrateur Plateforme (Simulation Conforme)`);
  console.log(`  Écoute locale sur : http://${HOST}:${PORT}`);
  console.log(`  Routes : /parcours, /agents, /dossiers/:etudiant/:session/*`);
  console.log(`=======================================================`);
});

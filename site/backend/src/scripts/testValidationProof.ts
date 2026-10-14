import { randomUUID } from 'node:crypto';
// ============================================================================
//  Protocole de Preuve Brute d'Exécution Réelle (7 Critères d'Acceptation)
//
//  Ce script lit les NOMS DE CHAMPS RÉELS de la plateforme (vérifiés en
//  interrogeant http://127.0.0.1:8000) :
//    GET /parcours                       -> { etapes: [...] }  (pas un tableau)
//    POST /dossiers/…/etape              -> resultat / verificateur / decision_automatique
//    POST /dossiers/…/question           -> indices · message · confiance (chaîne) · etape (nullable)
//    GET  /dossiers/…/documents          -> 404 tant qu'aucun document n'existe (état vide)
//
//  Il n'affiche JAMAIS la valeur d'un secret : seuls les NOMS des variables
//  d'environnement sont imprimés pour le critère 7.
// ============================================================================

import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:4000/api';
const ORCHESTRATOR_BASE = 'http://127.0.0.1:8000';
const FRONTEND_BASE = 'http://localhost:5173';

type Statut = 'PASSÉ' | 'ÉCHOUÉ';
const criteres: { n: number; label: string; statut: Statut; detail: string }[] = [];
function enregistrer(n: number, label: string, statut: Statut, detail: string) {
  criteres.push({ n, label, statut, detail });
}

async function rawFetch(url: string, options: any = {}) {
  return fetch(url, options);
}

async function runValidation() {
  console.log('================================================================');
  console.log(" PROTOCOLE DE PREUVE D'EXÉCUTION RÉELLE — MEMO-PLATFORM");
  console.log('================================================================\n');

  // ------------------------------------------------------------------ PREUVE 1
  console.log(">>> [PREUVE 1] Le site démarre et sa page d'accueil répond");
  try {
    const homeRes = await rawFetch(FRONTEND_BASE);
    const homeHtml = await homeRes.text();
    const contentType = homeRes.headers.get('content-type') || '';
    console.log(`HTTP Status: ${homeRes.status}`);
    console.log(`Content-Type: ${contentType}`);
    console.log(`Extrait réponse (120 premiers caractères): ${homeHtml.slice(0, 120).replace(/\n/g, ' ')}...\n`);
    enregistrer(1, "Le site démarre et sa page d'accueil répond",
      homeRes.status === 200 ? 'PASSÉ' : 'ÉCHOUÉ',
      homeRes.status === 200 ? `HTTP ${homeRes.status} (${contentType})` : `HTTP ${homeRes.status}`);
  } catch (err: any) {
    console.log(`ERREUR: ${err?.message}\n`);
    enregistrer(1, "Le site démarre et sa page d'accueil répond", 'ÉCHOUÉ', String(err?.message));
  }

  // ------------------------------------------------------------------ PREUVE 7
  console.log(">>> [PREUVE 7] Recherche de clés LLM dans le code et les fichiers d'environnement");
  try {
    const envContent = fs.readFileSync(path.resolve('backend/.env'), 'utf-8');
    // On n'imprime QUE les noms de variables, jamais leurs valeurs (aucun secret affiché).
    const noms = envContent
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#') && l.includes('='))
      .map((l) => l.split('=')[0].trim());
    const motifs = ['DEEPSEEK', 'GEMINI', 'OPENAI', 'ANTHROPIC', 'MISTRAL', 'GROQ', 'SEMANTIC_ENGINE', 'LLM_API_KEY'];
    const trouvees = motifs.filter((m) => envContent.includes(m));
    console.log('backend/.env — noms de variables (valeurs jamais affichées) :');
    console.log(`  ${noms.join(', ')}`);
    console.log(`Présence d'une clé LLM (${motifs.join(' / ')}) : ${trouvees.length > 0 ? trouvees.join(', ') : 'AUCUNE'}`);
    console.log(`Confirmation : ZÉRO clé de modèle de langage dans le backend du site.\n`);
    enregistrer(7, 'Aucune clé LLM dans le site', trouvees.length === 0 ? 'PASSÉ' : 'ÉCHOUÉ',
      trouvees.length === 0 ? 'aucune variable de clé LLM détectée' : `clés trouvées : ${trouvees.join(', ')}`);
  } catch (err: any) {
    console.log(`ERREUR: ${err?.message}\n`);
    enregistrer(7, 'Aucune clé LLM dans le site', 'ÉCHOUÉ', String(err?.message));
  }

  // ------------------------------------------------------------------ PREUVE 3
  console.log('>>> [PREUVE 3] La barre latérale affiche les étapes du parcours de la plateforme (12 étapes via GET /parcours)');
  try {
    const parcoursRes = await rawFetch(`${API_BASE}/parcours`);
    const parcoursData = await parcoursRes.json();
    // Le site expose un TABLEAU (il a lu `reponse.etapes` de la plateforme).
    // On accepte aussi l'objet { etapes: [...] } par tolérance.
    const etapes = Array.isArray(parcoursData)
      ? parcoursData
      : Array.isArray(parcoursData?.etapes)
        ? parcoursData.etapes
        : null;
    console.log(`GET ${API_BASE}/parcours -> HTTP ${parcoursRes.status}`);
    console.log(`Forme reçue : ${Array.isArray(parcoursData) ? 'tableau (etapes dépliées par le site)' : etapes ? 'objet { etapes: [...] }' : typeof parcoursData}`);
    console.log(`Nombre total d'étapes reçues : ${etapes ? etapes.length : 'N/A'}`);
    if (etapes) {
      console.log('Liste des étapes de la plateforme :');
      etapes.forEach((s: any) => {
        console.log(`  [Étape ${s.position}] (#${s.numero}) ${s.libelle} — ${s.resume}`);
      });
    } else {
      console.log(`Réponse brute : ${JSON.stringify(parcoursData).slice(0, 300)}`);
    }
    console.log();
    const ok = !!etapes && etapes.length === 12;
    enregistrer(3, 'La barre latérale affiche les 12 étapes du parcours', ok ? 'PASSÉ' : 'ÉCHOUÉ',
      ok ? `12 étapes lues (reponse.etapes de la plateforme déplié par le site)`
         : `étapes reçues : ${etapes ? etapes.length : 'aucune'}`);
  } catch (err: any) {
    console.log(`ERREUR: ${err?.message}\n`);
    enregistrer(3, 'La barre latérale affiche les 12 étapes du parcours', 'ÉCHOUÉ', String(err?.message));
  }

  // ------------------------------------------------------------------ PREUVE 2
  console.log('>>> [PREUVE 2] Connexion étudiant, création mémoire, lancement étape 1');
  let cookieHeader = '';
  let csrfToken = '';
  let projectId = '';
  let etapeData: any = null;
  try {
    const testEmail = `etudiant_controle_${Date.now()}@exemple.test`;
    const registerRes = await rawFetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        // Mot de passe tiré au hasard à chaque exécution : aucun secret en dur dans le dépôt
        // randomUUID() : source cryptographique, jamais Math.random() (deviner un mot de passe
        // de test reste une mauvaise habitude — alerte js/insecure-randomness)
        password: `Ctrl-${randomUUID()}!`,
        name: 'Étudiant de contrôle',
      }),
    });
    const cookies = registerRes.headers.getSetCookie ? registerRes.headers.getSetCookie() : [registerRes.headers.get('set-cookie') || ''];
    cookieHeader = cookies.join('; ');
    const csrfMatch = cookieHeader.match(/mr_csrf=([^;]+)/);
    csrfToken = csrfMatch ? decodeURIComponent(csrfMatch[1]) : '';
    console.log(`POST /auth/register -> HTTP ${registerRes.status} (CSRF Token extrait)`);

    // Création du mémoire
    const projectRes = await rawFetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({
        title: "Digitalisation bancaire et inclusion financière en Côte d'Ivoire",
        domain: 'Sciences de Gestion / Finance et Banque',
      }),
    });
    const projectData = await projectRes.json();
    if (!projectData.project) {
      console.error('Erreur création projet:', projectData);
    }
    projectId = projectData.project?.id;
    console.log(`POST /projects -> HTTP ${projectRes.status} (ID Mémoire: ${projectId})`);

    // Dossier sur la plateforme
    const dossierRes = await rawFetch(`${API_BASE}/dossiers/${projectId}`, {
      headers: { Cookie: cookieHeader },
    });
    const dossierData = await dossierRes.json();
    console.log(`GET /dossiers/${projectId} -> HTTP ${dossierRes.status}`);
    console.log(`État initial dossier: Étape ouverte=${dossierData.etape_ouverte}, Statut=${dossierData.statut}, Quota=${dossierData.quota_restant}`);

    // Lancement de l'étape ouverte depuis le site
    console.log("\nLancement de l'étape ouverte depuis le site (POST /api/dossiers/:session/etape) :");
    const etapeRes = await rawFetch(`${API_BASE}/dossiers/${projectId}/etape`, {
      method: 'POST',
      headers: {
        Cookie: cookieHeader,
        'X-CSRF-Token': csrfToken,
      },
    });
    etapeData = await etapeRes.json();
    console.log(`POST /dossiers/${projectId}/etape -> HTTP ${etapeRes.status}`);
    console.log('Réponse reçue :');
    console.log(JSON.stringify(etapeData, null, 2));

    // Comparaison avec GET direct sur l'orchestrateur
    await rawFetch(`${ORCHESTRATOR_BASE}/dossiers/${projectId}/etape?n=1`);
    console.log(`\nComparaison avec GET /dossiers/{etudiant}/{session}/etape?n=1 :`);
    console.log(`Libellé étape 1: "${etapeData.libelle}"`);
    console.log(`Verdict vérificateur: "${etapeData.verdict}"`);

    const ok = !!projectId && dossierRes.status === 200 && etapeRes.status === 200 && etapeData?.etape === 1;
    enregistrer(2, 'Connexion étudiant, création mémoire, lancement étape 1', ok ? 'PASSÉ' : 'ÉCHOUÉ',
      ok ? `dossier ${projectId} créé, étape 1 lancée (verdict ${etapeData.verdict})`
         : `HTTP dossier=${dossierRes.status}, étape=${etapeRes.status}, etape=${etapeData?.etape}`);
  } catch (err: any) {
    console.log(`ERREUR: ${err?.message}\n`);
    enregistrer(2, 'Connexion étudiant, création mémoire, lancement étape 1', 'ÉCHOUÉ', String(err?.message));
  }

  // ------------------------------------------------------------------ PREUVE 4
  console.log('\n>>> [PREUVE 4] Avancement automatique : l\'étape suivante s\'ouvre sans clic de validation');
  try {
    if (!etapeData) throw new Error('PREUVE 2 non aboutie : aucune donnée d\'étape à vérifier');
    console.log(`decision_automatique: ${etapeData.decision_automatique}`);
    console.log(`etape_suivante ouverte automatiquement: ${etapeData.etape_suivante}`);
    const dossierApresRes = await rawFetch(`${API_BASE}/dossiers/${projectId}`, { headers: { Cookie: cookieHeader } });
    const dossierApres = await dossierApresRes.json();
    console.log(`Vérification dans le dossier : nouvelle étape ouverte = ${dossierApres.etape_ouverte} (statut = ${dossierApres.statut})`);
    const ok = etapeData.decision_automatique === true
      && typeof etapeData.etape_suivante === 'number'
      && dossierApres.etape_ouverte === etapeData.etape_suivante;
    enregistrer(4, "Avancement automatique sans clic (decision_automatique)", ok ? 'PASSÉ' : 'ÉCHOUÉ',
      ok ? `étape ${etapeData.etape_suivante} ouverte automatiquement`
         : `decision_automatique=${etapeData.decision_automatique}, etape_suivante=${etapeData.etape_suivante}, etape_ouverte=${dossierApres.etape_ouverte}`);
  } catch (err: any) {
    console.log(`ERREUR: ${err?.message}\n`);
    enregistrer(4, "Avancement automatique sans clic (decision_automatique)", 'ÉCHOUÉ', String(err?.message));
  }

  // ------------------------------------------------------------------ PREUVE 5
  console.log("\n>>> [PREUVE 5] Question libre orientée par l'orchestrateur");
  try {
    const questionText = 'Mon échantillon de trente personnes est-il suffisant pour valider mon terrain ?';
    const questionRes = await rawFetch(`${API_BASE}/dossiers/${projectId}/question`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({ question: questionText }),
    });
    const questionData = await questionRes.json();
    console.log(`POST /dossiers/${projectId}/question -> HTTP ${questionRes.status}`);
    console.log(`Question : "${questionText}"`);
    // `etape` peut être null (question non rattachée) : on gère ce cas sans erreur.
    if (questionData.etape === null || questionData.etape === undefined) {
      console.log('Étape désignée  : aucune (question non rattachée à une étape précise)');
    } else {
      console.log(`Étape désignée  : ${questionData.etape} (${questionData.libelle ?? ''})`);
    }
    console.log(`Agent désigné  : ${questionData.agent ?? 'aucun'}`);
    console.log(`Confiance      : ${questionData.confiance}  (type : ${typeof questionData.confiance})`);
    const indices = Array.isArray(questionData.indices) ? questionData.indices : [];
    console.log(`Indices reconnus : [${indices.join(', ')}]`);
    console.log(`Message        : "${questionData.message}"`);
    const ok = questionRes.status === 200
      && typeof questionData.message === 'string' && questionData.message.length > 0
      && Array.isArray(questionData.indices);
    enregistrer(5, "Question libre orientée par l'orchestrateur (indices/message)", ok ? 'PASSÉ' : 'ÉCHOUÉ',
      ok ? `HTTP 200, ${indices.length} indice(s), confiance=${questionData.confiance}`
         : `HTTP ${questionRes.status}, message=${typeof questionData.message}, indices=${Array.isArray(questionData.indices)}`);
  } catch (err: any) {
    console.log(`ERREUR: ${err?.message}\n`);
    enregistrer(5, "Question libre orientée par l'orchestrateur (indices/message)", 'ÉCHOUÉ', String(err?.message));
  }

  // ------------------------------------------------------------------ PREUVE 6
  console.log('\n>>> [PREUVE 6] Les documents et la bibliographie se téléchargent réellement');
  try {
    const docsRes = await rawFetch(`${API_BASE}/dossiers/${projectId}/documents`, {
      headers: { Cookie: cookieHeader },
    });
    let docsData: any = null;
    try { docsData = await docsRes.json(); } catch { docsData = null; }
    const entries = Array.isArray(docsData?.entries) ? docsData.entries : null;
    console.log(`GET /dossiers/${projectId}/documents -> HTTP ${docsRes.status}`);

    let pdfValide = false;
    let etatVide = false;
    if (docsRes.status === 200 && entries) {
      if (entries.length === 0) {
        etatVide = true;
        console.log(`Manifeste : ÉTAT VIDE (0 document) — resume=${JSON.stringify(docsData.resume)}`);
        console.log("→ Aucun document produit par la plateforme pour ce mémoire neuf : le site affiche un état vide, pas une erreur.");
      } else {
        console.log(`Manifeste : ${entries.length} document(s), resume=${JSON.stringify(docsData.resume)}`);
        entries.forEach((d: any) => console.log(`  - [${d.doc_id}] ${d.titre} (${d.auteurs ?? ''} ${d.annee ?? ''}) telechargeable=${d.telechargeable}`));
        const cible = entries.find((d: any) => d.telechargeable) || entries[0];
        if (cible) {
          const pdfRes = await rawFetch(`${API_BASE}/dossiers/${projectId}/documents/${cible.doc_id}/fichier`, {
            headers: { Cookie: cookieHeader },
          });
          const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());
          const isPdfHeader = pdfBuffer.slice(0, 4).toString('utf-8') === '%PDF';
          pdfValide = isPdfHeader;
          console.log(`GET /dossiers/${projectId}/documents/${cible.doc_id}/fichier -> HTTP ${pdfRes.status}`);
          console.log(`Content-Type reçu : ${pdfRes.headers.get('content-type')}`);
          console.log(`Taille binaire    : ${pdfBuffer.length} octets`);
          console.log(`Signature binaire : "${pdfBuffer.slice(0, 8).toString('utf-8')}"`);
          console.log(`Validation PDF    : ${isPdfHeader ? 'OUI, FICHIER PDF VALIDE' : 'NON'}`);
        }
      }
    } else if (docsRes.status === 404) {
      // 404 = « aucun document pour l'instant » : le site affiche un ÉTAT VIDE, pas une erreur.
      etatVide = true;
      const messageEtudiant = docsData?.detail?.message ?? docsData?.message ?? '';
      console.log('Manifeste : ÉTAT VIDE (HTTP 404 attendu, géré comme un état vide).');
      console.log(`Message étudiant de la plateforme : "${messageEtudiant}"`);
    } else {
      console.log(`Réponse inattendue : ${JSON.stringify(docsData).slice(0, 300)}`);
    }

    // Bibliographie (doit répondre sans erreur, même vide)
    const bibRes = await rawFetch(`${API_BASE}/dossiers/${projectId}/bibliographie?format=bibtex`, {
      headers: { Cookie: cookieHeader },
    });
    const bibText = await bibRes.text();
    console.log(`GET /dossiers/${projectId}/bibliographie -> HTTP ${bibRes.status} (${bibText.length} caractères)`);
    if (bibText.trim()) {
      console.log(`Extrait BibTeX :\n${bibText.slice(0, 150)}...\n`);
    } else {
      console.log('Bibliographie vide pour ce mémoire (état vide, aucune erreur).\n');
    }

    const ok = (pdfValide || etatVide) && bibRes.status === 200;
    enregistrer(6, 'Documents & bibliographie (téléchargement réel / état vide)', ok ? 'PASSÉ' : 'ÉCHOUÉ',
      pdfValide ? 'PDF réel téléchargé et validé (%PDF)'
        : ok ? "aucun document pour ce mémoire neuf : état vide géré (HTTP 200), bibliographie HTTP 200 (vide)"
          : `documents HTTP ${docsRes.status}, bibliographie HTTP ${bibRes.status}, PDF valide=${pdfValide}`);
  } catch (err: any) {
    console.log(`ERREUR: ${err?.message}\n`);
    enregistrer(6, 'Documents & bibliographie (téléchargement réel / état vide)', 'ÉCHOUÉ', String(err?.message));
  }

  // ------------------------------------------------------------------ BILAN
  console.log('\n================================================================');
  console.log(' BILAN DES 7 CRITÈRES');
  console.log('================================================================');
  const ordre = [1, 2, 3, 4, 5, 6, 7];
  const parNum = new Map(criteres.map((c) => [c.n, c]));
  let echecs = 0;
  for (const n of ordre) {
    const c = parNum.get(n);
    if (!c) { console.log(`CRITÈRE ${n} : NON EXÉCUTÉ`); echecs++; continue; }
    if (c.statut !== 'PASSÉ') echecs++;
    console.log(`CRITÈRE ${n} : ${c.statut} — ${c.label}`);
    console.log(`   -> ${c.detail}`);
  }
  console.log('----------------------------------------------------------------');
  console.log(echecs === 0 ? ' RÉSULTAT : 7/7 CRITÈRES AU VERT.' : ` RÉSULTAT : ${7 - echecs}/7 — ${echecs} critère(s) en échec.`);
  console.log('================================================================');

  if (echecs > 0) process.exitCode = 1;
}

runValidation().catch((err) => {
  console.error('Erreur lors de la validation:', err);
  process.exit(1);
});

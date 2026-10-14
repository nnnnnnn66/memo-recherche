# Mémoire de Recherche — Plateforme d'Accompagnement Universitaire

Plateforme web d'**accompagnement méthodologique du mémoire de Master**.
Elle guide l'étudiant du choix du sujet jusqu'à la conclusion, en **12 étapes**, sans jamais
écrire à sa place.

> **La promesse :** un directeur de mémoire disponible 24 h/24, qui guide pas à pas — sans jamais
> faire le travail à la place de l'étudiant.

---

## 1. Le problème

Chaque année, des milliers d'étudiants de Master doivent produire un mémoire de recherche sans
savoir comment s'y prendre : délimiter un sujet, formuler un problème, construire une question de
recherche, choisir une méthode, analyser des données, conclure.

- **L'encadrement est rare** : un directeur suit des dizaines d'étudiants, quelques rendez-vous par an.
- **Les ressources existantes sont générales** : elles expliquent la méthode en théorie, jamais ce que
  *cet* étudiant doit faire, sur *son* sujet, à *cette* étape.
- **Les IA généralistes aggravent le problème** : elles rédigent à la place de l'étudiant. Un mémoire
  écrit par une machine est un plagiat, détectable, et l'étudiant ne peut pas le défendre devant un jury.
- **Le résultat** : mémoires en retard, sujets mal cadrés, méthodes inadaptées, étudiants découragés.

---

## 2. La solution

Un parcours en **12 étapes**. À chaque étape, un **spécialiste** qui répond aux questions de
l'étudiant, produit le livrable de l'étape à partir de son dossier réel, et un **contrôle
indépendant** vérifie avant que l'étudiant ne valide.

```
1  Sujet                          7  Hypothèses
2  Problème de recherche          8  Orientation méthodologique
3  Revue de littérature           9  Méthodologie (protocole de recherche)
4  Problématique                 10  Résultats et analyse
5  Question de recherche         11  Vérification globale de cohérence
6  Objectifs de recherche        12  Conclusion
```

### Ce qui la distingue

| | IA généraliste | Manuel de méthodologie | Cette plateforme |
|---|---|---|---|
| Écrit à la place de l'étudiant | Oui (plagiat) | — | **Non, jamais** |
| Répond à *sa* situation | Non | Non, c'est général | **Oui, sur *son* dossier** |
| Sources réelles, adaptées à la filière | Souvent inventées | — | **Oui, récupérées en vrai** |
| Vérification à chaque étape | Aucune | Aucune | **Oui** |
| Disponible à toute heure | Oui | Non | **Oui** |

---

## 3. Les quatre piliers

1. **Les spécialistes vont chercher l'information eux-mêmes** — publications réelles (HAL, theses.fr,
   OpenAlex, Europe PMC, DOAJ, OpenAIRE…), **adaptées à la filière** de l'étudiant : la médecine ne se
   documente pas comme la géographie.
2. **Ils n'inventent jamais** — aucun chiffre, aucune source, aucun fait sur le travail de l'étudiant
   qui ne soit réel ou vérifié. Ce qui ne peut pas être établi est **déclaré** comme tel.
3. **Ils répondent comme des experts pragmatiques** — réponse directe, chiffres, ordres de grandeur,
   formules, outils, étapes à suivre. Pas de questionnaire renvoyé à l'étudiant : seule l'information
   de **terrain** (accès, personnes joignables, autorisations, délais) est demandée.
4. **L'étudiant décide** — la machine propose, l'étudiant valide. Le portillon humain est structurel :
   le statut « validé » ne vient jamais de l'agent.

---

## 4. Organisation du dépôt

```
agents/   La plateforme : les 12 spécialistes, l'orchestrateur, les vérificateurs, les tests
site/     Le site étudiant : l'interface web (inscription, parcours, conversation)
```

### `agents/` — la machinerie

- **12 paquets autonomes**, un par étape (`src/<agent>/`) : bornes, prompts, pipeline, vérificateur,
  API, stockage. Aucun code mutualisé : chaque étape a son cadre propre.
- **Un orchestrateur** (`src/orchestrator/`) : le seul organe qui connaît la carte du parcours. Il
  désigne l'étape compétente et fait répondre le bon spécialiste — y compris quand la question vient
  d'une autre étape.
- **Une couche de recherche documentaire** déterministe (aucun modèle de langage) : fournisseurs
  gratuits sans clé, hôtes en liste blanche, cache, bornes de requêtes.
- **Une couche de sécurité** sur chaque entrée : `LLM → Parser → Schéma → Métier → Sécurité`.

### `site/` — l'interface

L'étudiant s'inscrit, décrit son sujet, et travaille dans un parcours de 12 étapes. Il peut
**reprendre une étape déjà franchie** : les étapes suivantes sont alors marquées « à revoir ».

Le site **ne connaît aucun agent** : son unique point de contact est l'orchestrateur. Un test le
vérifie en lisant la source.

---

## 5. Mise en route (développement)

### La plateforme

```bash
cd agents
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python -m pytest -q          # suite complète, hors réseau
./run-orchestrateur.sh                 # port 8000 (seul interlocuteur du site)
./run-probleme.sh                      # puis un script par agent (8010 → 8130)
```

### Le site

```bash
cd site
cp backend/.env.example backend/.env   # renseigner les valeurs
npm install
npm run dev                            # backend (4000) + interface (5173)
```

---

## 6. Règles de conception tenues partout

- **Un seul agent à la fois** : un nouvel agent ne se construit jamais en modifiant un agent validé.
- **Rien n'est exécuté depuis une sortie de modèle** : tout passe par les couches d'analyse et de
  contrôle avant d'être utilisé.
- **Les chiffres viennent du code, pas du modèle** : à l'étape des résultats, un moteur déterministe
  calcule ; le modèle lit et interprète. Un chiffre absent des calculs est refusé.
- **Aucun résultat nouveau dans la conclusion** : chaque affirmation centrale cite le résultat qui la
  justifie.
- **La vérification globale est un audit transversal** : le programme établit les faits, le modèle
  juge les liens ; aucun constat sans preuve, et la portée de l'audit est toujours déclarée.

---

## 7. Confidentialité

Ce dépôt ne contient **aucune donnée personnelle** : ni compte étudiant, ni mémoire, ni base de
données, ni journal d'exécution, ni secret. Les fichiers d'environnement et les dossiers de travail
sont exclus par `.gitignore`, vérifié à chaque publication.

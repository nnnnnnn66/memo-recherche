// ============================================================================
//  Client Orchestrateur Python (FastAPI) — SEUL Interlocuteur Méthodologique
//  Base URL: config.ORCHESTRATOR_URL (default: http://127.0.0.1:8000)
//  Le site affiche, l'orchestrateur produit et vérifie.
//
//  IMPORTANT — noms de champs : ce fichier utilise les noms RÉELS renvoyés par
//  la plateforme (vérifiés en interrogeant http://127.0.0.1:8000), et non les
//  anciens noms « inventés » (parcours tableau, mots_reconnus, reponse,
//  proposition, verificateur…). Voir CONTRAT-API-EXACT.md.
// ============================================================================

import { config } from '../config.js';

export interface ParcoursStep {
  numero: number;
  position: number;
  libelle: string;
  resume: string;
}

/** GET /parcours renvoie un OBJET { etapes: [...] }, pas un tableau. */
export interface ParcoursResponse {
  etapes: ParcoursStep[];
}

export interface AgentStatus {
  agent?: string;
  etape?: number;
  libelle: string;
  adresse?: string;
  en_ligne?: boolean;
  etat_sante?: string;
  capacites?: string[];
  role?: string;
  probleme?: string;
}

export interface AgentsResponse {
  total: number;
  en_ligne: number;
  agents: AgentStatus[];
}

/** GET /dossiers/{etudiant}/{session} — état du dossier (noms réels). */
export interface DossierStatus {
  etudiant?: string;
  session?: string;
  sujet?: string;
  etape_ouverte: number;
  libelle?: string;
  statut: string;
  verdict?: string;
  decision?: string;
  commentaire?: string;
  quota_restant: number;
  quota_max?: number;
  /** Journal d'avancement (tableau d'entrées), pas un pourcentage. */
  avancement?: unknown[];
  etapes?: { numero: number; libelle: string }[];
}

export interface EtapeExecutionResult {
  etape: number;
  libelle: string;
  statut: string;
  verdict: 'verified' | 'rejected' | 'verification_failed' | 'pending' | string;
  resultat: Record<string, unknown> | string;
  verificateur?: {
    verdict?: string;
    corrections?: string[];
    motif?: string;
  } | null;
  quota_restant: number;
  decision_automatique: boolean;
  etape_suivante?: number | null;
}

/**
 * GET /dossiers/{etudiant}/{session}/etape — clés réelles, dans cet ordre :
 * numero · libelle · position · total_etapes · a_venir · resume · statut ·
 * ouverte · verdict · verdict_texte · resultat · inconnues · limites ·
 * questions · signalements. Il n'y a PAS de `proposition` ni `verificateur`.
 */
export interface EtapeDetail {
  numero: number;
  libelle: string;
  position: number;
  total_etapes?: number;
  a_venir?: boolean;
  resume?: string;
  statut?: string;
  ouverte?: boolean;
  verdict?: string;
  verdict_texte?: string;
  resultat?: Record<string, unknown> | string;
  inconnues?: string[];
  limites?: string[];
  questions?: string[];
  signalements?: string[];
  reprises?: number;
  historique_reprises?: unknown[];
  repose_sur?: unknown;
}

/**
 * POST /dossiers/{etudiant}/{session}/question — clés réelles :
 * indices (et non mots_reconnus), message (et non reponse),
 * confiance = chaîne ("haute"/"faible"), etape peut être null.
 */
/**
 * Ce que le dossier contient DÉJÀ sur l'étape rattachée : la production de l'agent (`proposition`),
 * ses manques et ses questions. C'est la matière de la RÉPONSE — sans elle, le site ne pouvait
 * afficher qu'une phrase de renvoi.
 */
export interface ExtraitEtape {
  statut?: string;
  verdict?: string;
  verdict_texte?: string;
  proposition?: string;
  inconnues?: string[];
  questions?: string[];
  signalements?: string[];
}

export interface QuestionReponse {
  repondu: boolean;
  raison?: string | null;
  question: string;
  etape: number | null;
  agent: string | null;
  libelle: string | null;
  reponse?: string;
  message?: string;
  dans_perimetre?: boolean | null;
  etape_competente?: number | null;
  relaye_depuis?: { etape: number; libelle: string } | null;
  routage?: QuestionRoutingResponse;
}

export interface QuestionRoutingResponse {
  question?: string;
  etape: number | null;
  position?: number | null;
  libelle?: string | null;
  agent?: string | null;
  confiance: string;
  methode?: string;
  indices?: string[];
  scores?: Record<string, number>;
  autres_etapes?: { numero: number; libelle: string }[];
  extrait?: ExtraitEtape | null;
  message?: string;
}

/** Entrée du manifeste de documents (noms réels de la plateforme). */
export interface DocumentItem {
  doc_id: string;
  titre: string;
  auteurs?: string;
  annee?: number | string;
  revue?: string;
  lien?: string;
  telechargeable?: boolean;
}

/** GET /dossiers/{etudiant}/{session}/documents renvoie { entries, resume }. */
export interface DocumentsResponse {
  entries: DocumentItem[];
  resume?: { references: number; telecharges: number };
  /** Message étudiant de la plateforme (état vide), jamais réécrit. */
  message?: string;
}

export class OrchestratorError extends Error {
  public statusCode: number;
  public details?: unknown;
  /** Code d'erreur de la plateforme (ex. DOSSIER_INCONNU) — pour le diagnostic. */
  public code?: string;
  /** Détail technique renvoyé par la plateforme. */
  public technical?: string;

  constructor(message: string, statusCode = 502, details?: unknown) {
    super(message);
    this.name = 'OrchestratorError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Normalise `sujet_contexte` en OBJET (forme propre attendue par la plateforme).
 * Une chaîne est encapsulée en { contexte: "…" } : envoyer une chaîne brute
 * déclenche un HTTP 422 et le dossier n'est jamais créé.
 */
export function normalizeSujetContexte(
  value: string | Record<string, unknown> | null | undefined
): Record<string, unknown> {
  if (value == null) return {};
  if (typeof value === 'string') {
    const texte = value.trim();
    return texte ? { contexte: texte } : {};
  }
  return value;
}

/**
 * Extrait le message destiné à l'ÉTUDIANT d'une erreur de la plateforme.
 * Format réel : { detail: { error, message, detail } } — `detail.message` est
 * déjà rédigé pour l'étudiant, on l'affiche TEL QUEL (Règle 8).
 */
function extractPlatformError(json: unknown): {
  message: string;
  code?: string;
  technical?: string;
} | null {
  if (!json || typeof json !== 'object') return null;
  const body = json as Record<string, unknown>;
  const detail = body.detail;
  if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
    const d = detail as Record<string, unknown>;
    const message =
      (typeof d.message === 'string' && d.message) ||
      (typeof d.error === 'string' && d.error) ||
      '';
    if (message) {
      return {
        message,
        code: typeof d.error === 'string' ? d.error : undefined,
        technical: typeof d.detail === 'string' ? d.detail : undefined,
      };
    }
  }
  if (typeof detail === 'string' && detail) return { message: detail };
  if (typeof body.message === 'string' && body.message) return { message: body.message };
  if (typeof body.error === 'string' && body.error) return { message: body.error };
  return null;
}

const EMPTY_DOCUMENTS: DocumentsResponse = {
  entries: [],
  resume: { references: 0, telecharges: 0 },
};

class OrchestratorClient {
  private get baseUrl(): string {
    return config.ORCHESTRATOR_URL.replace(/\/+$/, '');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    timeoutMs: number = config.APPEL_TIMEOUT_MS
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = new Headers(options.headers || {});
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }
    if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    let response: Response;
    try {
      // Aucun délai n'était posé : un appel parti sans réponse laissait la requête ouverte
      // indéfiniment (et l'écran de l'étudiante en attente perpétuelle). Délai court pour les
      // appels ordinaires, délai long pour un LANCEMENT D'ÉTAPE (voir runEtape).
      response = await fetch(url, {
        ...options,
        headers,
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const expire = err instanceof Error && err.name === 'TimeoutError';
      throw new OrchestratorError(
        expire
          ? `La plateforme n'a pas répondu dans le délai attendu (${Math.round(timeoutMs / 1000)} s).`
          : `L'orchestrateur méthodologique (${this.baseUrl}) est indisponible ou non démarré : ${msg}`,
        expire ? 504 : 503
      );
    }

    if (!response.ok) {
      let json: unknown = null;
      try {
        json = await response.json();
      } catch {
        json = null;
      }
      const platformError = extractPlatformError(json);
      const err = new OrchestratorError(
        platformError?.message ||
          `Erreur de l'orchestrateur (HTTP ${response.status})`,
        response.status,
        json
      );
      err.code = platformError?.code;
      err.technical = platformError?.technical;
      throw err;
    }

    return (await response.json()) as T;
  }

  /**
   * 1. GET /parcours
   * Renvoie les étapes dans l'ordre (numero, position, libellé, résumé).
   * La plateforme renvoie { etapes: [...] } : on lit `reponse.etapes`.
   */
  async getParcours(): Promise<ParcoursStep[]> {
    const reponse = await this.request<ParcoursResponse>('/parcours');
    return Array.isArray(reponse?.etapes) ? reponse.etapes : [];
  }

  /**
   * 2. GET /agents
   * Renvoie l'état des agents et s'ils sont en ligne.
   */
  async getAgents(): Promise<AgentsResponse> {
    return this.request<AgentsResponse>('/agents');
  }

  /**
   * 3. POST /dossiers/{etudiant}/{session}
   * Ouvre ou initialise un dossier pour le mémoire de l'étudiant (idempotent).
   * `sujet_contexte` est NORMALISÉ en objet : jamais une chaîne brute (HTTP 422).
   */
  async openDossier(
    etudiant: string,
    session: string,
    payload: { sujet: string; sujet_contexte: string | Record<string, unknown> }
  ): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(
      `/dossiers/${encodeURIComponent(etudiant)}/${encodeURIComponent(session)}`,
      {
        method: 'POST',
        body: JSON.stringify({
          sujet: payload.sujet,
          sujet_contexte: normalizeSujetContexte(payload.sujet_contexte),
        }),
      }
    );
  }

  /**
   * 4. GET /dossiers/{etudiant}/{session}
   * Renvoie l'étape ouverte, le statut, le quota et l'avancement.
   */
  async getDossier(etudiant: string, session: string): Promise<DossierStatus> {
    return this.request<DossierStatus>(
      `/dossiers/${encodeURIComponent(etudiant)}/${encodeURIComponent(session)}`
    );
  }

  /**
   * 5. POST /dossiers/{etudiant}/{session}/etape
   * Lance l'étape ouverte (le parcours décide laquelle ; le site ne choisit pas).
   */
  async runEtape(
    etudiant: string,
    session: string
  ): Promise<EtapeExecutionResult> {
    return this.request<EtapeExecutionResult>(
      `/dossiers/${encodeURIComponent(etudiant)}/${encodeURIComponent(session)}/etape`,
      {
        method: 'POST',
      },
      // Une étape peut travailler jusqu'à ~25 min (revue de littérature) : c'est le SEUL appel
      // qui a droit à un délai long. Il tourne en arrière-plan (voir services/etapesEnCours).
      config.ETAPE_TIMEOUT_MS
    );
  }

  /**
   * 6. GET /dossiers/{etudiant}/{session}/etape?n=X
   * Renvoie le détail complet d'une étape pour l'affichage (ou l'étape ouverte si omis).
   */
  async getEtapeDetail(
    etudiant: string,
    session: string,
    n?: number
  ): Promise<EtapeDetail> {
    const query = typeof n === 'number' && !isNaN(n) ? `?n=${n}` : '';
    return this.request<EtapeDetail>(
      `/dossiers/${encodeURIComponent(etudiant)}/${encodeURIComponent(session)}/etape${query}`
    );
  }

  /**
   * 7. POST /dossiers/{etudiant}/{session}/question
   * L'étudiant pose une question libre. L'orchestrateur oriente vers l'étape et l'agent compétents.
   */
  /**
   * POST /dossiers/{etudiant}/{session}/interroger
   *
   * La question part à l'ORCHESTRATEUR, qui désigne l'étape compétente puis fait répondre SON
   * agent — et si la question appartient à une autre étape, il appelle directement cet agent-là.
   * C'est cette route que le fil de discussion utilise : la réponse existe, elle n'est pas qu'un
   * aiguillage. Sans effet de bord côté plateforme (aucune analyse consommée).
   */
  async interroger(
    etudiant: string,
    session: string,
    question: string
  ): Promise<QuestionReponse> {
    return this.request<QuestionReponse>(
      `/dossiers/${encodeURIComponent(etudiant)}/${encodeURIComponent(session)}/interroger`,
      { method: 'POST', body: JSON.stringify({ question }) },
      // Un agent qui répond peut prendre une minute (modèle raisonneur) : on ne coupe pas trop tôt.
      240_000
    );
  }

  async askQuestion(
    etudiant: string,
    session: string,
    question: string
  ): Promise<QuestionRoutingResponse> {
    return this.request<QuestionRoutingResponse>(
      `/dossiers/${encodeURIComponent(etudiant)}/${encodeURIComponent(session)}/question`,
      {
        method: 'POST',
        body: JSON.stringify({ question }),
      }
    );
  }

  /**
   * 8. GET /dossiers/{etudiant}/{session}/documents
   * Manifeste des documents. Répond 404 tant qu'aucune étape n'a produit de
   * document : on renvoie alors un manifeste VIDE (état vide, pas une erreur).
   */
  async getDocuments(
    etudiant: string,
    session: string
  ): Promise<DocumentsResponse> {
    try {
      const reponse = await this.request<DocumentsResponse>(
        `/dossiers/${encodeURIComponent(etudiant)}/${encodeURIComponent(session)}/documents`
      );
      return {
        entries: Array.isArray(reponse?.entries) ? reponse.entries : [],
        resume: reponse?.resume,
      };
    } catch (err: unknown) {
      // 404 = « aucun document pour l'instant » : ce n'est pas une erreur.
      if (err instanceof OrchestratorError && err.statusCode === 404) {
        return { ...EMPTY_DOCUMENTS, message: err.message };
      }
      throw err;
    }
  }

  /**
   * GET /dossiers/{etudiant}/{session}/documents/{doc_id}/fichier
   * Téléchargement réel du fichier PDF.
   */
  async getDocumentFileResponse(
    etudiant: string,
    session: string,
    docId: string
  ): Promise<Response> {
    const url = `${this.baseUrl}/dossiers/${encodeURIComponent(etudiant)}/${encodeURIComponent(session)}/documents/${encodeURIComponent(docId)}/fichier`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new OrchestratorError(`Document introuvable (HTTP ${res.status})`, res.status);
      }
      return res;
    } catch (err: unknown) {
      if (err instanceof OrchestratorError) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      throw new OrchestratorError(`Impossible de joindre le fichier sur l'orchestrateur : ${msg}`, 503);
    }
  }

  /**
   * GET /dossiers/{etudiant}/{session}/bibliographie?format=bibtex
   * Récupère la bibliographie générée.
   * Répond 404 tant qu'aucun document n'existe : on renvoie alors une chaîne
   * VIDE (état vide, pas une erreur 500 côté site).
   */
  async getBibliographie(
    etudiant: string,
    session: string,
    format = 'bibtex'
  ): Promise<string> {
    const url = `${this.baseUrl}/dossiers/${encodeURIComponent(etudiant)}/${encodeURIComponent(session)}/bibliographie?format=${encodeURIComponent(format)}`;
    const res = await fetch(url);
    if (res.status === 404) {
      return '';
    }
    if (!res.ok) {
      throw new OrchestratorError(`Erreur récupération bibliographie (HTTP ${res.status})`, res.status);
    }
    return res.text();
  }
}

export const orchestratorClient = new OrchestratorClient();

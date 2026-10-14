// ============================================================================
//  Client API Frontend — Centralise les appels vers la passerelle Backend
//  Gère les cookies HttpOnly, le jeton CSRF et le streaming SSE
// ============================================================================

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface ResearchProject {
  id: string;
  title: string;
  domain: string;
  status: 'draft' | 'in_progress' | 'completed' | 'archived';
  createdAt: string;
  updatedAt: string;
  _count?: { workspaces: number; sessions: number };
}

export interface StepWorkspace {
  id: string;
  projectId: string;
  stepId: number;
  revision: number;
  content: string;
  wordCount: number;
  note?: string;
  createdAt: string;
}

export interface MethodologyStep {
  id: number;
  position: number;
  slug: string;
  title: string;
  description: string;
  guidance: string;
}

export interface ConsultationSession {
  id: string;
  projectId: string;
  stepId?: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  step?: { id: number; title: string };
  _count?: { messages: number };
}

export interface ConsultationMessage {
  id: string;
  sessionId: string;
  role: 'student' | 'guide';
  content: string;
  status: 'complete' | 'interrupted' | 'error';
  engine?: string;
  createdAt: string;
}

export interface ParcoursStep {
  position: number;
  libelle: string;
  resume: string;
}

export interface PlatformAgent {
  id?: number;
  libelle: string;
  slug?: string;
  en_ligne?: boolean;
}

export interface DossierState {
  etudiant?: string;
  session?: string;
  etape_ouverte: number;
  libelle?: string;
  statut: string;
  verdict?: string;
  decision?: string;
  commentaire?: string;
  quota_restant: number;
  quota_max?: number;
  /** Journal d'avancement (tableau d'entrées de la plateforme), pas un pourcentage. */
  avancement: unknown[];
  sujet?: string;
  etapes?: { numero: number; libelle: string }[];
}

/**
 * Réponse IMMÉDIATE d'un lancement d'étape : la plateforme travaille en arrière-plan, le site
 * interroge ensuite `GET .../etape/suivi`. Le lancement ne bloque donc plus la requête (le lien
 * public coupait au bout de ~2 minutes, mesuré en HTTP 524).
 */
export interface LancementEtape {
  etat: 'en_cours' | 'termine' | 'echec' | 'inconnu';
  etape: number | null;
  duree_s: number;
  message?: string;
}

/** Avancement d'un lancement : `inconnu` = serveur redémarré, on relit l'état réel du dossier. */
export interface SuiviEtape {
  etat: 'en_cours' | 'termine' | 'echec' | 'inconnu';
  etape: number | null;
  duree_s: number;
  resultat?: EtapeResult;
  /** Conversation où la production vient d'être écrite : le site s'y rend pour la lire. */
  sessionId?: string | null;
  erreur?: string;
}

export interface EtapeResult {
  etape: number;
  libelle: string;
  statut: string;
  verdict: 'verified' | 'rejected' | 'verification_failed' | 'pending' | string;
  resultat: any;
  verificateur?: {
    verdict?: string;
    corrections?: string[];
    motif?: string;
  };
  quota_restant: number;
  decision_automatique: boolean;
  etape_suivante?: number;
}

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
  resultat?: any;
  inconnues?: string[];
  limites?: string[];
  questions?: string[];
  signalements?: string[];
}

export interface PlatformDocument {
  doc_id: string;
  titre: string;
  auteurs?: string;
  annee?: number | string;
  revue?: string;
  lien?: string;
  telechargeable?: boolean;
}

const API_BASE = '/api';

/** Choix de l'orchestrateur, envoyé par le backend avant la réponse du spécialiste */
export interface AgentRouting {
  slug: string;
  stepId: number;
  name: string;
  reason: string;
  method: 'llm' | 'keywords' | 'hint';
  engine: string;
  provider: string;
}

// Récupération automatique du token CSRF stocké dans le cookie
function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)mr_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  const csrf = getCsrfToken();
  if (csrf) {
    headers.set('X-CSRF-Token', csrf);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Transmet le cookie de session HttpOnly
  });

  if (!response.ok) {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: `Erreur serveur (${response.status})` };
    }
    throw new Error(errorData.error || `Erreur requête (${response.status})`);
  }

  return response.json();
}

export const api = {
  // Auth
  async getMe(): Promise<{ user: User } | null> {
    try {
      return await request<{ user: User }>('/auth/me');
    } catch {
      return null;
    }
  },
  async login(credentials: { email: string; password: string }): Promise<{ user: User }> {
    return request<{ user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },
  async register(data: { name?: string; email: string; password: string }): Promise<{ user: User }> {
    return request<{ user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async logout(): Promise<void> {
    await request('/auth/logout', { method: 'POST' });
  },

  // Projets
  async getProjects(): Promise<{ projects: ResearchProject[] }> {
    return request<{ projects: ResearchProject[] }>('/projects');
  },
  async createProject(data: { title: string; domain: string }): Promise<{ project: ResearchProject }> {
    return request<{ project: ResearchProject }>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async getProject(id: string): Promise<{ project: ResearchProject & { workspaces: StepWorkspace[]; sessions: ConsultationSession[] } }> {
    return request(`/projects/${id}`);
  },
  async deleteProject(id: string): Promise<void> {
    await request(`/projects/${id}`, { method: 'DELETE' });
  },

  // Référentiel des Étapes (depuis GET /parcours)
  async getSteps(): Promise<{ steps: MethodologyStep[]; parcours?: ParcoursStep[] }> {
    return request<{ steps: MethodologyStep[]; parcours?: ParcoursStep[] }>('/steps');
  },
  async getParcours(): Promise<ParcoursStep[]> {
    return request<ParcoursStep[]>('/parcours');
  },
  async getAgents(): Promise<{ en_ligne: number; total: number; agents: PlatformAgent[] }> {
    return request<{ en_ligne: number; total: number; agents: PlatformAgent[] }>('/agents');
  },

  // Orchestrateur Dossier & Étapes
  async getDossier(session: string): Promise<DossierState> {
    return request<DossierState>(`/dossiers/${session}`);
  },
  async runEtape(session: string): Promise<LancementEtape> {
    return request<LancementEtape>(`/dossiers/${session}/etape`, {
      method: 'POST',
    });
  },
  async suiviEtape(session: string): Promise<SuiviEtape> {
    return request<SuiviEtape>(`/dossiers/${session}/etape/suivi`);
  },
  async getEtapeDetail(session: string, n?: number): Promise<EtapeDetail> {
    const q = n !== undefined ? `?n=${n}` : '';
    return request<EtapeDetail>(`/dossiers/${session}/etape${q}`);
  },
  async askQuestion(session: string, question: string): Promise<{
    etape: number | null;
    position?: number | null;
    libelle?: string | null;
    agent: string | null;
    confiance: string;
    indices: string[];
    message?: string;
  }> {
    return request(`/dossiers/${session}/question`, {
      method: 'POST',
      body: JSON.stringify({ question }),
    });
  },

  // Documents & Bibliographie
  // Le backend renvoie le manifeste { entries, resume } ; on expose les entrées.
  async getDocuments(session: string): Promise<PlatformDocument[]> {
    const manifest = await request<{ entries: PlatformDocument[] }>(`/dossiers/${session}/documents`);
    return Array.isArray(manifest?.entries) ? manifest.entries : [];
  },
  getDocumentDownloadUrl(session: string, docId: string): string {
    return `${API_BASE}/dossiers/${session}/documents/${docId}/fichier`;
  },
  getBibliographyDownloadUrl(session: string, format = 'bibtex'): string {
    return `${API_BASE}/dossiers/${session}/bibliographie?format=${format}`;
  },

  // Workspaces (Éditeur de texte - Append Only)
  async getStepWorkspace(projectId: string, stepId: number): Promise<{ workspace: StepWorkspace | null }> {
    return request<{ workspace: StepWorkspace | null }>(`/projects/${projectId}/steps/${stepId}`);
  },
  async getStepVersions(projectId: string, stepId: number): Promise<{ versions: Array<{ id: string; revision: number; wordCount: number; note?: string; createdAt: string }> }> {
    return request(`/projects/${projectId}/steps/${stepId}/versions`);
  },
  async saveStepWorkspace(projectId: string, stepId: number, data: { content: string; note?: string }): Promise<{ workspace: StepWorkspace }> {
    return request<{ workspace: StepWorkspace }>(`/projects/${projectId}/steps/${stepId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Sessions de consultation (Bureau Virtuel)
  async getProjectSessions(projectId: string): Promise<{ sessions: ConsultationSession[] }> {
    return request<{ sessions: ConsultationSession[] }>(`/consultation/projects/${projectId}/sessions`);
  },
  async createSession(projectId: string, data?: { title?: string; stepId?: number }): Promise<{ session: ConsultationSession }> {
    return request<{ session: ConsultationSession }>(`/consultation/projects/${projectId}/sessions`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  },
  async deleteSession(sessionId: string): Promise<void> {
    await request(`/consultation/sessions/${sessionId}`, { method: 'DELETE' });
  },
  async getSessionMessages(sessionId: string): Promise<{ session: ConsultationSession; messages: ConsultationMessage[] }> {
    return request<{ session: ConsultationSession; messages: ConsultationMessage[] }>(`/consultation/sessions/${sessionId}/messages`);
  },

  // STREAMING SSE POUR LA CONSULTATION MÉTHODOLOGIQUE
  streamConsultation(params: {
    projectId: string;
    sessionId?: string;
    stepId?: number;
    prompt: string;
    onSessionCreated?: (sessionId: string) => void;
    onAgent?: (routing: AgentRouting) => void;
    onDelta: (text: string) => void;
    onComplete: (data: { messageId: string; fullText: string; engine?: string }) => void;
    onError: (err: Error) => void;
  }): () => void {
    const controller = new AbortController();

    (async () => {
      try {
        const csrf = getCsrfToken();
        const headers = new Headers({
          'Content-Type': 'application/json',
        });
        if (csrf) headers.set('X-CSRF-Token', csrf);

        const response = await fetch(`${API_BASE}/consultation`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            projectId: params.projectId,
            sessionId: params.sessionId,
            stepId: params.stepId,
            prompt: params.prompt,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errJson = await response.json().catch(() => ({ error: 'Erreur streaming' }));
          throw new Error(errJson.error || 'Erreur lors de la consultation');
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('Flux SSE indisponible');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';

          for (const block of parts) {
            const lines = block.split('\n');
            let event = 'message';
            let dataStr = '';

            for (const line of lines) {
              if (line.startsWith('event: ')) event = line.slice(7).trim();
              if (line.startsWith('data: ')) dataStr = line.slice(6).trim();
            }

            if (!dataStr) continue;
            try {
              const data = JSON.parse(dataStr);
              if (event === 'session' && params.onSessionCreated) {
                params.onSessionCreated(data.sessionId);
              } else if (event === 'agent' && params.onAgent) {
                params.onAgent(data);
              } else if (event === 'delta') {
                params.onDelta(data.text);
              } else if (event === 'complete') {
                params.onComplete(data);
              } else if (event === 'error') {
                params.onError(new Error(data.error));
              }
            } catch (err) {
              console.error('Erreur parsing SSE chunk:', err);
            }
          }
        }
      } catch (err: any) {
        if (!controller.signal.aborted) {
          params.onError(err);
        }
      }
    })();

    return () => controller.abort();
  },
};

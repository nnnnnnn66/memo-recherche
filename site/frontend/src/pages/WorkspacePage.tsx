import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Link } from 'react-router-dom';
import {
  Send,
  Plus,
  MessageSquare,
  GraduationCap,
  Sparkles,
  PanelLeftClose,
  PanelLeft,
  FileEdit,
  Trash2,
  Copy,
  Check,
  Loader2,
  LogOut,
  FolderKanban,
  Save,
  History,
  X,
  AlertCircle,
  BookOpen,
  Home,
  Download,
} from 'lucide-react';
import {
  api,
  type ResearchProject,
  type ConsultationSession,
  type ConsultationMessage,
  type AgentRouting,
  type ParcoursStep,
  type DossierState,
  type SuiviEtape,
  type PlatformDocument,
} from '../api/client';
import { useAuth } from '../context/useAuth';
import { ACADEMIC_AGENTS, getAgentByIdOrSlug, type AgentDescriptor } from '../data/agents';
import { AgentIcon } from '../components/AgentIcon';

/** Retrouve l'agent qui a répondu à partir du champ engine */
function agentFromEngine(engine?: string): AgentDescriptor | undefined {
  if (!engine) return undefined;
  const idx = engine.lastIndexOf('-');
  if (idx <= 0) return undefined;
  const slug = engine.slice(0, idx);
  return ACADEMIC_AGENTS.find((a) => a.slug === slug);
}

export const WorkspacePage: React.FC = () => {
  const { user, logout } = useAuth();

  // Projets & Sessions
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [activeProject, setActiveProject] = useState<ResearchProject | null>(null);
  const [sessions, setSessions] = useState<ConsultationSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConsultationMessage[]>([]);

  // Navigation & UI Layout
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notesDrawerOpen, setNotesDrawerOpen] = useState(false);
  const [activeAgentId, setActiveAgentId] = useState<number>(1);
  const [isAgentMenuOpen, setIsAgentMenuOpen] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);

  // Chat input & streaming
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [streamingDelta, setStreamingDelta] = useState('');
  const [routing, setRouting] = useState<AgentRouting | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Espace Rédaction / Notes (Volet escamotable)
  const [draftContent, setDraftContent] = useState('');
  const [savingDraft, setSavingDraft] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [draftVersions, setDraftVersions] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Plateforme Orchestrateur : Parcours & Dossier
  const [parcoursSteps, setParcoursSteps] = useState<ParcoursStep[]>([]);
  const [dossierState, setDossierState] = useState<DossierState | null>(null);
  const [runningEtape, setRunningEtape] = useState(false);
  // Suivi visible d'un lancement EN COURS : sans cela, l'étudiante voyait un simple sablier, sans
  // savoir si quelque chose avançait ni depuis combien de temps.
  const [secondesEtape, setSecondesEtape] = useState(0);
  const [etapeEnCours, setEtapeEnCours] = useState<number | null>(null);
  const [etapeError, setEtapeError] = useState<string | null>(null);
  // Incrémenté pour forcer le rechargement du fil après une production.
  const [messagesBump, setMessagesBump] = useState(0);

  // Compteur local : le suivi est interrogé toutes les 4 s, le compteur avance chaque seconde.
  // L'étudiante voit ainsi que le travail progresse au lieu de fixer un sablier immobile.
  useEffect(() => {
    if (!runningEtape) return;
    const minuteur = window.setInterval(() => setSecondesEtape((s) => s + 1), 1000);
    return () => window.clearInterval(minuteur);
  }, [runningEtape]);

  // Corpus & Documents
  const [documentsDrawerOpen, setDocumentsDrawerOpen] = useState(false);
  const [documentsList, setDocumentsList] = useState<PlatformDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const agentMenuRef = useRef<HTMLDivElement>(null);

  const activeAgent = getAgentByIdOrSlug(activeAgentId);

  // Chargement du parcours officiel de la plateforme (12 étapes)
  useEffect(() => {
    api.getParcours()
      .then((p) => {
        if (p && p.length > 0) setParcoursSteps(p);
      })
      .catch((err) => console.error('Erreur chargement parcours plateforme:', err));
  }, []);

  // Synchronisation du dossier auprès de l'orchestrateur
  const reloadDossier = async (projectId: string) => {
    try {
      const d = await api.getDossier(projectId);
      setDossierState(d);
      if (d.etape_ouverte) {
        setActiveAgentId(d.etape_ouverte);
      }
    } catch (err: any) {
      console.warn('Erreur synchronisation dossier orchestrateur:', err);
    }
  };

  /**
   * Attend la fin d'un lancement d'étape en interrogeant la plateforme.
   *
   * Le lancement rend la main immédiatement : c'est cette boucle qui attend le résultat. Elle ne
   * consomme rien (aucun appel d'agent) et supporte les étapes longues, là où une requête unique
   * était coupée par le lien public.
   */
  const attendreLancement = async (projectId: string): Promise<SuiviEtape | null> => {
    const limite = Date.now() + 30 * 60 * 1000;
    const debut = Date.now();
    let sansSuivi = 0;
    while (Date.now() < limite) {
      // Rythme adaptatif : rapproché au début (l'étudiante veut voir que ça démarre), espacé
      // ensuite. Une étape peut durer 25 min : interroger toutes les 4 s pendant tout ce temps
      // consommerait inutilement le plafond de l'API du site.
      const ecoule = (Date.now() - debut) / 1000;
      const pause = ecoule < 30 ? 3000 : 10000;
      await new Promise((resolve) => setTimeout(resolve, pause));
      const avancement = await api.suiviEtape(projectId);
      setSecondesEtape(avancement.duree_s);
      if (avancement.etat === 'termine') return avancement;
      if (avancement.etat === 'echec') {
        throw new Error(avancement.erreur || "L'étape n'a pas abouti sur la plateforme.");
      }
      if (avancement.etat === 'inconnu') {
        // Registre perdu (serveur redémarré) : on ne devine pas, on relit l'état réel du dossier.
        sansSuivi += 1;
        if (sansSuivi >= 2) return null;
      } else {
        sansSuivi = 0;
      }
    }
    throw new Error(
      "L'étape n'a pas rendu la main dans le délai prévu (30 minutes). Ton dossier est conservé : " +
        'recharge la page pour voir où elle en est.'
    );
  };

  const handleLaunchOpenEtape = async () => {
    if (!activeProject) return;
    setRunningEtape(true);
    setSecondesEtape(0);
    setEtapeError(null);
    try {
      const lancement = await api.runEtape(activeProject.id);
      setEtapeEnCours(lancement.etape ?? null);
      setSecondesEtape(lancement.duree_s);
      const avancement = await attendreLancement(activeProject.id);
      // La production est arrivée DANS la conversation : on s'y rend pour la lire. Si elle est
      // déjà à l'écran, on force simplement un rechargement du fil.
      await refreshSessions(activeProject.id);
      if (avancement?.sessionId && avancement.sessionId !== currentSessionId) {
        setCurrentSessionId(avancement.sessionId);
      } else {
        setMessagesBump((n) => n + 1);
      }
      // Rafraîchir l'état réel : l'étape ouverte a pu changer (mode autonome).
      const d = await api.getDossier(activeProject.id);
      setDossierState(d);
      if (d.etape_ouverte) setActiveAgentId(d.etape_ouverte);
    } catch (err: any) {
      setEtapeError(err.message || "Erreur lors de l'exécution de l'étape par la plateforme");
    } finally {
      setRunningEtape(false);
      setEtapeEnCours(null);
    }
  };

  const handleOpenDocuments = async () => {
    setDocumentsDrawerOpen(true);
    if (!activeProject) return;
    setLoadingDocs(true);
    try {
      const docs = await api.getDocuments(activeProject.id);
      setDocumentsList(docs);
    } catch (err) {
      console.error('Erreur récupération documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  // 1. Chargement initial des projets
  useEffect(() => {
    let ignore = false;
    api.getProjects()
      .then(async (res) => {
        if (ignore) return;
        if (res.projects.length === 0) {
          // Si aucun projet n'existe, on en initialise un par défaut de manière fluide
          try {
            const created = await api.createProject({
              title: 'Mon Mémoire de Recherche',
              domain: 'Méthodologie Universitaire LMD',
            });
            if (!ignore) {
              setProjects([created.project]);
              setActiveProject(created.project);
            }
          } catch (err) {
            console.error('Erreur initialisation projet par défaut:', err);
          }
        } else {
          setProjects(res.projects);
          setActiveProject(res.projects[0]);
        }
      })
      .catch((err) => console.error('Erreur chargement projets:', err));

    return () => {
      ignore = true;
    };
  }, []);

  // 2. Chargement des sessions dès que le projet actif change
  const refreshSessions = async (projectId: string) => {
    try {
      const res = await api.getProjectSessions(projectId);
      setSessions(res.sessions);
      return res.sessions;
    } catch (err) {
      console.error('Erreur chargement sessions:', err);
      return [];
    }
  };

  useEffect(() => {
    if (!activeProject) return;
    let ignore = false;
    refreshSessions(activeProject.id).then((sessList) => {
      if (ignore) return;
      if (sessList.length > 0) {
        setCurrentSessionId(sessList[0].id);
      } else {
        setCurrentSessionId(null);
        setMessages([]);
      }
    });

    // Synchronisation dossier auprès de l'orchestrateur
    reloadDossier(activeProject.id);

    return () => {
      ignore = true;
    };
  }, [activeProject?.id]);

  // 3. Chargement des messages dès que la session active change
  useEffect(() => {
    if (!currentSessionId) {
      setMessages([]);
      return;
    }
    let ignore = false;
    api.getSessionMessages(currentSessionId)
      .then((res) => {
        if (!ignore) {
          setMessages(res.messages);
          if (res.session.stepId) {
            setActiveAgentId(res.session.stepId);
          }
        }
      })
      .catch((err) => console.error('Erreur messages session:', err));

    return () => {
      ignore = true;
    };
  }, [currentSessionId, messagesBump]);

  // 4. Chargement du brouillon pour le volet notes/rédaction
  const reloadDraftWorkspace = async () => {
    if (!activeProject) return;
    try {
      const [wsRes, versRes] = await Promise.all([
        api.getStepWorkspace(activeProject.id, activeAgentId),
        api.getStepVersions(activeProject.id, activeAgentId),
      ]);
      setDraftContent(wsRes.workspace?.content || '');
      setDraftVersions(versRes.versions);
    } catch (err) {
      console.error('Erreur chargement notes:', err);
    }
  };

  useEffect(() => {
    if (activeProject && notesDrawerOpen) {
      reloadDraftWorkspace();
    }
  }, [activeProject?.id, activeAgentId, notesDrawerOpen]);

  // Scroll automatique lors des nouveaux messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingDelta, isAnalyzing]);

  // Fermer le popover de sélection d'agent au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (agentMenuRef.current && !agentMenuRef.current.contains(e.target as Node)) {
        setIsAgentMenuOpen(false);
      }
    };
    if (isAgentMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAgentMenuOpen]);

  // Démarrer une nouvelle consultation
  const handleStartNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setError(null);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Suppression d'une session
  const handleDeleteSession = async (e: React.MouseEvent, sessId: string) => {
    e.stopPropagation();
    if (!confirm('Supprimer cette consultation de votre historique ?')) return;
    try {
      await api.deleteSession(sessId);
      if (activeProject) {
        const remaining = await refreshSessions(activeProject.id);
        if (currentSessionId === sessId) {
          if (remaining.length > 0) {
            setCurrentSessionId(remaining[0].id);
          } else {
            handleStartNewChat();
          }
        }
      }
    } catch (err) {
      console.error('Erreur suppression session:', err);
    }
  };

  // Créer un nouveau projet
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDomain.trim()) return;
    setCreatingProject(true);
    try {
      const res = await api.createProject({ title: newTitle.trim(), domain: newDomain.trim() });
      setProjects((prev) => [res.project, ...prev]);
      setActiveProject(res.project);
      setShowProjectModal(false);
      setNewTitle('');
      setNewDomain('');
      handleStartNewChat();
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingProject(false);
    }
  };

  // Envoi d'un message
  const handleSendMessage = (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isAnalyzing || !activeProject) return;

    setError(null);
    setInput('');
    setIsAnalyzing(true);
    setStreamingDelta('');
    setRouting(null);

    const tempMsg: ConsultationMessage = {
      id: `temp-${Date.now()}`,
      sessionId: currentSessionId || '',
      role: 'student',
      content: trimmed,
      status: 'complete',
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    let accumulated = '';

    api.streamConsultation({
      projectId: activeProject.id,
      sessionId: currentSessionId || undefined,
      stepId: activeAgentId,
      prompt: trimmed,
      onSessionCreated: (newSessionId) => {
        setCurrentSessionId(newSessionId);
        refreshSessions(activeProject.id);
      },
      onAgent: (r) => {
        setRouting(r);
        if (r.stepId && r.stepId !== activeAgentId) {
          setActiveAgentId(r.stepId);
        }
      },
      onDelta: (chunk) => {
        accumulated += chunk;
        setStreamingDelta(accumulated);
      },
      onComplete: (data) => {
        setIsAnalyzing(false);
        setStreamingDelta('');
        const guideMsg: ConsultationMessage = {
          id: data.messageId,
          sessionId: currentSessionId || '',
          role: 'guide',
          content: data.fullText,
          engine: data.engine,
          status: 'complete',
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, guideMsg]);
        refreshSessions(activeProject.id);
      },
      onError: (err) => {
        setIsAnalyzing(false);
        setStreamingDelta('');
        setError(err.message || "Anomalie lors de l'analyse.");
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(input);
    }
  };

  // Copier un message
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Sauvegarder les notes / rédaction
  const handleSaveDraft = async () => {
    if (!activeProject) return;
    setSavingDraft(true);
    setSaveSuccess(false);
    try {
      await api.saveStepWorkspace(activeProject.id, activeAgentId, {
        content: draftContent,
        note: `Note du ${new Date().toLocaleTimeString('fr-FR')}`,
      });
      setSaveSuccess(true);
      await reloadDraftWorkspace();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingDraft(false);
    }
  };

  // Transférer la réponse dans le brouillon
  const handleInsertIntoNotes = (text: string) => {
    setDraftContent((prev) => (prev ? `${prev}\n\n---\n${text}` : text));
    setNotesDrawerOpen(true);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-ivory text-oxford">
      {/* ==================================================================== */}
      {/*  1. BARRE LATÉRALE GAUCHE : PROJETS, SESSIONS, 12 ÉTAPES            */}
      {/* ==================================================================== */}
      <aside
        className={`${
          sidebarOpen ? 'w-80 translate-x-0' : '-translate-x-full lg:w-0 lg:translate-x-0'
        } transition-all duration-300 ease-in-out fixed lg:static inset-y-0 left-0 z-40 bg-ivory-card border-r border-oxford-border/10 flex flex-col shrink-0 overflow-hidden shadow-xl lg:shadow-none`}
      >
        {/* En-tête Sidebar : Logo & Bouton replier */}
        <div className="p-4 flex items-center justify-between border-b border-oxford-border/10 shrink-0">
          <Link
            to="/"
            className="flex items-center space-x-2.5 group hover:opacity-90 transition-opacity"
            title="Retourner à la page d'accueil"
          >
            <div className="w-8 h-8 rounded-xl bg-oxford text-ivory flex items-center justify-center font-serif font-bold text-sm shadow-2xs group-hover:bg-ochre transition-colors">
              MR
            </div>
            <div>
              <span className="font-serif font-bold text-sm tracking-tight text-oxford block leading-none">
                Mémoire Recherche
              </span>
              <span className="text-[10px] text-oxford-muted uppercase tracking-wider block font-sans">
                Accompagnement Académique
              </span>
            </div>
          </Link>

          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-full hover:bg-ivory text-oxford-muted hover:text-oxford transition-colors"
            title="Masquer la barre latérale"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Bouton "+ Nouvelle consultation" */}
        <div className="p-3 shrink-0">
          <button
            onClick={handleStartNewChat}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-ochre hover:bg-ochre-hover text-ivory text-xs font-semibold rounded-xl shadow-2xs transition-all active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle consultation</span>
          </button>
        </div>

        {/* Sélecteur de Mémoire / Projet actif */}
        <div className="px-3 pb-3 shrink-0 border-b border-oxford-border/10">
          <div className="flex items-center justify-between text-[11px] font-semibold text-oxford-muted uppercase tracking-wider mb-1.5 px-1">
            <span>Mon Mémoire</span>
            <button
              onClick={() => setShowProjectModal(true)}
              className="text-ochre hover:underline lowercase font-sans text-xs flex items-center space-x-0.5"
              title="Ajouter un autre projet"
            >
              <Plus className="w-3 h-3" />
              <span>nouveau</span>
            </button>
          </div>

          <div className="relative">
            <select
              value={activeProject?.id || ''}
              onChange={(e) => {
                const found = projects.find((p) => p.id === e.target.value);
                if (found) setActiveProject(found);
              }}
              className="w-full appearance-none bg-ivory-pure border border-oxford-border/20 rounded-xl py-2 px-3 pr-8 text-xs font-serif font-bold text-oxford truncate focus:outline-hidden focus:border-ochre cursor-pointer shadow-2xs"
            >
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.title}
                </option>
              ))}
            </select>
            <FolderKanban className="w-3.5 h-3.5 text-oxford-muted absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
          {activeProject && (
            <span className="block text-[10px] text-oxford-muted truncate px-1 mt-1">
              Domaine : {activeProject.domain}
            </span>
          )}
        </div>

        {/* Zone de défilement : Discussions récentes + 12 Étapes */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-5">
          {/* Section Discussions récentes */}
          <div className="space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-oxford-muted px-2 block">
              Consultations Récentes
            </span>
            {sessions.length === 0 ? (
              <p className="text-[11px] text-oxford-muted/70 px-2 py-1 font-reading italic">
                Aucune consultation passée. Posez votre première question.
              </p>
            ) : (
              <div className="space-y-0.5">
                {sessions.map((sess) => {
                  const isSelected = sess.id === currentSessionId;
                  return (
                    <div
                      key={sess.id}
                      onClick={() => setCurrentSessionId(sess.id)}
                      className={`group flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-ivory-pure border border-ochre/40 text-oxford font-semibold shadow-2xs'
                          : 'hover:bg-ivory text-oxford-muted hover:text-oxford'
                      }`}
                    >
                      <div className="flex items-center space-x-2 min-w-0 pr-1">
                        <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-ochre' : 'text-oxford-muted'}`} />
                        <span className="truncate text-xs font-sans">
                          {sess.title || 'Discussion sans titre'}
                        </span>
                      </div>
                      <button
                        onClick={(e) => handleDeleteSession(e, sess.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 transition-opacity"
                        title="Archiver cette discussion"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section Les 12 Étapes & Agents Universitaires (GET /parcours) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-oxford-muted block">
                Les 12 Étapes de la Plateforme
              </span>
              <span className="text-[9px] bg-ochre-soft text-ochre font-bold px-1.5 py-0.5 rounded-xs">
                {parcoursSteps.length || 12} Jalons
              </span>
            </div>

            {/* Lancement de l'étape ouverte : il vit ICI, dans la navigation, et non dans la zone
                de conversation — celle-ci ne contient que le fil et la saisie. */}
            {dossierState?.etape_ouverte && (
              <div className="px-1 pb-1.5">
                <button
                  onClick={handleLaunchOpenEtape}
                  disabled={runningEtape}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-ochre hover:bg-ochre-hover disabled:opacity-60 text-ivory text-[11px] font-semibold rounded-xl shadow-2xs transition-all active:scale-95"
                >
                  {runningEtape ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                      <span className="truncate">
                        Étape {etapeEnCours ?? dossierState.etape_ouverte} en cours —{' '}
                        {secondesEtape >= 60
                          ? `${Math.floor(secondesEtape / 60)} min ${String(secondesEtape % 60).padStart(2, '0')} s`
                          : `${secondesEtape} s`}
                      </span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Lancer l'étape {dossierState.etape_ouverte}</span>
                    </>
                  )}
                </button>
                {etapeError && (
                  <p className="mt-1.5 px-1 text-[10px] text-red-700 font-reading leading-snug">
                    {etapeError}
                  </p>
                )}
              </div>
            )}
            <div className="space-y-0.5">
              {(parcoursSteps.length > 0
                ? parcoursSteps
                : ACADEMIC_AGENTS.map((a) => ({
                    position: a.position,
                    libelle: a.title,
                    resume: a.shortDesc,
                  }))
              ).map((step) => {
                const isSelected = step.position === activeAgentId;
                const isOpened = dossierState?.etape_ouverte === step.position;
                return (
                  <button
                    key={step.position}
                    onClick={() => {
                      setActiveAgentId(step.position);
                      if (notesDrawerOpen) reloadDraftWorkspace();
                    }}
                    className={`w-full text-left flex items-center space-x-2.5 p-2 px-2.5 rounded-xl text-xs transition-all ${
                      isSelected
                        ? 'bg-ochre-soft/80 text-oxford font-semibold ring-1 ring-ochre/50 shadow-2xs'
                        : 'hover:bg-ivory text-oxford-muted hover:text-oxford'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border text-[11px] font-serif font-bold ${
                        isOpened
                          ? 'bg-ochre text-ivory border-ochre shadow-2xs'
                          : isSelected
                          ? 'bg-oxford text-ivory border-oxford'
                          : 'bg-ochre-soft/70 text-ochre border-ochre/20'
                      }`}
                    >
                      {step.position}
                    </span>
                    <div className="truncate min-w-0 font-sans text-xs flex-1">
                      <span className="truncate block font-medium">{step.libelle}</span>
                    </div>
                    {isOpened && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded-md shrink-0">
                        Ouverte
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pied de Sidebar : Profil Étudiant & Déconnexion */}
        <div className="p-3 border-t border-oxford-border/10 bg-ivory-card shrink-0 flex items-center justify-between text-xs">
          <div className="min-w-0 pr-2">
            <span className="font-bold text-oxford truncate block">
              {user?.name || 'Étudiant'}
            </span>
            <span className="text-[10px] text-oxford-muted truncate block">
              {user?.email}
            </span>
          </div>

          <button
            onClick={logout}
            className="p-1.5 text-oxford-muted hover:text-red-700 hover:bg-ivory rounded-full transition-colors shrink-0"
            title="Se déconnecter"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ==================================================================== */}
      {/*  2. ZONE CENTRALE : LE CHAT DE CONSULTATION MÉTHODOLOGIQUE           */}
      {/* ==================================================================== */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-ivory relative">
        {/* Barre supérieure discrète du chat */}
        <header className="h-14 px-3 sm:px-6 border-b border-oxford-border/10 bg-ivory/90 backdrop-blur-xs flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            {!sidebarOpen && (
              <div className="flex items-center space-x-1.5 shrink-0">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-1.5 rounded-xl hover:bg-ivory-card text-oxford-muted hover:text-oxford transition-colors border border-oxford-border/20"
                  title="Ouvrir le menu et les étapes"
                >
                  <PanelLeft className="w-4 h-4" />
                </button>
                <Link
                  to="/"
                  className="w-7 h-7 bg-oxford text-ivory flex items-center justify-center rounded-lg font-serif font-bold text-xs shadow-2xs hover:bg-ochre transition-colors"
                  title="Page d'accueil du site"
                >
                  MR
                </Link>
              </div>
            )}

            <div className="min-w-0">
              <span className="font-serif font-bold text-xs sm:text-sm text-oxford truncate max-w-[180px] sm:max-w-xs md:max-w-md block">
                {activeProject?.title || 'Mon Mémoire'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {/* Bouton retour Accueil */}
            <Link
              to="/"
              className="inline-flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-full bg-ivory-pure text-oxford border border-oxford-border/20 hover:border-ochre shadow-2xs transition-all hover:bg-ivory"
              title="Retourner à la page d'accueil"
            >
              <Home className="w-3.5 h-3.5 text-ochre" />
              <span className="hidden sm:inline">Accueil</span>
            </Link>

            {/* Bouton Ressources */}
            <Link
              to="/ressources"
              className="inline-flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-full bg-ivory-pure text-oxford border border-oxford-border/20 hover:border-ochre shadow-2xs transition-all hover:bg-ivory"
              title="Consulter les guides et normes méthodologiques"
            >
              <BookOpen className="w-3.5 h-3.5 text-ochre" />
              <span className="hidden md:inline">Ressources</span>
            </Link>

            {/* Bouton pour ouvrir le volet Rédaction / Notes */}
            <button
              onClick={() => setNotesDrawerOpen(!notesDrawerOpen)}
              className={`inline-flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                notesDrawerOpen
                  ? 'bg-ochre-soft text-ochre border-ochre font-bold'
                  : 'bg-ivory-pure text-oxford border-oxford-border/20 hover:border-ochre shadow-2xs hover:bg-ivory'
              }`}
              title="Ouvrir vos notes et votre rédaction pour cette étape"
            >
              <FileEdit className="w-3.5 h-3.5 text-ochre" />
              <span className="hidden lg:inline">Mes Notes & Rédaction</span>
            </button>

            {/* Bouton Corpus & Documents */}
            <button
              onClick={handleOpenDocuments}
              className={`inline-flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                documentsDrawerOpen
                  ? 'bg-ochre-soft text-ochre border-ochre font-bold'
                  : 'bg-ivory-pure text-oxford border-oxford-border/20 hover:border-ochre shadow-2xs hover:bg-ivory'
              }`}
              title="Consulter le corpus documentaire et télécharger les PDF et la bibliographie"
            >
              <FolderKanban className="w-3.5 h-3.5 text-ochre" />
              <span className="hidden md:inline">Corpus & Bibliographie</span>
            </button>

            {/* Bouton déconnexion rapide */}
            <button
              onClick={logout}
              className="p-1.5 text-oxford-muted hover:text-red-600 hover:bg-ivory-pure rounded-full border border-oxford-border/20 transition-colors shadow-2xs"
              title="Se déconnecter"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Zone de défilement de la conversation : c'est le fil, et rien d'autre. */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          <div className="max-w-3xl lg:max-w-4xl mx-auto space-y-6">
            {/* LISTE DES MESSAGES DU FIL */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'student' ? 'items-end' : 'items-start'
                }`}
              >
                {msg.role === 'student' ? (
                  /* Message de l'étudiant (bulle arrondie fluide) */
                  <div className="max-w-[85%] bg-ivory-pure border border-oxford-border/20 p-4 sm:p-5 rounded-2xl rounded-tr-xs shadow-2xs space-y-1">
                    <span className="text-[10px] font-semibold text-oxford-muted uppercase tracking-wider block font-sans">
                      Vous
                    </span>
                    <p className="font-reading text-sm text-oxford whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </p>
                  </div>
                ) : (
                  /* Message de l'Agent Méthodologique (carte de réponse arrondie) */
                  <div className="w-full bg-ivory-pure border border-oxford-border/15 border-l-4 border-l-ochre p-5 sm:p-6 rounded-2xl shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-oxford-border/10 pb-2.5">
                      <div className="flex items-center space-x-2">
                        <span className="w-7 h-7 rounded-xl bg-ochre-soft text-ochre inline-flex items-center justify-center border border-ochre/20">
                          <AgentIcon
                            name={agentFromEngine(msg.engine)?.iconName}
                            agentId={agentFromEngine(msg.engine)?.id}
                            className="w-4 h-4"
                          />
                        </span>
                        <div>
                          <span className="font-serif font-bold text-xs text-oxford block">
                            {agentFromEngine(msg.engine)?.name ?? 'Guide Méthodologique'}
                          </span>
                          <span className="text-[10px] text-oxford-muted font-sans block">
                            {agentFromEngine(msg.engine)?.title ?? 'Spécialiste Universitaire'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 text-xs text-oxford-muted">
                        <span className="text-[10px]">
                          {new Date(msg.createdAt).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="p-1 hover:text-oxford transition-colors"
                          title="Copier la réponse"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleInsertIntoNotes(msg.content)}
                          className="p-1 hover:text-ochre transition-colors text-[10px] font-semibold flex items-center space-x-0.5"
                          title="Insérer dans mes notes de rédaction"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Insérer en note</span>
                        </button>
                      </div>
                    </div>

                    <div className="academic-prose text-sm leading-relaxed">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeSanitize]}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* STREAMING EN TEMPS RÉEL DE LA RÉPONSE */}
            {isAnalyzing && (
              <div className="w-full bg-ivory-pure border border-oxford-border/15 border-l-4 border-l-ochre p-5 sm:p-6 rounded-2xl shadow-sm space-y-3 animate-fade-in">
                <div className="flex items-center justify-between border-b border-oxford-border/10 pb-2">
                  <div className="flex items-center space-x-2 text-xs font-serif font-bold text-ochre">
                    <Loader2 className="w-4 h-4 animate-spin text-ochre" />
                    <span>
                      {routing
                        ? `${routing.name} formule ses recommandations...`
                        : "Le comité méthodologique analyse votre demande..."}
                    </span>
                  </div>
                </div>

                {routing?.reason && (
                  <p className="text-[11px] text-oxford-muted font-reading italic">
                    Orientation : {routing.reason}
                  </p>
                )}

                {streamingDelta ? (
                  <div className="academic-prose text-sm leading-relaxed">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeSanitize]}
                    >
                      {streamingDelta}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="font-reading text-xs text-oxford-muted italic">
                    Vérification de la conformité méthodologique et préparation de la réponse...
                  </p>
                )}
              </div>
            )}

            {/* Message d'erreur éventuel */}
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ================================================================== */}
        {/*  BARRE DE SAISIE CENTRÉE ACADÉMIQUE                                */}
        {/* ================================================================== */}
        <div className="p-4 sm:pb-6 bg-gradient-to-t from-ivory via-ivory to-transparent shrink-0">
          <div className="max-w-3xl lg:max-w-4xl mx-auto space-y-2 relative">
            {/* Boîte d'écriture unifiée arrondie */}
            <div className="relative flex items-end bg-ivory-pure border border-oxford-border/30 focus-within:border-ochre focus-within:ring-2 focus-within:ring-ochre/20 rounded-2xl sm:rounded-3xl shadow-md transition-all p-1">
              {/* BOUTON '+' POUR SÉLECTIONNER L'UN DES 12 AGENTS */}
              <button
                type="button"
                onClick={() => setIsAgentMenuOpen(!isAgentMenuOpen)}
                className={`m-1.5 p-2 rounded-full transition-all shrink-0 flex items-center justify-center ${
                  isAgentMenuOpen
                    ? 'bg-ochre text-ivory rotate-45 shadow-2xs'
                    : 'bg-ivory hover:bg-ochre-soft text-oxford hover:text-ochre border border-oxford-border/20'
                }`}
                title="Changer d'agent spécialiste (+)"
              >
                <Plus className="w-4 h-4 transition-transform duration-200" />
              </button>

              {/* CHAMP TEXTE AUTO-EXTENSIBLE */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={activeAgent.placeholder || "Posez votre question méthodologique ici..."}
                rows={1}
                className="auto-grow w-full py-3 px-3 text-sm font-reading text-oxford bg-transparent border-none focus:outline-hidden leading-relaxed resize-none placeholder:text-oxford-muted/50 max-h-36"
              />

              {/* BOUTON ENVOYER */}
              <button
                onClick={() => handleSendMessage(input)}
                disabled={!input.trim() || isAnalyzing}
                className="m-1.5 p-2.5 bg-ochre hover:bg-ochre-hover text-ivory rounded-full shadow-2xs transition-all disabled:opacity-30 disabled:hover:bg-ochre shrink-0 active:scale-95"
                title="Envoyer la question"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Ligne informative inférieure */}
            <div className="flex items-center justify-between text-[11px] text-oxford-muted px-1 font-reading">
              <span className="flex items-center space-x-1.5 truncate">
                <Sparkles className="w-3 h-3 text-ochre shrink-0" />
                <span className="truncate">
                  Spécialiste ciblé : <strong>{activeAgent.name}</strong> ({activeAgent.title})
                </span>
              </span>
              <span className="hidden sm:inline">
                Entrée pour envoyer • Shift+Entrée pour saut de ligne
              </span>
            </div>

            {/* ================================================================ */}
            {/*  POPOVER DU BOUTON '+' : SÉLECTEUR ÉPURÉ DES 12 AGENTS           */}
            {/* ================================================================ */}
            {isAgentMenuOpen && (
              <div
                ref={agentMenuRef}
                className="absolute bottom-20 left-0 right-0 z-50 bg-ivory-pure border border-oxford-border/30 rounded-2xl shadow-2xl p-4 space-y-3 max-h-[70vh] flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-150"
              >
                <div className="flex items-center justify-between border-b border-oxford-border/10 pb-2">
                  <div>
                    <h4 className="font-serif font-bold text-sm text-oxford flex items-center space-x-2">
                      <GraduationCap className="w-4 h-4 text-ochre" />
                      <span>Choisir un spécialiste universitaire</span>
                    </h4>
                    <p className="text-[11px] text-oxford-muted font-reading">
                      Sélectionnez l'étape de votre mémoire pour orienter la réflexion.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAgentMenuOpen(false)}
                    className="p-1.5 hover:bg-ivory rounded-full text-oxford-muted hover:text-oxford"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 overflow-y-auto p-1 flex-1">
                  {ACADEMIC_AGENTS.map((agent) => {
                    const isSelected = agent.id === activeAgentId;
                    return (
                      <button
                        key={agent.id}
                        onClick={() => {
                          setActiveAgentId(agent.id);
                          setIsAgentMenuOpen(false);
                          textareaRef.current?.focus();
                        }}
                        className={`text-left p-3 rounded-xl border transition-all flex items-start space-x-3 ${
                          isSelected
                            ? 'bg-ochre-soft/50 border-ochre ring-1 ring-ochre shadow-2xs'
                            : 'bg-ivory hover:bg-ivory-card border-oxford-border/15 hover:border-ochre/60'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-xl bg-ochre-soft text-ochre flex items-center justify-center border border-ochre/25 shrink-0">
                          <AgentIcon name={agent.iconName} agentId={agent.id} className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="font-serif font-bold text-xs text-oxford truncate">
                              Étape {agent.id} : {agent.name}
                            </span>
                            {isSelected && (
                              <span className="text-[9px] font-bold text-ochre bg-ochre-soft px-1.5 py-0.5 rounded-full">
                                Actif
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-semibold text-oxford-muted truncate block">
                            {agent.title}
                          </span>
                          <p className="text-[10px] text-oxford-muted/90 font-reading line-clamp-2 leading-relaxed">
                            {agent.shortDesc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ==================================================================== */}
      {/*  3. VOLET LATÉRAL DROIT : BROUILLON / RÉDACTION (OPTIONNEL & DISCRET) */}
      {/* ==================================================================== */}
      {notesDrawerOpen && (
        <aside className="w-96 border-l border-oxford-border/15 bg-ivory-pure flex flex-col h-full shrink-0 shadow-xl animate-in slide-in-from-right duration-200">
          <div className="p-3.5 border-b border-oxford-border/10 flex items-center justify-between bg-ivory shrink-0">
            <div className="flex items-center space-x-2">
              <FileEdit className="w-4 h-4 text-ochre" />
              <div>
                <h3 className="font-serif font-bold text-xs text-oxford">
                  Notes & Rédaction — Étape {activeAgent.id}
                </h3>
                <span className="text-[10px] text-oxford-muted font-sans">
                  {draftContent.trim().length > 0 ? draftContent.trim().split(/\s+/).length : 0} mots
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="p-1.5 text-oxford-muted hover:text-ochre rounded-sm text-xs flex items-center space-x-1"
                title="Historique des versions (Zéro-Perte)"
              >
                <History className="w-3.5 h-3.5" />
                <span className="text-[10px]">({draftVersions.length})</span>
              </button>
              <button
                onClick={() => setNotesDrawerOpen(false)}
                className="p-1 hover:bg-ivory-card rounded-sm text-oxford-muted hover:text-oxford"
                title="Fermer le volet"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Historique des versions */}
          {showHistory && (
            <div className="p-3 bg-ivory-card/80 border-b border-oxford-border/10 space-y-2 shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-oxford block">
                Sauvegardes antérieures
              </span>
              <div className="flex space-x-2 overflow-x-auto py-1">
                {draftVersions.map((ver) => (
                  <button
                    key={ver.id}
                    onClick={async () => {
                      if (!activeProject) return;
                      const res = await api.getStepWorkspace(activeProject.id, activeAgentId);
                      setDraftContent(ver.content || res.workspace?.content || '');
                    }}
                    className="shrink-0 p-2 bg-ivory-pure border border-oxford-border/20 text-xs rounded-sm hover:border-ochre text-left space-y-0.5"
                  >
                    <span className="font-bold text-[11px] block">Rév. #{ver.revision}</span>
                    <span className="text-[9px] text-oxford-muted block">
                      {ver.wordCount} mots • {new Date(ver.createdAt).toLocaleTimeString('fr-FR')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Éditeur de texte */}
          <div className="flex-1 p-4 flex flex-col">
            <textarea
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
              placeholder="Rédigez ici vos notes de travail, plan ou synthèse pour cette étape... Cliquez sur 'Sauvegarder' pour créer une révision protégée."
              className="w-full flex-1 resize-none border-none bg-transparent font-reading text-sm text-oxford leading-relaxed focus:outline-hidden placeholder:text-oxford-muted/40"
            />
          </div>

          {/* Barre inférieure de sauvegarde */}
          <div className="p-3 border-t border-oxford-border/10 bg-ivory flex items-center justify-between shrink-0">
            <span className="text-[10px] text-oxford-muted">
              {saveSuccess ? 'Enregistré avec succès !' : 'Politique Zéro-Perte active'}
            </span>
            <button
              onClick={handleSaveDraft}
              disabled={savingDraft}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-ochre hover:bg-ochre-hover text-ivory text-xs font-semibold rounded-sm shadow-2xs transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingDraft ? 'Enregistrement...' : 'Sauvegarder'}</span>
            </button>
          </div>
        </aside>
      )}

      {/* ==================================================================== */}
      {/*  3. TIROIR ESCAMOTABLE : CORPUS DOCUMENTAIRE & BIBLIOGRAPHIE (RÈGLE 8) */}
      {/* ==================================================================== */}
      {documentsDrawerOpen && (
        <aside className="w-80 sm:w-96 fixed sm:static inset-y-0 right-0 z-30 bg-ivory-card border-l border-oxford-border/10 flex flex-col shrink-0 overflow-hidden shadow-2xl sm:shadow-none animate-slide-left">
          <div className="p-4 border-b border-oxford-border/10 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2">
              <FolderKanban className="w-4 h-4 text-ochre" />
              <h3 className="font-serif font-bold text-sm text-oxford">Corpus Documentaire</h3>
            </div>
            <button
              onClick={() => setDocumentsDrawerOpen(false)}
              className="p-1.5 hover:bg-ivory rounded-full text-oxford-muted hover:text-oxford transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 border-b border-oxford-border/10 bg-ivory-pure/60 flex items-center justify-between">
            <span className="text-[11px] text-oxford-muted">Bibliographie complète :</span>
            {activeProject && (
              <a
                href={api.getBibliographyDownloadUrl(activeProject.id, 'bibtex')}
                download="bibliographie.bib"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-oxford hover:bg-ochre text-ivory text-xs font-medium rounded-xl transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Format BibTeX (.bib)</span>
              </a>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loadingDocs ? (
              <div className="py-12 text-center space-y-2 text-oxford-muted text-xs">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-ochre" />
                <p>Récupération du corpus documentaire...</p>
              </div>
            ) : documentsList.length === 0 ? (
              <div className="py-12 text-center space-y-2 text-oxford-muted text-xs font-reading">
                <BookOpen className="w-8 h-8 mx-auto text-oxford-muted/40" />
                <p>Aucun document archivé dans le corpus pour ce mémoire.</p>
              </div>
            ) : (
              documentsList.map((doc) => (
                <div
                  key={doc.doc_id}
                  className="bg-ivory-pure border border-oxford-border/20 rounded-xl p-3.5 space-y-2 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-serif font-bold text-xs text-oxford line-clamp-2">
                      {doc.titre}
                    </h4>
                    <span className="text-[10px] font-mono text-ochre bg-ochre-soft px-1.5 py-0.5 rounded shrink-0">
                      {doc.telechargeable === false ? 'RÉF' : 'PDF'}
                    </span>
                  </div>
                  {(doc.auteurs || doc.annee) && (
                    <p className="text-[11px] text-oxford-muted font-reading">
                      {doc.auteurs} {doc.annee ? `(${doc.annee})` : ''}
                    </p>
                  )}
                  {doc.revue && (
                    <p className="text-[11px] text-oxford/80 font-reading line-clamp-3">
                      {doc.revue}
                    </p>
                  )}
                  {activeProject && (
                    <a
                      href={api.getDocumentDownloadUrl(activeProject.id, doc.doc_id)}
                      download={`document-${doc.doc_id}.pdf`}
                      className="inline-flex items-center space-x-1.5 text-xs text-ochre hover:text-ochre-hover font-medium pt-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Télécharger le PDF réel</span>
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </aside>
      )}

      {/* ==================================================================== */}
      {/*  MODALE DE CRÉATION DE PROJET (SIMPLE & DIRECTE)                      */}
      {/* ==================================================================== */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-oxford/60 backdrop-blur-xs p-4">
          <div className="bg-ivory-pure border border-oxford-border/30 max-w-md w-full p-6 rounded-sm shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-oxford-border/10 pb-2">
              <h3 className="font-serif text-lg font-bold text-oxford">
                Nouveau Mémoire de Recherche
              </h3>
              <button
                onClick={() => setShowProjectModal(false)}
                className="p-1 hover:bg-ivory rounded-sm text-oxford-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-oxford mb-1">
                  Titre du mémoire ou sujet de départ
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex : Digitalisation des services bancaires et inclusion financière"
                  className="w-full px-3 py-2 border border-oxford-border/30 bg-ivory focus:bg-ivory-pure focus:outline-hidden focus:border-ochre rounded-sm text-oxford text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-oxford mb-1">
                  Discipline ou Domaine
                </label>
                <input
                  type="text"
                  required
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="Ex : Sciences de Gestion / Finance"
                  className="w-full px-3 py-2 border border-oxford-border/30 bg-ivory focus:bg-ivory-pure focus:outline-hidden focus:border-ochre rounded-sm text-oxford text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="px-3 py-2 border border-oxford-border/20 text-oxford hover:bg-ivory rounded-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creatingProject}
                  className="px-4 py-2 bg-ochre hover:bg-ochre-hover text-ivory font-semibold rounded-sm shadow-2xs disabled:opacity-50"
                >
                  {creatingProject ? 'Création...' : 'Créer et ouvrir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

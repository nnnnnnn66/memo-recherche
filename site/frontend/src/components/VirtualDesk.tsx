import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import {
  Send,
  Loader2,
  Sparkles,
  AlertCircle,
  Plus,
  X,
  ChevronRight,
  Maximize2,
  Minimize2,
  GraduationCap,
  Info,
} from 'lucide-react';
import { api, type ConsultationMessage, type AgentRouting } from '../api/client';
import { ACADEMIC_AGENTS, getAgentByIdOrSlug, type AgentDescriptor } from '../data/agents';
import { AgentIcon } from './AgentIcon';

/** Retrouve l'agent qui a répondu à partir du champ `engine` ("<slug>-<fournisseur>") */
function agentFromEngine(engine?: string): AgentDescriptor | undefined {
  if (!engine) return undefined;
  const idx = engine.lastIndexOf('-');
  if (idx <= 0) return undefined;
  const slug = engine.slice(0, idx);
  return ACADEMIC_AGENTS.find((a) => a.slug === slug);
}

interface VirtualDeskProps {
  projectId: string;
  stepId?: number;
  stepTitle?: string;
  onSelectStep?: (stepId: number) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const VirtualDesk: React.FC<VirtualDeskProps> = ({
  projectId,
  stepId = 1,
  onSelectStep,
  isExpanded = false,
  onToggleExpand,
}) => {
  const [activeAgentId, setActiveAgentId] = useState<number>(stepId);
  const [isAgentMenuOpen, setIsAgentMenuOpen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConsultationMessage[]>([]);
  const [input, setInput] = useState('');
  const [streamingDelta, setStreamingDelta] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routing, setRouting] = useState<AgentRouting | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Synchronise l'agent actif quand la prop change depuis le parent
  useEffect(() => {
    if (stepId && stepId !== activeAgentId) {
      setActiveAgentId(stepId);
    }
  }, [stepId]);

  const activeAgent: AgentDescriptor = getAgentByIdOrSlug(activeAgentId);

  // Fermer le menu lors d'un clic extérieur ou Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsAgentMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAgentMenuOpen(false);
      }
    };
    if (isAgentMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAgentMenuOpen]);

  const refreshSessions = async () => {
    try {
      const res = await api.getProjectSessions(projectId);
      if (!currentSessionId && res.sessions.length > 0) {
        setCurrentSessionId(res.sessions[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    let ignore = false;
    api.getProjectSessions(projectId)
      .then((res) => {
        if (!ignore && !currentSessionId && res.sessions.length > 0) {
          setCurrentSessionId(res.sessions[0].id);
        }
      })
      .catch((err) => console.error(err));
    return () => {
      ignore = true;
    };
  }, [projectId, currentSessionId]);

  useEffect(() => {
    if (!currentSessionId) return;
    let ignore = false;
    api.getSessionMessages(currentSessionId)
      .then((res) => {
        if (!ignore) setMessages(res.messages);
      })
      .catch((err) => console.error(err));
    return () => {
      ignore = true;
    };
  }, [currentSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingDelta, isAnalyzing]);

  const handleSelectAgent = (agent: AgentDescriptor) => {
    setActiveAgentId(agent.id);
    setIsAgentMenuOpen(false);
    if (onSelectStep) {
      onSelectStep(agent.id);
    }
    textareaRef.current?.focus();
  };

  const handleSendPrompt = (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isAnalyzing) return;

    setError(null);
    setInput('');
    setIsAnalyzing(true);
    setStreamingDelta('');
    setRouting(null);

    const tempStudentMsg: ConsultationMessage = {
      id: `temp-${Date.now()}`,
      sessionId: currentSessionId || '',
      role: 'student',
      content: trimmed,
      status: 'complete',
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempStudentMsg]);

    let accumulated = '';

    api.streamConsultation({
      projectId,
      sessionId: currentSessionId || undefined,
      stepId: activeAgent.id,
      prompt: trimmed,
      onSessionCreated: (newSessionId) => {
        setCurrentSessionId(newSessionId);
        refreshSessions();
      },
      onAgent: (r) => {
        setRouting(r);
        if (r.stepId && r.stepId !== activeAgentId) {
          setActiveAgentId(r.stepId);
          onSelectStep?.(r.stepId);
        }
      },
      onDelta: (textChunk) => {
        accumulated += textChunk;
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
      },
      onError: (err) => {
        setIsAnalyzing(false);
        setStreamingDelta('');
        setError(err.message || "Anomalie lors de l'analyse avec l'agent.");
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendPrompt(input);
    }
  };

  return (
    <div className="flex flex-col h-full bg-ivory border-l border-ivory-card relative">
      {/* ==================================================================== */}
      {/*  EN-TÊTE DU BUREAU CONVERSATIONNEL                                   */}
      {/* ==================================================================== */}
      <div className="p-3.5 bg-ivory border-b border-ivory-card flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2.5">
          <span className="w-8 h-8 rounded-sm bg-ochre-soft text-ochre flex items-center justify-center border border-ochre/25 shrink-0">
            <AgentIcon name={activeAgent.iconName} agentId={activeAgent.id} className="w-4 h-4" />
          </span>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-serif font-bold text-sm text-oxford">
                {activeAgent.name}
              </span>
              <span className="text-[10px] font-semibold text-ochre bg-ochre-soft px-1.5 py-0.5 rounded-sm">
                Étape {activeAgent.id}/12
              </span>
            </div>
            <p className="text-[11px] text-oxford-muted font-reading truncate max-w-[240px] sm:max-w-xs">
              {activeAgent.shortDesc}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="p-1.5 text-oxford-muted hover:text-oxford hover:bg-ivory-pure rounded-sm transition-colors"
              title={isExpanded ? 'Réduire en mode scindé' : 'Agrandir en plein écran'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/*  FIL DES MESSAGES & CONVERSATIONS                                    */}
      {/* ==================================================================== */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.length === 0 && !isAnalyzing && (
          <div className="py-10 max-w-md mx-auto text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-ochre-soft border border-ochre/25 flex items-center justify-center text-ochre shadow-2xs">
              <AgentIcon name={activeAgent.iconName} agentId={activeAgent.id} className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="font-serif font-bold text-oxford text-base">
                Étape visée : {activeAgent.title}
              </h3>
              <p className="font-reading text-xs text-oxford-muted leading-relaxed">
                Le comité méthodologique oriente chacune de vos questions vers le spécialiste le plus compétent,
                en tenant compte de l'étape que vous avez indiquée.
              </p>
            </div>

            {/* Questions réflexives suggérées */}
            <div className="pt-2 space-y-2 text-left">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-oxford-muted block text-center">
                Suggestions pour démarrer cette étape
              </span>
              <div className="space-y-1.5">
                {activeAgent.suggestedPrompts.map((promptText, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendPrompt(promptText)}
                    className="w-full text-left p-2.5 bg-ivory-pure hover:bg-ochre-soft/40 border border-oxford-border/20 hover:border-ochre rounded-sm text-xs text-oxford transition-all flex items-center justify-between group shadow-2xs"
                  >
                    <span className="line-clamp-2 pr-2 font-reading">« {promptText} »</span>
                    <ChevronRight className="w-3.5 h-3.5 text-oxford-muted group-hover:text-ochre shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === 'student' ? 'items-end' : 'items-start'
            }`}
          >
            {msg.role === 'student' ? (
              <div className="max-w-[85%] bg-ivory-pure border border-oxford-border/20 p-4 rounded-2xl rounded-tr-xs shadow-2xs space-y-1">
                <span className="text-[10px] font-semibold text-oxford-muted uppercase tracking-wider block font-sans">
                  Votre message
                </span>
                <p className="font-reading text-sm text-oxford whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </p>
              </div>
            ) : (
              <div className="max-w-[94%] bg-ivory-pure border border-oxford-border/15 border-l-4 border-l-ochre p-5 rounded-2xl shadow-sm space-y-2.5">
                <div className="flex items-center justify-between text-xs font-serif font-bold text-oxford border-b border-ivory-card pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-ochre-soft text-ochre inline-flex items-center justify-center border border-ochre/20">
                      <AgentIcon
                        name={agentFromEngine(msg.engine)?.iconName}
                        agentId={agentFromEngine(msg.engine)?.id}
                        className="w-3.5 h-3.5"
                      />
                    </span>
                    <span>{agentFromEngine(msg.engine)?.name ?? 'Spécialiste méthodologique'}</span>
                  </div>
                  <span className="text-[10px] font-sans font-normal text-oxford-muted">
                    {new Date(msg.createdAt).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
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

        {isAnalyzing && (
          <div className="max-w-[94%] bg-ivory-pure border border-oxford-border/15 border-l-4 border-l-ochre p-5 rounded-2xl shadow-sm space-y-3 animate-fade-in">
            <div className="flex items-center space-x-2 text-xs font-serif font-bold text-ochre">
              <Loader2 className="w-4 h-4 animate-spin text-ochre" />
              <span>
                {routing
                  ? `${routing.name} formule ses recommandations...`
                  : "Le comité méthodologique sélectionne le spécialiste..."}
              </span>
            </div>

            {routing && (
              <p className="text-[11px] text-oxford-muted font-reading italic">
                Orientation académique : {routing.reason}
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
                Analyse de votre question au regard des règles méthodologiques universitaires...
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ==================================================================== */}
      {/*  MENU FLOTTANT POPOVER DU BOUTON '+' (12 ÉTAPES / AGENTS)           */}
      {/* ==================================================================== */}
      {isAgentMenuOpen && (
        <div
          ref={menuRef}
          className="absolute bottom-24 left-4 right-4 sm:left-6 sm:right-6 z-50 bg-ivory-pure border border-oxford-border/30 rounded-sm shadow-2xl p-4 space-y-3 max-h-[75vh] flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <div className="flex items-center justify-between border-b border-ivory-card pb-2.5">
            <div>
              <h4 className="font-serif font-bold text-sm text-oxford flex items-center space-x-2">
                <GraduationCap className="w-4 h-4 text-ochre" />
                <span>Indiquer l'étape visée</span>
              </h4>
              <p className="text-[11px] text-oxford-muted font-reading">
                Le conseil méthodologique en tient compte pour confier votre question au spécialiste le plus compétent.
              </p>
            </div>
            <button
              onClick={() => setIsAgentMenuOpen(false)}
              className="p-1 hover:bg-ivory rounded-sm text-oxford-muted hover:text-oxford"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 overflow-y-auto p-1 flex-1">
            {ACADEMIC_AGENTS.map((agent) => {
              const isCurrent = agent.id === activeAgentId;
              return (
                <button
                  key={agent.id}
                  onClick={() => handleSelectAgent(agent)}
                  className={`text-left p-3 rounded-xl border transition-all flex items-start space-x-3 ${
                    isCurrent
                      ? 'bg-ochre-soft/50 border-ochre ring-1 ring-ochre shadow-2xs'
                      : 'bg-ivory hover:bg-ivory-card border-oxford-border/15 hover:border-ochre/60'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-ochre-soft text-ochre flex items-center justify-center border border-ochre/25 shrink-0">
                    <AgentIcon name={agent.iconName} agentId={agent.id} className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-bold text-xs text-oxford truncate">
                        Étape {agent.id} : {agent.name}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold text-ochre bg-ochre-soft px-1.5 py-0.5 rounded-full">
                          Actif
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-semibold text-oxford-muted truncate">
                      {agent.title}
                    </div>
                    <p className="text-[10px] text-oxford-muted/90 font-reading line-clamp-2 leading-relaxed">
                      {agent.shortDesc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-ivory-card flex items-center justify-between text-[11px] text-oxford-muted">
            <span className="flex items-center space-x-1">
              <Info className="w-3.5 h-3.5 text-ochre" />
              <span>Orientation personnalisée selon les normes universitaires</span>
            </span>
            <span>12 Spécialistes méthodologiques</span>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/*  ZONE D'ÉCRITURE CENTRÉE AVEC BOUTON '+'                             */}
      {/* ==================================================================== */}
      <div className="p-4 bg-ivory border-t border-ivory-card space-y-2 shrink-0">
        {/* Badge de l'agent actif au-dessus de l'input */}
        <div className="flex items-center justify-between px-1">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-ivory-pure border border-oxford-border/20 rounded-full text-xs font-serif text-oxford shadow-2xs">
            <span className="w-4 h-4 rounded-full bg-ochre-soft text-ochre inline-flex items-center justify-center">
              <AgentIcon name={activeAgent.iconName} agentId={activeAgent.id} className="w-2.5 h-2.5" />
            </span>
            <span className="font-bold">{activeAgent.name}</span>
            <span className="text-oxford-muted hidden sm:inline">— {activeAgent.title}</span>
            <button
              onClick={() => setIsAgentMenuOpen(true)}
              className="ml-1 text-[10px] text-ochre hover:underline font-sans font-semibold"
              title="Changer d'agent"
            >
              (Changer)
            </button>
          </div>
          <span className="text-[11px] text-oxford-muted hidden sm:inline">
            Touche <kbd className="px-1.5 py-0.5 bg-ivory-pure border border-oxford-border/20 rounded-md text-[10px]">Entrée</kbd> pour envoyer
          </span>
        </div>

        {/* Boîte de saisie unifiée arrondie */}
        <div className="relative flex items-end bg-ivory-pure border border-oxford-border/30 focus-within:border-ochre focus-within:ring-2 focus-within:ring-ochre/20 rounded-2xl sm:rounded-3xl shadow-md p-1">
          {/* BOUTON '+' EN BAS À GAUCHE */}
          <button
            type="button"
            onClick={() => setIsAgentMenuOpen(!isAgentMenuOpen)}
            className={`m-1 p-2 rounded-full transition-all shrink-0 flex items-center justify-center ${
              isAgentMenuOpen
                ? 'bg-ochre text-ivory rotate-45 shadow-2xs'
                : 'bg-ivory hover:bg-ochre-soft text-oxford hover:text-ochre border border-oxford-border/20'
            }`}
            title="Choisir l'un des 12 agents méthodologiques (+)"
          >
            <Plus className="w-4 h-4 transition-transform duration-200" />
          </button>

          {/* CHAMP DE TEXTE PRINCIPAL */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={activeAgent.placeholder}
            rows={2}
            className="auto-grow w-full py-2.5 px-3 text-sm font-reading text-oxford bg-transparent border-none focus:outline-hidden leading-relaxed resize-none placeholder:text-oxford-muted/50"
          />

          {/* BOUTON ENVOYER */}
          <button
            onClick={() => handleSendPrompt(input)}
            disabled={!input.trim() || isAnalyzing}
            className="m-1 p-2 bg-ochre hover:bg-ochre-hover text-ivory rounded-full shadow-2xs transition-all disabled:opacity-40 disabled:hover:bg-ochre shrink-0 active:scale-95"
            title={`Envoyer au ${activeAgent.name}`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Ligne d'information inférieure */}
        <div className="flex items-center justify-between text-[11px] text-oxford-muted px-1 font-reading">
          <span className="flex items-center space-x-1.5">
            <Sparkles className="w-3 h-3 text-ochre" />
            <span>
              Étape visée : <strong>{activeAgent.title}</strong> — accompagnement universitaire LMD / CAMES.
            </span>
          </span>
          <span>{input.length}/4000 car.</span>
        </div>
      </div>
    </div>
  );
};

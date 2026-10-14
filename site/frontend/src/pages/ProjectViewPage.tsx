import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, type MethodologyStep, type ResearchProject } from '../api/client';
import { VirtualDesk } from '../components/VirtualDesk';
import {
  ArrowLeft,
  Save,
  History,
  ChevronDown,
  Columns,
  MessageSquare,
  FileText,
} from 'lucide-react';

export const ProjectViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<ResearchProject | null>(null);
  const [steps, setSteps] = useState<MethodologyStep[]>([]);
  const [activeStepId, setActiveStepId] = useState<number>(1);
  const [content, setContent] = useState('');
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'chat' | 'editor'>('split');

  useEffect(() => {
    if (!id) return;
    let ignore = false;
    Promise.all([api.getProject(id), api.getSteps()])
      .then(([projRes, stepsRes]) => {
        if (!ignore) {
          setProject(projRes.project);
          setSteps(stepsRes.steps);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [id]);

  const reloadWorkspace = async (stepId: number) => {
    if (!id) return;
    try {
      const [wsRes, versRes] = await Promise.all([
        api.getStepWorkspace(id, stepId),
        api.getStepVersions(id, stepId),
      ]);
      setContent(wsRes.workspace?.content || '');
      setVersions(versRes.versions);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!id) return;
    let ignore = false;
    Promise.all([
      api.getStepWorkspace(id, activeStepId),
      api.getStepVersions(id, activeStepId),
    ])
      .then(([wsRes, versRes]) => {
        if (!ignore) {
          setContent(wsRes.workspace?.content || '');
          setVersions(versRes.versions);
        }
      })
      .catch((err) => console.error(err));
    return () => {
      ignore = true;
    };
  }, [id, activeStepId]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      await api.saveStepWorkspace(id, activeStepId, {
        content,
        note: `Révision du ${new Date().toLocaleTimeString('fr-FR')}`,
      });
      setSaveSuccess(true);
      await reloadWorkspace(activeStepId);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const activeStep = steps.find((s) => s.id === activeStepId);

  if (loading || !project) {
    return (
      <div className="py-24 text-center text-sm text-oxford-muted font-reading">
        Chargement de votre espace de travail...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* ==================================================================== */}
      {/*  BARRE SUPÉRIEURE DU PROJET                                          */}
      {/* ==================================================================== */}
      <div className="bg-ivory border-b border-ivory-card px-4 sm:px-6 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3 min-w-0">
          <Link
            to="/dashboard"
            className="p-1.5 text-oxford hover:text-ochre hover:bg-ivory-pure rounded-sm transition-colors shrink-0"
            title="Retour au tableau de bord"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="font-serif font-bold text-sm sm:text-base text-oxford truncate max-w-xs sm:max-w-md lg:max-w-lg">
              {project.title}
            </h1>
            <span className="text-[10px] text-oxford-muted uppercase tracking-wider block font-sans truncate">
              {project.domain} • Mémoire de Recherche
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {/* Sélecteur de mode d'affichage */}
          <div className="hidden md:flex items-center bg-ivory-pure border border-oxford-border/20 rounded-sm p-0.5 text-xs text-oxford-muted">
            <button
              onClick={() => setViewMode('split')}
              className={`px-2 py-1 rounded-xs flex items-center space-x-1 transition-colors ${
                viewMode === 'split' ? 'bg-ochre-soft text-ochre font-bold' : 'hover:text-oxford'
              }`}
              title="Affichage scindé : Éditeur + Consultation"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Scindé</span>
            </button>
            <button
              onClick={() => setViewMode('chat')}
              className={`px-2 py-1 rounded-xs flex items-center space-x-1 transition-colors ${
                viewMode === 'chat' ? 'bg-ochre-soft text-ochre font-bold' : 'hover:text-oxford'
              }`}
              title="Mode Consultation plein écran"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Consultation</span>
            </button>
            <button
              onClick={() => setViewMode('editor')}
              className={`px-2 py-1 rounded-xs flex items-center space-x-1 transition-colors ${
                viewMode === 'editor' ? 'bg-ochre-soft text-ochre font-bold' : 'hover:text-oxford'
              }`}
              title="Mode Rédaction seule"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Éditeur</span>
            </button>
          </div>

          {/* Sélecteur d'étape dropdown */}
          <div className="relative hidden lg:block">
            <select
              value={activeStepId}
              onChange={(e) => setActiveStepId(parseInt(e.target.value, 10))}
              className="appearance-none bg-ivory-pure border border-oxford-border/20 text-xs font-serif font-semibold text-oxford py-1.5 pl-3 pr-8 rounded-sm focus:outline-hidden focus:border-ochre cursor-pointer"
            >
              {steps.map((st) => (
                <option key={st.id} value={st.id}>
                  Étape {st.position} : {st.title}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-oxford-muted absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Boutons Historique et Sauvegarde (visibles si éditeur affiché) */}
          {viewMode !== 'chat' && (
            <>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 bg-ivory-pure border border-oxford-border/20 text-xs text-oxford hover:border-ochre rounded-sm transition-colors"
                title="Historique des révisions (Append-only)"
              >
                <History className="w-3.5 h-3.5 text-ochre" />
                <span className="hidden sm:inline">Versions ({versions.length})</span>
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-ochre hover:bg-ochre-hover text-ivory text-xs font-medium rounded-sm shadow-2xs transition-colors disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Sauvegarde...' : saveSuccess ? 'Sauvegardé !' : 'Sauvegarder'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/*  ZONE DE TRAVAIL PRINCIPALE (MODES SPLIT / CHAT / EDITOR)             */}
      {/* ==================================================================== */}
      <div className="flex-1 overflow-hidden relative">
        {/* MODE CONSULTATION IMMERSIF (PLEIN ÉCRAN) */}
        {viewMode === 'chat' && (
          <div className="w-full h-full max-w-5xl mx-auto flex flex-col shadow-sm">
            <VirtualDesk
              projectId={project.id}
              stepId={activeStepId}
              stepTitle={activeStep?.title}
              onSelectStep={(newStepId) => setActiveStepId(newStepId)}
              isExpanded={true}
              onToggleExpand={() => setViewMode('split')}
            />
          </div>
        )}

        {/* MODE RÉDACTION SEULE (ÉDITEUR PLEIN ÉCRAN) */}
        {viewMode === 'editor' && (
          <div className="w-full h-full max-w-4xl mx-auto flex flex-col bg-ivory-pure overflow-y-auto p-6 sm:p-8 space-y-4">
            {activeStep && (
              <div className="p-4 bg-ivory border border-ivory-card rounded-sm space-y-1">
                <span className="text-xs font-serif font-bold text-ochre uppercase tracking-wider">
                  Étape {activeStep.position} sur {steps.length || 12} — {activeStep.title}
                </span>
                <p className="font-reading text-xs text-oxford-muted">
                  {activeStep.guidance}
                </p>
              </div>
            )}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Rédigez ici votre travail pour cette étape..."
              className="w-full flex-1 min-h-[500px] resize-none border-none bg-transparent font-reading text-base text-oxford leading-relaxed focus:outline-hidden"
            />
          </div>
        )}

        {/* MODE SCINDÉ (ÉDITEUR 55% + BUREAU MÉTHODOLOGIQUE 45%) */}
        {viewMode === 'split' && (
          <div className="w-full h-full grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
            {/* Colonne gauche : Éditeur de texte */}
            <div className="lg:col-span-7 flex flex-col bg-ivory-pure overflow-y-auto border-r border-ivory-card">
              {activeStep && (
                <div className="p-4 sm:p-6 bg-ivory border-b border-ivory-card space-y-2 shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-serif font-bold text-ochre uppercase tracking-wider">
                      Étape {activeStep.position} sur {steps.length || 12} — {activeStep.slug}
                    </span>
                    <span className="text-[11px] text-oxford-muted">
                      {content.trim().length > 0 ? content.trim().split(/\s+/).length : 0} mots
                    </span>
                  </div>
                  <h2 className="font-serif text-lg font-bold text-oxford">
                    {activeStep.title}
                  </h2>
                  <p className="font-reading text-xs text-oxford-muted leading-relaxed">
                    {activeStep.guidance}
                  </p>
                </div>
              )}

              {showHistory && (
                <div className="p-4 bg-ivory-card/60 border-b border-ivory-card space-y-2 shrink-0">
                  <span className="text-xs font-bold text-oxford uppercase tracking-wider block">
                    Sauvegardes incrémentales (Zéro-Perte)
                  </span>
                  <div className="flex space-x-2 overflow-x-auto py-1">
                    {versions.map((ver) => (
                      <button
                        key={ver.id}
                        onClick={async () => {
                          const res = await api.getStepWorkspace(project.id, activeStepId);
                          setContent(ver.content || res.workspace?.content || '');
                        }}
                        className="shrink-0 px-3 py-1.5 bg-ivory-pure border border-oxford-border/20 text-xs rounded-sm text-oxford hover:border-ochre text-left space-y-0.5"
                      >
                        <span className="font-bold block">Révision #{ver.revision}</span>
                        <span className="text-[10px] text-oxford-muted block">
                          {ver.wordCount} mots • {new Date(ver.createdAt).toLocaleTimeString('fr-FR')}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex-1 p-4 sm:p-6">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Rédigez ici votre travail pour cette étape (problématique, revue bibliographique, méthodologie)... Chaque enregistrement crée une nouvelle version immuable sans écrasement."
                  className="w-full h-full min-h-[400px] resize-none border-none bg-transparent font-reading text-base text-oxford leading-relaxed focus:outline-hidden placeholder:text-oxford-muted/40"
                />
              </div>
            </div>

            {/* Colonne droite : Bureau Virtuel Multi-Agents */}
            <div className="lg:col-span-5 h-full overflow-hidden border-t lg:border-t-0 border-ivory-card">
              <VirtualDesk
                projectId={project.id}
                stepId={activeStepId}
                stepTitle={activeStep?.title}
                onSelectStep={(newStepId) => setActiveStepId(newStepId)}
                isExpanded={false}
                onToggleExpand={() => setViewMode('chat')}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

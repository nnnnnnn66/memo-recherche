import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type ResearchProject } from '../api/client';
import { useAuth } from '../context/useAuth';
import { Plus, FolderKanban, Clock, Trash2, ArrowUpRight } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [creating, setCreating] = useState(false);

  const refreshProjects = () => {
    api.getProjects()
      .then((res) => setProjects(res.projects));
  };

  useEffect(() => {
    let ignore = false;
    api.getProjects()
      .then((res) => {
        if (!ignore) setProjects(res.projects);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDomain) return;
    setCreating(true);
    try {
      await api.createProject({ title: newTitle, domain: newDomain });
      setShowModal(false);
      setNewTitle('');
      setNewDomain('');
      refreshProjects();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Voulez-vous archiver le projet "${title}" ? (Conformément à la politique Zéro-Perte, vos travaux restent intégralement conservés en base).`)) {
      await api.deleteProject(id);
      refreshProjects();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ivory-card pb-6">
        <div>
          <span className="text-xs font-semibold text-ochre uppercase tracking-wider">
            Espace Personnel Étudiant
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-oxford">
            Mes Travaux de Recherche
          </h1>
          <p className="text-xs text-oxford-muted mt-1 font-reading">
            Bienvenue, {user?.name}. Gérez vos projets et continuez vos consultations méthodologiques.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-ochre hover:bg-ochre-hover text-ivory text-sm font-medium rounded-sm shadow-2xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau projet de mémoire</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-oxford-muted text-sm font-reading">
          Chargement de vos projets...
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-ivory-pure border border-ivory-card p-12 text-center rounded-sm space-y-4">
          <FolderKanban className="w-12 h-12 text-oxford-muted/50 mx-auto" />
          <h3 className="font-serif text-lg font-bold text-oxford">
            Aucun projet de recherche en cours
          </h3>
          <p className="text-xs text-oxford-muted max-w-sm mx-auto font-reading">
            Commencez par créer votre premier projet de mémoire pour accéder à l'éditeur et au Bureau Virtuel d'accompagnement.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-oxford hover:bg-oxford-surface text-ivory text-xs font-medium rounded-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-ochre" />
            <span>Créer mon premier projet</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-ivory-pure border border-ivory-card hover:border-oxford-border/40 p-6 rounded-sm shadow-2xs transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ochre font-semibold px-2 py-0.5 bg-ochre-soft rounded-sm">
                    {project.domain}
                  </span>
                  <span className="text-oxford-muted capitalize">
                    {project.status === 'draft' ? 'Brouillon' : project.status}
                  </span>
                </div>
                <h3 className="font-serif text-lg font-bold text-oxford line-clamp-2 leading-snug">
                  {project.title}
                </h3>
              </div>

              <div className="pt-4 border-t border-ivory-card flex items-center justify-between text-xs text-oxford-muted">
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Mis à jour le {new Date(project.updatedAt).toLocaleDateString('fr-FR')}</span>
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDelete(project.id, project.title)}
                    title="Archiver le projet (Soft delete)"
                    className="p-1 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <Link
                    to={`/projects/${project.id}`}
                    className="inline-flex items-center space-x-1 text-ochre font-semibold hover:underline"
                  >
                    <span>Ouvrir</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-oxford/60 backdrop-blur-xs p-4">
          <div className="bg-ivory-pure border border-oxford-border/30 max-w-lg w-full p-6 rounded-sm shadow-xl space-y-5">
            <div className="space-y-1">
              <h2 className="font-serif text-xl font-bold text-oxford">
                Nouveau projet de mémoire
              </h2>
              <p className="text-xs text-oxford-muted font-reading">
                Définissez l'intitulé provisoire et le domaine d'étude académique.
              </p>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-oxford mb-1">
                  Titre provisoire ou question de départ
                </label>
                <textarea
                  required
                  rows={3}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Impact de la digitalisation des paiements agricoles sur le revenu des planteurs de cacao dans la région du N'Zi"
                  className="w-full px-3 py-2 border border-oxford-border/30 bg-ivory focus:bg-ivory-pure focus:outline-hidden focus:border-ochre rounded-sm text-oxford text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-oxford mb-1">
                  Domaine / Discipline scientifique
                </label>
                <input
                  type="text"
                  required
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="Ex: Sciences Économiques / Agroéconomie"
                  className="w-full px-3 py-2 border border-oxford-border/30 bg-ivory focus:bg-ivory-pure focus:outline-hidden focus:border-ochre rounded-sm text-oxford text-sm"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-oxford-border/20 text-oxford hover:bg-ivory text-xs font-medium rounded-sm transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-ochre hover:bg-ochre-hover text-ivory text-xs font-medium rounded-sm shadow-2xs transition-colors disabled:opacity-50"
                >
                  {creating ? 'Création...' : 'Créer et ouvrir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

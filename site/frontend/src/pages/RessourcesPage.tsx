import React from 'react';
import { Bookmark, ArrowRight, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

export const RessourcesPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="max-w-2xl space-y-3">
        <span className="text-xs font-semibold text-ochre uppercase tracking-wider">
          Fonds Documentaire & Normes
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-oxford">
          Ressources Méthodologiques Universitaires
        </h1>
        <p className="font-reading text-oxford-muted text-base leading-relaxed">
          Guides de rédaction, normes de référencement académique et repères pour la recherche
          en contexte africain et ivoirien.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-ivory-pure border border-oxford-border/15 p-7 rounded-2xl space-y-3 shadow-2xs hover:shadow-xs hover:border-ochre/30 transition-all">
          <div className="flex items-center space-x-2 text-ochre text-xs font-semibold uppercase tracking-wider">
            <Bookmark className="w-4 h-4" />
            <span>Normes Bibliographiques</span>
          </div>
          <h3 className="font-serif text-xl font-bold text-oxford">
            Le Style APA (7e édition) adapté aux mémoires
          </h3>
          <p className="font-reading text-sm text-oxford-muted leading-relaxed">
            Règles de citation dans le texte (Auteur, Année) et mise en forme de la bibliographie
            finale pour les articles scientifiques, ouvrages et thèses universitaires.
          </p>
        </div>

        <div className="bg-ivory-pure border border-oxford-border/15 p-7 rounded-2xl space-y-3 shadow-2xs hover:shadow-xs hover:border-ochre/30 transition-all">
          <div className="flex items-center space-x-2 text-ochre text-xs font-semibold uppercase tracking-wider">
            <Bookmark className="w-4 h-4" />
            <span>Démarche Empirique</span>
          </div>
          <h3 className="font-serif text-xl font-bold text-oxford">
            Échantillonnage et Terrains d'Enquête en Côte d'Ivoire
          </h3>
          <p className="font-reading text-sm text-oxford-muted leading-relaxed">
            Méthodes probabilistes vs non probabilistes (boule de neige, quotas) adaptées aux
            contextes d'enquêtes de terrain à Abidjan et à l'intérieur du pays.
          </p>
        </div>

        <div className="bg-ivory-pure border border-oxford-border/15 p-7 rounded-2xl space-y-3 shadow-2xs hover:shadow-xs hover:border-ochre/30 transition-all">
          <div className="flex items-center space-x-2 text-ochre text-xs font-semibold uppercase tracking-wider">
            <Bookmark className="w-4 h-4" />
            <span>Éthique et Déontologie</span>
          </div>
          <h3 className="font-serif text-xl font-bold text-oxford">
            Intégrité Scientifique & Prévention du Plagiat
          </h3>
          <p className="font-reading text-sm text-oxford-muted leading-relaxed">
            Comment paraphraser correctement, attribuer les sources de manière irréprochable et
            distinguer votre propre analyse critique des faits rapportés.
          </p>
        </div>

        <div className="bg-ivory-pure border border-oxford-border/15 p-7 rounded-2xl space-y-3 shadow-2xs hover:shadow-xs hover:border-ochre/30 transition-all">
          <div className="flex items-center space-x-2 text-ochre text-xs font-semibold uppercase tracking-wider">
            <Bookmark className="w-4 h-4" />
            <span>Épreuve Orale</span>
          </div>
          <h3 className="font-serif text-xl font-bold text-oxford">
            Préparation du Support de Soutenance
          </h3>
          <p className="font-reading text-sm text-oxford-muted leading-relaxed">
            Structure d'un diaporama efficace en 12 diapositives pour une présentation de 15 minutes
            devant le jury académique.
          </p>
        </div>
      </div>

      {/* Bannière de consultation chat */}
      <div className="bg-oxford text-ivory p-8 sm:p-12 rounded-2xl text-center space-y-4 shadow-lg">
        <h3 className="font-serif text-2xl font-bold">
          Une question sur les normes de votre mémoire ?
        </h3>
        <p className="text-sm text-ivory/80 max-w-prose mx-auto font-reading">
          Posez vos questions directement aux spécialistes universitaires : citation APA, protocole d'échantillonnage ou grille d'évaluation.
        </p>
        <Link
          to="/workspace"
          className="inline-flex items-center space-x-2 px-8 py-3.5 bg-ochre hover:bg-ochre-hover text-ivory rounded-full text-xs font-semibold shadow-md transition-all active:scale-[0.99]"
        >
          <MessageSquare className="w-4 h-4 text-ochre-soft" />
          <span>Ouvrir l'Espace Chat Méthodologique</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

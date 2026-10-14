import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  MessageSquare,
  GraduationCap,
  Shield,
  CheckCircle2,
  Award,
  Compass,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';

export const HomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="w-full">
      {/* 1. HERO VITRINE PLEINE LARGEUR : PREND TOUT L'ESPACE HORIZONTAL SANS RESTER AU MILIEU */}
      <section className="relative w-full overflow-hidden bg-oxford py-8 sm:py-10 md:py-12 px-4 sm:px-6 text-center border-b border-oxford-border/40 shadow-lg">
        {/* Image vitrine en arrière-plan occupant 100% de la largeur */}
        <img
          src="/images/african-showcase-bg.jpg"
          alt="Grande bibliothèque universitaire et espace de recherche académique"
          className="absolute inset-0 w-full h-full object-cover object-center transform scale-100 select-none"
          loading="eager"
        />

        {/* Voiles dégradés nobles pour garantir un contraste et une lisibilité parfaits */}
        <div className="absolute inset-0 bg-gradient-to-t from-oxford via-oxford/85 to-oxford/70 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-oxford/60 via-transparent to-oxford/60 pointer-events-none" />

        {/* Halo doré chaud au centre derrière le titre */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[500px] h-[220px] sm:h-[300px] bg-ochre/20 rounded-full blur-3xl pointer-events-none" />

        {/* Contenu textuel et interactif compact */}
        <div className="relative z-10 max-w-2xl mx-auto space-y-3.5 sm:space-y-4 flex flex-col items-center">
          {/* Badge supérieur compact */}
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-oxford/85 backdrop-blur-md border border-ochre/50 rounded-full text-[11px] font-semibold text-ochre-light shadow-md hover:border-ochre transition-colors">
            <Award className="w-3 h-3 text-ochre-light shrink-0" />
            <span className="font-serif tracking-wide text-ivory">Accompagnement Méthodologique Universitaire</span>
            <span className="text-ivory/40">•</span>
            <span className="text-ochre-light font-serif font-bold">LMD / CAMES</span>
          </div>

          {/* TITRE MAJEUR : TAILLE RÉDUITE ET ÉLÉGANTE POUR ÉVITER LES VIDES */}
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-snug max-w-2xl mx-auto">
            <span className="block text-ivory tracking-tight drop-shadow-md">
              Votre mémoire de recherche,
            </span>
            <span className="relative inline-block mt-1 sm:mt-1.5">
              <span className="font-serif italic font-normal tracking-normal bg-gradient-to-r from-[#FDE68A] via-[#F59E0B] to-[#D97706] bg-clip-text text-transparent drop-shadow-md">
                guidé par la rigueur académique.
              </span>
              {/* Ligne calligraphique dorée discrète */}
              <svg
                className="absolute -bottom-1.5 left-0 w-full h-2.5 text-ochre-light/70 overflow-visible"
                viewBox="0 0 100 12"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path d="M0,8 Q50,1 100,8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          {/* Séparateur calligraphique discret */}
          <div className="flex items-center justify-center space-x-2.5 py-0.5 opacity-80">
            <div className="w-12 h-px bg-gradient-to-r from-transparent via-ochre-light/60 to-transparent" />
            <div className="w-1.5 h-1.5 rotate-45 border border-ochre-light bg-ochre/60" />
            <div className="w-12 h-px bg-gradient-to-l from-transparent via-ochre-light/60 to-transparent" />
          </div>

          {/* Chapeau explicatif clair et concis */}
          <p className="font-reading text-xs sm:text-sm md:text-base text-ivory/90 max-w-xl mx-auto leading-relaxed drop-shadow-sm">
            <strong className="text-ivory font-semibold">12 spécialistes méthodologiques</strong> pour questionner votre sujet,
            affiner votre problématique et structurer votre enquête selon les standards universitaires.
          </p>

          {/* Boutons d'action compacts */}
          <div className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
            <Link
              to={user ? '/workspace' : '/register'}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-ochre via-[#D97706] to-[#B45309] hover:from-[#D97706] hover:to-[#92400E] text-ivory text-xs sm:text-sm font-semibold rounded-full shadow-lg shadow-ochre/30 hover:shadow-xl hover:shadow-ochre/45 hover:-translate-y-0.5 active:translate-y-0 transition-all group"
            >
              <MessageSquare className="w-3.5 h-3.5 text-ochre-soft" />
              <span>{user ? 'Ouvrir mon Chat' : 'Accéder au Chat'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>

            {!user ? (
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-ivory/15 hover:bg-ivory/25 backdrop-blur-md border border-ivory/30 hover:border-ochre-light text-ivory text-xs sm:text-sm font-medium rounded-full hover:-translate-y-0.5 transition-all shadow-md"
              >
                Déjà un compte ? Se connecter
              </Link>
            ) : (
              <Link
                to="/parcours"
                className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-ivory/15 hover:bg-ivory/25 backdrop-blur-md border border-ivory/30 hover:border-ochre-light text-ivory text-xs sm:text-sm font-medium rounded-full hover:-translate-y-0.5 transition-all shadow-md"
              >
                Consulter les 12 étapes
              </Link>
            )}
          </div>

          {/* Réassurance éthique et universitaire compacte */}
          <div className="pt-1 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[10px] sm:text-xs text-ivory/80 font-reading">
            <span className="inline-flex items-center space-x-1.5">
              <CheckCircle2 className="w-3 h-3 text-ochre-light shrink-0" />
              <span>Conforme LMD & CAMES</span>
            </span>
            <span className="inline-flex items-center space-x-1.5">
              <CheckCircle2 className="w-3 h-3 text-ochre-light shrink-0" />
              <span>Dialogue socratique sans ghostwriting</span>
            </span>
            <span className="inline-flex items-center space-x-1.5">
              <CheckCircle2 className="w-3 h-3 text-ochre-light shrink-0" />
              <span>Accompagnement rigoureux et gratuit</span>
            </span>
          </div>

          {/* Devise académique discrète */}
          <div className="pt-0.5 text-center">
            <p className="font-serif italic text-[11px] sm:text-xs text-ivory/60 max-w-lg mx-auto">
              « Du terrain d'enquête à la soutenance : la rigueur méthodologique au service de la souveraineté scientifique. »
            </p>
          </div>
        </div>
      </section>

      {/* 2. RESTE DE LA PAGE DANS LE CADRE STANDARD */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-14 sm:space-y-16">
        {/* 2. BANDEA      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto text-center">
        <div className="p-5 bg-ivory-pure border border-oxford-border/15 rounded-2xl shadow-2xs space-y-1 hover:border-ochre/30 transition-colors">
          <span className="font-serif font-bold text-2xl text-ochre block">12</span>
          <span className="text-xs font-semibold text-oxford block">Étapes Méthodologiques</span>
          <span className="text-[11px] text-oxford-muted font-reading block">
            Du cadrage initial à la défense du mémoire
          </span>
        </div>

        <div className="p-5 bg-ivory-pure border border-oxford-border/15 rounded-2xl shadow-2xs space-y-1 hover:border-ochre/30 transition-colors">
          <span className="font-serif font-bold text-2xl text-ochre block">100%</span>
          <span className="text-xs font-semibold text-oxford block">Posture Socratique</span>
          <span className="text-[11px] text-oxford-muted font-reading block">
            Zéro rédaction à la place, stimulation intellectuelle
          </span>
        </div>

        <div className="p-5 bg-ivory-pure border border-oxford-border/15 rounded-2xl shadow-2xs space-y-1 hover:border-ochre/30 transition-colors">
          <span className="font-serif font-bold text-2xl text-ochre block">Zéro-Perte</span>
          <span className="text-xs font-semibold text-oxford block">Sauvegarde Inviolable</span>
          <span className="text-[11px] text-oxford-muted font-reading block">
            Historique incrémental (Append-only) sécurisé
          </span>
        </div>
      </section>

      {/* 4. APERÇU DU CHAT CENTRAL DE CONSULTATION */}
      <section className="bg-ivory-pure border border-oxford-border/15 rounded-2xl p-5 sm:p-7 shadow-lg max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between border-b border-oxford-border/10 pb-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-ochre" />
            <span className="font-serif font-bold text-oxford">Espace de Consultation Méthodologique</span>
          </div>
          <span className="text-oxford-muted text-[11px] font-mono">12 Spécialistes Universitaires</span>
        </div>

        <div className="space-y-3 py-2 text-xs">
          {/* Exemple question étudiant */}
          <div className="flex justify-end">
            <div className="max-w-md bg-ivory p-4 rounded-2xl rounded-tr-xs border border-oxford-border/20 text-oxford space-y-1 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-oxford-muted block">Étudiant (Question)</span>
              <p className="font-reading text-xs leading-relaxed">
                « Voici mon sujet : "L'impact de la digitalisation sur les banques". Est-il trop vaste pour un Master ? »
              </p>
            </div>
          </div>

          {/* Exemple réponse spécialiste */}
          <div className="flex justify-start">
            <div className="max-w-xl bg-ivory-card/60 border border-oxford-border/15 border-l-4 border-l-ochre p-5 rounded-2xl space-y-2 shadow-xs">
              <div className="flex items-center space-x-2 font-serif font-bold text-oxford text-xs">
                <span className="w-6 h-6 rounded-lg bg-ochre-soft text-ochre inline-flex items-center justify-center border border-ochre/20">
                  <Compass className="w-3.5 h-3.5" />
                </span>
                <span>Spécialiste Sujet — Conseil Méthodologique</span>
              </div>
              <p className="font-reading text-xs text-oxford leading-relaxed">
                Oui, en l'état votre formulation relève d'un thème général et non d'un sujet scientifique délimité.
                Pour répondre aux exigences universitaires, appliquez la règle des 3 dimensions :
              </p>
              <ul className="list-disc pl-4 space-y-1 text-oxford-muted font-reading text-xs">
                <li><strong>Spatiale</strong> : Quel terrain précis ? (Ex : banques de détail en Côte d'Ivoire)</li>
                <li><strong>Temporelle</strong> : Quelle période d'observation ? (Ex : 2020-2025)</li>
                <li><strong>Conceptuelle</strong> : Quel aspect précis de la digitalisation ? (Ex : les paiements mobiles)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5. LES 3 PILIERS CLÉS SANS SURCHARGE */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 max-w-4xl mx-auto">
        <div className="p-6 bg-ivory-pure border border-oxford-border/15 rounded-2xl space-y-2 shadow-2xs hover:border-ochre/50 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-ochre-soft text-ochre flex items-center justify-center mb-3 border border-ochre/20">
            <GraduationCap className="w-5 h-5" />
          </div>
          <h3 className="font-serif font-bold text-base text-oxford">
            12 Spécialistes Méthodologiques
          </h3>
          <p className="font-reading text-xs text-oxford-muted leading-relaxed">
            Un spécialiste dédié pour chaque étape : délimitation du sujet, problématique, revue bibliographique,
            protocole d'enquête et préparation de la soutenance.
          </p>
        </div>

        <div className="p-6 bg-ivory-pure border border-oxford-border/15 rounded-2xl space-y-2 shadow-2xs hover:border-ochre/50 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-ochre-soft text-ochre flex items-center justify-center mb-3 border border-ochre/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="font-serif font-bold text-base text-oxford">
            Rigueur Académique LMD
          </h3>
          <p className="font-reading text-xs text-oxford-muted leading-relaxed">
            L'accompagnement agit comme un tuteur bienveillant mais exigeant : il vous questionne et valide vos choix,
            sans jamais se substituer à votre effort intellectuel de rédaction.
          </p>
        </div>

        <div className="p-6 bg-ivory-pure border border-oxford-border/15 rounded-2xl space-y-2 shadow-2xs hover:border-ochre/50 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-ochre-soft text-ochre flex items-center justify-center mb-3 border border-ochre/20">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="font-serif font-bold text-base text-oxford">
            Sauvegarde Zéro-Perte
          </h3>
          <p className="font-reading text-xs text-oxford-muted leading-relaxed">
            Chaque sauvegarde génère une version incrémentale inviolable (Append-only). Vos consultations
            et vos notes de travail restent définitivement préservées.
          </p>
        </div>
      </section>

      {/* 6. BANNIÈRE APPEL À L'ACTION */}
      <section className="bg-oxford text-ivory p-8 sm:p-12 rounded-2xl text-center space-y-4 shadow-xl max-w-4xl mx-auto relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-ochre/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-ochre/10 rounded-full blur-2xl pointer-events-none" />

        <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
          Prêt à démarrer votre mémoire de recherche ?
        </h2>
        <p className="font-reading text-xs sm:text-sm text-ivory/80 max-w-lg mx-auto leading-relaxed">
          Rejoignez la plateforme et bénéficiez immédiatement de l'accompagnement personnalisé conforme aux standards universitaires.
        </p>
        <div className="pt-2">
          <Link
            to={user ? '/workspace' : '/register'}
            className="inline-flex items-center space-x-2 px-8 py-3.5 bg-ochre hover:bg-ochre-hover text-ivory text-xs font-semibold rounded-full shadow-md transition-all active:scale-[0.99]"
          >
            <span>{user ? 'Reprendre ma consultation' : 'Créer mon compte gratuitement'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
      </div>
    </div>
  );
};

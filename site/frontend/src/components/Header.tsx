import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { MessageSquare, LogOut, User as UserIcon, Menu, X, Home, BookOpen } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/' && (location.pathname === '/' || location.pathname === '/accueil')) return true;
    return location.pathname === path;
  };

  const navLinks = [
    { to: '/', label: 'Accueil', icon: Home },
    { to: '/ressources', label: 'Ressources & Guides', icon: BookOpen },
  ];

  return (
    <header className="bg-ivory/95 border-b border-oxford-border/10 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo Universitaire */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 bg-oxford text-ivory flex items-center justify-center rounded-xl font-serif font-bold text-lg shadow-sm border border-oxford-border group-hover:bg-ochre transition-colors duration-200">
            MR
          </div>
          <div>
            <span className="font-serif font-bold text-base text-oxford tracking-tight block leading-tight">
              Mémoire de Recherche
            </span>
            <span className="text-[10px] text-oxford-muted uppercase tracking-wider block font-sans">
              Accompagnement Méthodologique Académique
            </span>
          </div>
        </Link>

        {/* Navigation Bureau */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {navLinks.map((link) => {
            const active = isActive(link.to);
            const IconComponent = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-medium rounded-full transition-all ${
                  active
                    ? 'bg-ochre-soft text-ochre font-bold ring-1 ring-ochre/30'
                    : 'text-oxford hover:text-ochre hover:bg-ivory'
                }`}
              >
                <IconComponent className={`w-3.5 h-3.5 ${active ? 'text-ochre' : 'text-oxford-muted'}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Actions Utilisateur (Bureau) */}
        <div className="hidden md:flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-2.5">
              <Link
                to="/workspace"
                className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-ivory bg-ochre hover:bg-ochre-hover rounded-full shadow-2xs transition-all hover:shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Mon Espace Chat</span>
              </Link>

              <div className="flex items-center space-x-2 pl-2 border-l border-oxford-border/15">
                <span className="inline-flex items-center space-x-1.5 text-xs text-oxford font-medium px-2.5 py-1 bg-ivory-pure border border-oxford-border/20 rounded-full">
                  <UserIcon className="w-3.5 h-3.5 text-ochre" />
                  <span className="truncate max-w-[120px]">{user.name?.split(' ')[0] || 'Étudiant'}</span>
                </span>
                <button
                  onClick={() => logout()}
                  className="p-1.5 text-oxford-muted hover:text-red-600 hover:bg-ivory-pure rounded-full transition-colors"
                  title="Se déconnecter"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-xs font-medium text-oxford hover:text-ochre transition-colors rounded-full hover:bg-ivory"
              >
                Connexion
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-xs font-semibold text-ivory bg-oxford hover:bg-ochre rounded-full shadow-2xs transition-colors"
              >
                Commencer
              </Link>
            </div>
          )}
        </div>

        {/* Bouton Menu Mobile */}
        <div className="md:hidden flex items-center space-x-2">
          {user && (
            <Link
              to="/workspace"
              className="p-2 text-ivory bg-ochre rounded-full shadow-2xs"
              title="Mon Chat"
            >
              <MessageSquare className="w-4 h-4" />
            </Link>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-oxford hover:text-ochre rounded-full hover:bg-ivory transition-colors"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Menu Déroulant Mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-oxford-border/10 bg-ivory-pure px-4 py-4 space-y-3 animate-fade-in shadow-md">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const active = isActive(link.to);
              const IconComponent = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                    active
                      ? 'bg-ochre-soft text-ochre font-bold'
                      : 'text-oxford hover:bg-ivory'
                  }`}
                >
                  <IconComponent className="w-4 h-4 text-ochre" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-oxford-border/10">
            {user ? (
              <div className="space-y-2">
                <Link
                  to="/workspace"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 text-xs font-semibold text-ivory bg-ochre rounded-full shadow-2xs"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Accéder à mon Espace Chat</span>
                </Link>
                <div className="flex items-center justify-between px-3 pt-2 text-xs text-oxford-muted">
                  <span>Connecté en tant que <strong>{user.name || user.email}</strong></span>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="inline-flex items-center space-x-1 text-red-600 hover:underline"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Déconnexion</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center py-2 text-xs font-medium text-oxford bg-ivory border border-oxford-border/20 rounded-full"
                >
                  Connexion
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center py-2 text-xs font-semibold text-ivory bg-oxford rounded-full"
                >
                  Commencer
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

import React from 'react';
import { Link } from 'react-router-dom';

const CURRENT_YEAR = 2026;

export const Footer: React.FC = () => {
  return (
    <footer className="bg-oxford text-ivory border-t border-oxford-border/40 py-6 text-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Marque & Copyright */}
        <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-3 text-center sm:text-left">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-7 h-7 bg-oxford-surface text-ivory flex items-center justify-center rounded-sm font-serif font-bold text-xs border border-ochre/40 group-hover:bg-ochre transition-colors">
              MR
            </div>
            <span className="font-serif font-bold text-sm text-ivory tracking-tight">
              Mémoire de Recherche
            </span>
          </Link>
          <span className="hidden sm:inline text-ivory/30">•</span>
          <p className="text-[11px] text-ivory/60">
            © {CURRENT_YEAR} Accompagnement universitaire conforme LMD / CAMES
          </p>
        </div>

        {/* Réseaux Sociaux : Facebook, TikTok, LinkedIn, YouTube, X */}
        <div className="flex items-center space-x-2.5">
          {/* Facebook */}
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="w-8 h-8 rounded-sm bg-oxford-surface hover:bg-ochre text-ivory/80 hover:text-ivory flex items-center justify-center border border-oxford-border/40 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </a>

          {/* TikTok */}
          <a
            href="https://tiktok.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok"
            className="w-8 h-8 rounded-sm bg-oxford-surface hover:bg-ochre text-ivory/80 hover:text-ivory flex items-center justify-center border border-oxford-border/40 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.97v7.88c-.02 2.62-1.07 5.17-3.04 6.94-2.18 1.95-5.36 2.75-8.22 1.96-2.86-.79-5.18-3.04-6.07-5.87-.89-2.83-.24-6.05 1.72-8.24 1.97-2.19 5.09-3.13 7.98-2.38.01 1.4-.01 2.8.01 4.2-.99-.34-2.09-.34-3.05.02-.96.36-1.74 1.12-2.11 2.06-.38.94-.33 2.03.14 2.92.47.89 1.35 1.49 2.34 1.6 1.09.13 2.22-.22 2.96-.99.73-.77 1.07-1.85 1.05-2.91V.02z" />
            </svg>
          </a>

          {/* LinkedIn */}
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="w-8 h-8 rounded-sm bg-oxford-surface hover:bg-ochre text-ivory/80 hover:text-ivory flex items-center justify-center border border-oxford-border/40 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
            </svg>
          </a>

          {/* YouTube */}
          <a
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube"
            className="w-8 h-8 rounded-sm bg-oxford-surface hover:bg-ochre text-ivory/80 hover:text-ivory flex items-center justify-center border border-oxford-border/40 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </a>

          {/* X (Twitter) */}
          <a
            href="https://x.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="X Twitter"
            className="w-8 h-8 rounded-sm bg-oxford-surface hover:bg-ochre text-ivory/80 hover:text-ivory flex items-center justify-center border border-oxford-border/40 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
};

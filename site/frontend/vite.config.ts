import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Hôtes autorisés quand le site est vu par un LIEN PUBLIC (tunnel HTTPS) : sans cela Vite refuse
// toute requête dont l'en-tête Host n'est pas localhost (« Blocked request »).
// `.ts.net` = l'ADRESSE FIXE (Tailscale Funnel), celle qui ne change pas ; `.trycloudflare.com`
// reste pour le tunnel d'appoint. N'affaiblit rien à l'accès local, autorisé par défaut.
const HOSTS_AUTORISES = ['.ts.net', '.trycloudflare.com'];

const API = {
  '/api': {
    target: 'http://localhost:4000',
    changeOrigin: true,
  },
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // `server` = développement (`vite`) : des centaines de modules, lourd sur un réseau faible.
  server: {
    port: 5173,
    allowedHosts: HOSTS_AUTORISES,
    proxy: API,
  },
  // `preview` = la version CONSTRUITE, servie sur le MÊME port : une poignée de fichiers minifiés.
  // C'est cette version qu'on sert au public — un étudiant sur un réseau faible ne peut pas
  // attendre le chargement de plusieurs centaines de fichiers de développement.
  preview: {
    port: 5173,
    host: '127.0.0.1',
    allowedHosts: HOSTS_AUTORISES,
    proxy: API,
  },
});

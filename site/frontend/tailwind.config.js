/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Charte éditoriale stricte (Anti-Vibe Coding)
        ivory: {
          DEFAULT: '#FAF9F6', // Fond Blanc Ivoire académique
          pure: '#FFFFFF',    // Blanc pur pour encarts étudiants contrastés
          card: '#F5F3EF',    // Ivoire légèrement soutenu pour bordures et cartes
        },
        oxford: {
          DEFAULT: '#0B1221', // Bleu Oxford profond (Texte et structures nobles)
          dark: '#060B14',
          surface: '#151F33',
          border: '#24324D',
          muted: '#4A5B78',
        },
        ochre: {
          DEFAULT: '#B45309', // Ocre / Terre pour actions académiques
          hover: '#92400E',
          light: '#F59E0B',
          soft: '#FEF3C7',
        },
      },
      fontFamily: {
        // Polices académiques imposées
        serif: ['"Playfair Display"', 'Lora', 'Georgia', 'serif'],
        reading: ['Lora', 'Merriweather', 'serif'],
        sans: ['Figtree', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        // Bannir les gros arrondis : utiliser rounded-sm
        DEFAULT: '0.125rem', // 2px
        sm: '0.125rem',
        none: '0',
      },
      maxWidth: {
        // Largeur optimale de lecture (65-75 caractères par ligne)
        prose: '72ch',
      },
    },
  },
  plugins: [],
}

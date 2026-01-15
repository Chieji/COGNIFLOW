/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#000000',
        'dark-surface': '#0A0A0A',
        'dark-primary': '#121212',
        'dark-secondary': '#1A1A1A',
        'dark-accent': 'var(--user-accent-color, #FF0000)',
        'dark-accent-hover': '#CC0000',
        'dark-text': '#FFFFFF',
        'dark-text-secondary': '#A0A0A0',
        'light-bg': '#FFFFFF',
        'light-surface': '#F5F5F5',
        'light-primary': '#E5E5E5',
        'light-secondary': '#D4D4D4',
        'light-accent': 'var(--user-accent-color, #FF0000)',
        'light-accent-hover': '#CC0000',
        'light-text': '#000000',
        'light-text-secondary': '#404040',
      },
      boxShadow: {
        glow: '0 0 20px rgba(255, 0, 0, 0.2)',
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#09090b', // Zinc 950 - softer than pure black
        'dark-surface': '#18181b', // Zinc 900
        'dark-primary': '#27272a', // Zinc 800
        'dark-secondary': '#3f3f46', // Zinc 700
        'dark-accent': 'var(--user-accent-color, #ef4444)', // Red-500 default
        'dark-accent-hover': '#dc2626', // Red-600
        'dark-text': '#fafafa', // Zinc 50
        'dark-text-secondary': '#a1a1aa', // Zinc 400
        'light-bg': '#ffffff',
        'light-surface': '#f4f4f5', // Zinc 100
        'light-primary': '#e4e4e7', // Zinc 200
        'light-secondary': '#d4d4d8', // Zinc 300
        'light-accent': 'var(--user-accent-color, #ef4444)',
        'light-accent-hover': '#dc2626',
        'light-text': '#18181b',
        'light-text-secondary': '#52525b',
      },
      boxShadow: {
        glow: '0 0 20px rgba(255, 0, 0, 0.2)',
      },
    },
  },
  plugins: [],
};

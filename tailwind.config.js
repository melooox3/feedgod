/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        feedgod: {
          primary: '#EC4899',
          secondary: '#F472B6',
          accent: '#F9A8D4',
          light: '#FCE7F3',
          bg: '#FFF1F2',
          dark: '#831843',
          'pink-50': '#FDF2F8',
          'pink-100': '#FCE7F3',
          'pink-200': '#FBCFE8',
          'pink-300': '#F9A8D4',
          'pink-400': '#F472B6',
          'pink-500': '#EC4899',
          // Dark mode colors
          'dark-bg': '#0A0E27',
          'dark-secondary': '#1A1F3A',
          'dark-accent': '#2A2F4A',
          'neon-pink': '#FF00FF',
          'neon-cyan': '#00FFFF',
          'neon-purple': '#9D4EDD',
        },
      },
      fontFamily: {
        pixel: ['Press Start 2P', 'monospace'],
      },
      backgroundImage: {
        'feedgod-gradient': 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(249, 168, 212, 0.1) 100%)',
        'feedgod-radial': 'radial-gradient(ellipse at top left, rgba(236, 72, 153, 0.15) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(244, 114, 182, 0.2) 0%, transparent 50%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}

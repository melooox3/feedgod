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
          primary: '#ff0d6e',
          secondary: '#ff3d8a',
          accent: '#ff6b8a',
          purple: '#e534a8',
          magenta: '#d63384',
          light: '#2a2b25',
          bg: '#1D1E19',
          dark: '#1D1E19',
          'red-50': '#2a2b25',
          'red-100': '#252620',
          'red-200': '#3a3b35',
          'red-300': '#4a4b45',
          'red-400': '#ff6b8a',
          'red-500': '#ff0d6e',
          'red-600': '#e00b5f',
          // Dark background shades (all dark for proper dark theme)
          'purple-50': '#252620',   // darkest bg
          'purple-100': '#2a2b25',  // dark bg
          'purple-200': '#323329',  // slightly lighter
          'purple-300': '#3a3b35',  // border color
          // Dark mode colors
          'dark-bg': '#1D1E19',
          'dark-secondary': '#252620',
          'dark-accent': '#3a3b35',
          'neon-red': '#ff3d8a',
          'neon-cyan': '#ff6b8a',
          'neon-violet': '#ff0d6e',
        },
      },
      fontFamily: {
        pixel: ['Press Start 2P', 'monospace'],
      },
      backgroundImage: {
        'feedgod-gradient': 'linear-gradient(135deg, rgba(255, 13, 110, 0.1) 0%, rgba(255, 61, 138, 0.05) 100%)',
        'feedgod-radial': 'radial-gradient(ellipse at top left, rgba(255, 13, 110, 0.1) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(255, 61, 138, 0.08) 0%, transparent 50%)',
        'feedgod-accent': 'linear-gradient(135deg, #ff0d6e 0%, #ff0d6e 60%, #e534a8 100%)',
        'feedgod-accent-hover': 'linear-gradient(135deg, #ff3d8a 0%, #ff3d8a 50%, #d946ef 100%)',
        'feedgod-btn': 'linear-gradient(135deg, #ff0d6e 0%, #ff0d6e 70%, #d63384 100%)',
        'feedgod-btn-hover': 'linear-gradient(135deg, #ff3d8a 0%, #ff3d8a 60%, #e534a8 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}

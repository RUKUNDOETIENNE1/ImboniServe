module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Imboni Brand Colors
        imboni: {
          blue: '#1B2D65',      // Primary - headers, sidebar, buttons
          orange: '#E76F51',    // Resto accent - highlights, active states
          green: '#1F7A5A',     // Success - orders, availability
          gold: '#C9A227',      // AI insights, badges
          dark: '#1C1E21',      // Text, dark surfaces
          light: '#F5F7FA',     // Backgrounds, cards
        },
        primary: {
          DEFAULT: '#1B2D65',
          50: '#EEF1F8',
          100: '#D4DCED',
          200: '#A9B9DB',
          300: '#7E96C9',
          400: '#5373B7',
          500: '#1B2D65',
          600: '#162451',
          700: '#111B3D',
          800: '#0C1228',
          900: '#060914',
        },
        accent: {
          DEFAULT: '#E76F51',
          light: '#F39C7F',
          dark: '#D35A3E',
        },
        success: '#1F7A5A',
        warning: '#C9A227',
        danger: '#DC2626',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-imboni': 'linear-gradient(135deg, #1B2D65 0%, #E76F51 100%)',
        'gradient-resto': 'linear-gradient(135deg, #E76F51 0%, #C9A227 100%)',
      },
      keyframes: {
        'pulse-once': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'pulse-once': 'pulse-once 0.6s ease-in-out',
        'shimmer': 'shimmer 2s infinite linear',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
}
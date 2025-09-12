/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    container: { center: true, padding: '1rem' },
    extend: {
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Inter',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        // Пастельно-зелёная палитра и токены
        accent: {
          50: '#ecfff7',
          100: '#d6fff0',
          200: '#b6ffe3',
          300: '#8ef6d2',
          400: '#6fe8be',
          500: '#4fd4a6',
          600: '#3bb990',
          700: '#2f9878',
          800: '#287a63',
          900: '#215f50',
          950: '#133a31',
        },
        'pastel-green': '#A8E6CF',
        'pastel-mint': '#D0F4DE',
        // обновлённый glass фон под ликид-стиль
        'glass-bg': 'rgba(255,255,255,0.08)',
        glass: {
          light: 'rgba(255,255,255,0.7)',
          dark: 'rgba(17, 25, 40, 0.55)',
        },
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        glass: '0 10px 40px rgba(0,0,0,.20)',
        soft: '0 6px 24px rgba(0,0,0,.12)',
        focus: '0 0 0 2px rgba(255,255,255,.06), 0 0 0 6px rgba(79,212,166,.35)',
      },
      backdropBlur: { xs: '2px' },
      // см. общий блок keyframes ниже
      animation: {
        blob: 'blob 28s ease-in-out infinite',
        'blob-slow': 'blob 40s ease-in-out infinite',
        blob2: 'blob2 32s ease-in-out infinite',
        blob3: 'blob3 36s ease-in-out infinite',
        'spin-slow': 'spin 12s linear infinite',
        float: 'float 14s ease-in-out infinite',
        'fade-in': 'fade-in .9s ease-out both',
      },
      keyframes: {
        // плавающие и появление
        float: {
          '0%,100%': { transform: 'translateY(0) translateX(0) scale(1)' },
          '50%': { transform: 'translateY(-12px) translateX(6px) scale(1.02)' },
        },
        'fade-in': {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        // существующие блобы
        blob: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '25%': { transform: 'translate(20px, -10px) scale(1.05)' },
          '50%': { transform: 'translate(-10px, 12px) scale(0.98)' },
          '75%': { transform: 'translate(-22px, -16px) scale(1.02)' },
        },
        blob2: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '20%': { transform: 'translate(-16px, 10px) scale(1.03)' },
          '50%': { transform: 'translate(18px, -14px) scale(1.06)' },
          '80%': { transform: 'translate(-8px, 8px) scale(0.99)' },
        },
        blob3: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '30%': { transform: 'translate(14px, 16px) scale(1.04)' },
          '60%': { transform: 'translate(-18px, -10px) scale(1.01)' },
          '90%': { transform: 'translate(6px, -6px) scale(0.97)' },
        },
      },
      transitionDuration: {
        400: '400ms',
        600: '600ms',
      },
    },
  },
  plugins: [],
}

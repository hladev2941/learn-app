/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
        },
        indigo: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          950: '#1e1b4b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'Helvetica Neue', 'sans-serif'],
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.7), rgba(255,255,255,0.45))',
        'brand-gradient': 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      },
      backdropBlur: {
        xs: '4px',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(99, 102, 241, 0.1), 0 2px 8px rgba(0,0,0,0.04)',
        'glass-lg': '0 16px 48px rgba(99, 102, 241, 0.14), 0 4px 16px rgba(0,0,0,0.06)',
        brand: '0 4px 16px rgba(99, 102, 241, 0.35)',
        'brand-lg': '0 8px 24px rgba(99, 102, 241, 0.45)',
      }
    },
  },
  corePlugins: {
    preflight: false, // Disable CSS reset — Angular Material has its own normalization
  },
  plugins: [],
}


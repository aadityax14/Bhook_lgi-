/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          yellow: '#FFB800',
          yellowHover: '#E5A500',
          yellowLight: '#FFF8E7',
          yellowMuted: '#FEF08A',
          black: '#121212',
          darkCard: '#1E1E1E',
          cream: '#FAF8F2',
          creamDark: '#F3EFE6',
          chili: '#EF4444',
          mint: '#10B981',
          subtle: '#6B7280'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.06)',
        'yellow-glow': '0 6px 20px -4px rgba(255, 184, 0, 0.45)',
        'card-lift': '0 10px 25px -5px rgba(0, 0, 0, 0.08)'
      },
      keyframes: {
        steam: {
          '0%': { transform: 'translateY(0) scaleX(1)', opacity: '0.8' },
          '50%': { transform: 'translateY(-10px) scaleX(1.2)', opacity: '0.4' },
          '100%': { transform: 'translateY(-20px) scaleX(0.8)', opacity: '0' }
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(255, 184, 0, 0.4)' },
          '50%': { boxShadow: '0 0 25px rgba(255, 184, 0, 0.8)' }
        }
      },
      animation: {
        steam: 'steam 2s ease-out infinite',
        'pulse-glow': 'pulseGlow 2s infinite ease-in-out'
      }
    },
  },
  plugins: [],
}

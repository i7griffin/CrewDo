/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        neon: '#39ff14',
        'neon-dim': '#22cc0d',
        'bg-dark': '#0a0f0a',
        'bg-card': '#111811',
        'bg-card2': '#0d1a0d',
        'border-glow': '#1a3a1a',
      },
      fontFamily: {
        display: ['Rajdhani', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        neon: '0 0 20px rgba(57,255,20,0.3)',
        'neon-lg': '0 0 40px rgba(57,255,20,0.4)',
        'card': '0 4px 24px rgba(0,0,0,0.6)',
      },
      animation: {
        'pulse-neon': 'pulseNeon 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow-ring': 'glowRing 2s linear infinite',
      },
      keyframes: {
        pulseNeon: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(57,255,20,0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(57,255,20,0.7)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        glowRing: {
          '0%': { filter: 'hue-rotate(0deg)' },
          '100%': { filter: 'hue-rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}
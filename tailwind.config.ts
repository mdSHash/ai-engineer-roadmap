import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0a0a0b',
          900: '#101013',
          800: '#17171c',
          700: '#23232b',
          600: '#33333d',
          500: '#5a5a66',
          400: '#8a8a96',
          300: '#b8b8c2',
          200: '#dcdce0',
          100: '#ededf0',
          50:  '#f7f7f8',
        },
        lime: {
          accent: '#c6ff3d',
          dim:    '#a3d62f',
          glow:   '#e5ff8a',
        },
        amber: {
          accent: '#ffb13d',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif:   ['"Instrument Serif"', 'Georgia', 'serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        'display-xl': ['clamp(3rem, 8vw, 6rem)', { lineHeight: '1.0', letterSpacing: '-0.03em' }],
        'display-lg': ['clamp(2.25rem, 5vw, 4rem)', { lineHeight: '1.05', letterSpacing: '-0.025em' }],
        'display-md': ['clamp(1.75rem, 3.5vw, 2.5rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'grain': 'grain 8s steps(10) infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        grain: {
          '0%, 100%': { transform: 'translate(0,0)' },
          '10%':  { transform: 'translate(-5%,-10%)' },
          '20%':  { transform: 'translate(-15%,5%)' },
          '30%':  { transform: 'translate(7%,-25%)' },
          '40%':  { transform: 'translate(-5%,25%)' },
          '50%':  { transform: 'translate(-15%,10%)' },
          '60%':  { transform: 'translate(15%,0)' },
          '70%':  { transform: 'translate(0,15%)' },
          '80%':  { transform: 'translate(3%,35%)' },
          '90%':  { transform: 'translate(-10%,10%)' },
        },
      },
      backgroundImage: {
        'grid-faint': 'linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
}

export default config

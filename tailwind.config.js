/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0B0E14',
        surface: '#121824',
        line: '#1E2739',
        cyan: '#00F0FF',
        lime: '#00FF87',
        coral: '#FF2A6D',
        ink: '#E2E8F0',
        muted: '#94A3B8',
      },
      fontFamily: {
        sans: ['var(--font-kanit)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(0,240,255,.25), 0 0 24px -6px rgba(0,240,255,.35)',
        'glow-coral': '0 0 0 1px rgba(255,42,109,.3), 0 0 24px -6px rgba(255,42,109,.4)',
      },
      keyframes: {
        sweep: { to: { transform: 'rotate(360deg)' } },
        pulseRing: {
          '0%': { opacity: '.7', transform: 'scale(.6)' },
          '100%': { opacity: '0', transform: 'scale(1.6)' },
        },
        blink: { '50%': { opacity: '.25' } },
      },
      animation: {
        sweep: 'sweep 6s linear infinite',
        pulseRing: 'pulseRing 2.4s ease-out infinite',
        blink: 'blink 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

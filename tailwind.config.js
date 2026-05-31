/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', '14px'],
      },
      letterSpacing: {
        label: '0.06em',
      },
      borderWidth: {
        '0.5': '0.5px',
      },
      boxShadow: {
        card:  '0 1px 3px rgba(0,0,0,0.4)',
        modal: '0 8px 32px rgba(0,0,0,0.6)',
      },
      // Spacing only — colors are handled via CSS variables in index.css
    },
  },
  plugins: [],
}

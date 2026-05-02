/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'k-bg':       '#1e1e1e',
        'k-surface':  '#272727',
        'k-surface2': '#303030',
        'k-orange':   '#E86A1A',
        'k-yellow':   '#F5B800',
        'k-lila':     '#a292c5',
        'k-text':     '#f0f0f0',
        'k-muted':    '#888888',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card:    '8px',
        'card-lg': '12px',
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kisan: {
          primary: '#246B45',
          dark: '#174B32',
          secondary: '#6B9B63',
          light: '#E8F2E7',
          bg: '#F8FAF4',
          card: '#FFFFFF',
          text: '#26352A',
          muted: '#738074',
          accent: '#E8B75A',
          border: '#E4E9DF',
          danger: '#D9534F',
          success: '#2E7D32',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'mobile-phone': '0 25px 60px -15px rgba(0, 0, 0, 0.3), 0 0 0 12px #1f2937',
        'mobile-card': '0 2px 10px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}

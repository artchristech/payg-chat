/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Cormorant Garamond', 'Georgia', 'Times New Roman', 'serif'],
      },
    },
  },
  plugins: [],
};

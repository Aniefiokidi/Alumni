/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f3f1fd',
          100: '#e8e3f9',
          200: '#d5caf3',
          300: '#b8a5e8',
          400: '#9b83dd',
          500: '#7e61d2',
          600: '#6c4ecf',
          700: '#5a3dcc',
          800: '#4a31a5',
          900: '#3a2580',
        }
      }
    },
  },
  plugins: [],
}

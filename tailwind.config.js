/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./gas/**/*.html'],
  theme: {
    extend: {
      colors: {
        aviators: {
          ring: '#2b5da3',
          text: '#16181d',
          muted: '#5f6368',
          primary: '#2b5da3',
        },
      },
      zIndex: {
        dropdown: '50',
        sticky: '40',
        drawer: '50',
        backdrop: '40',
        modal: '100',
        blocking: '200',
        toast: '9999',
      },
    },
  },
  plugins: [],
};

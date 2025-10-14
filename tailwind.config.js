const { COLORS } = require('./constants/colors');
/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: { ...COLORS },
      fontFamily: {
        'geist-regular': ['Geist-Regular', 'sans-serif'],
        'geist-medium': ['Geist-Medium', 'sans-serif'],
        'geist-semibold': ['Geist-Semibold', 'sans-serif'],
        'geist-bold': ['Geist-Bold', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

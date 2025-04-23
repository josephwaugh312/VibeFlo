/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        // Add custom colors here if needed
      },
      fontFamily: {
        // Add custom fonts here if needed
      },
      spacing: {
        // Add custom spacing here if needed
      }
    },
  },
  plugins: [],
  // Ensure no classes are purged in production build
  safelist: [
    // Add specific classes that might be getting purged here
    'bg-gray-800', 
    'bg-gray-700',
    'text-white',
    'text-gray-300'
  ]
} 
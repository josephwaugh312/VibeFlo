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
    // Explicitly list important classes
    'container', 'mx-auto', 'card', 'btn', 'btn-primary', 'theme-background', 'theme-overlay',
    'animate-spin', 'hidden', 'block', 'flex', 'grid',
    
    // Use patterns to match all variants of utility classes
    { pattern: /^grid-cols-/ },
    { pattern: /^gap-/ },
    { pattern: /^space-[xy]-/ },
    { pattern: /^p[xytrbl]?-/ },
    { pattern: /^m[xytrbl]?-/ },
    { pattern: /^w-/ },
    { pattern: /^h-/ },
    { pattern: /^bg-/ },
    { pattern: /^text-/ },
    { pattern: /^border/ },
    { pattern: /^rounded/ },
    { pattern: /^shadow/ },
    { pattern: /^flex-/ },
    { pattern: /^justify-/ },
    { pattern: /^items-/ },
    { pattern: /^overflow/ },
    { pattern: /^z-/ },
    { pattern: /^opacity-/ },
    { pattern: /^transition/ },
    { pattern: /^duration-/ },
    { pattern: /^ease-/ },
    { pattern: /^relative/ },
    { pattern: /^absolute/ },
    { pattern: /^fixed/ },
    { pattern: /^static/ },
    { pattern: /^sticky/ },
    { pattern: /^top-/ },
    { pattern: /^left-/ },
    { pattern: /^right-/ },
    { pattern: /^bottom-/ },
    { pattern: /^cursor-/ },
    { pattern: /^object-/ },
    { pattern: /^font-/ },
    { pattern: /^outline-/ }
  ]
} 
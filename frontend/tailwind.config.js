/** @type {import('tailwindcss').Config} */
// Export the Tailwind settings
export default {
  // Tell Tailwind which files to look at for class names
  content: [
    // The main HTML file
    "./index.html",
    // All JS and JSX files inside src
    "./src/**/*.{js,jsx}",
  ],
  // Change how things look
  theme: {
    // Add to the defaults instead of replacing them
    extend: {
      // Our custom fonts
      fontFamily: {
        // The font for headings
        display: ['Syne', 'sans-serif'],
        // The normal text font
        sans:    ['Outfit', 'sans-serif'],
        // The font for code and small labels
        mono:    ['JetBrains Mono', 'monospace'],
      },
    },
  },
  // We don't use any extra Tailwind plugins
  plugins: [],
}

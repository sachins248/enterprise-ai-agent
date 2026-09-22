// Export the PostCSS settings (PostCSS changes our CSS during the build)
export default {
  // The tools PostCSS should run
  plugins: {
    // Turns Tailwind class names into real CSS
    tailwindcss: {},
    // Adds browser prefixes so the CSS works in more browsers
    autoprefixer: {},
  },
}

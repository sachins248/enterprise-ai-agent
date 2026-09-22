// The basic recommended JavaScript rules
import js from '@eslint/js'
// A list of names that exist in different places (like the browser)
import globals from 'globals'
// Rules that check React hooks are used correctly
import reactHooks from 'eslint-plugin-react-hooks'
// Rules that check components work with fast refresh
import reactRefresh from 'eslint-plugin-react-refresh'
// Helpers for writing the ESLint settings
import { defineConfig, globalIgnores } from 'eslint/config'

// Export the settings so ESLint can read them
export default defineConfig([
  // Never check the "dist" folder (it holds built files)
  globalIgnores(['dist']),
  {
    // Check all .js and .jsx files
    files: ['**/*.{js,jsx}'],
    // Start from these ready-made rule sets
    extends: [
      // The basic recommended rules
      js.configs.recommended,
      // The React hooks rules
      reactHooks.configs.flat.recommended,
      // The fast refresh rules for Vite
      reactRefresh.configs.vite,
    ],
    // Tell ESLint about the language we write
    languageOptions: {
      // The JavaScript version we use
      ecmaVersion: 2020,
      // Allow browser names like "window" and "document"
      globals: globals.browser,
      // More options for reading our code
      parserOptions: {
        // Allow the newest JavaScript features
        ecmaVersion: 'latest',
        // Allow JSX (the HTML-like code in React)
        ecmaFeatures: { jsx: true },
        // Our files use import and export
        sourceType: 'module',
      },
    },
    // Our own rule changes
    rules: {
      // Unused variables are errors, except names that start with a capital letter or underscore
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
])

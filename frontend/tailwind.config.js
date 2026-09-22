/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  // Dark theme is activated by [data-theme="dark"] on <html> (set by
  // ThemeContext), not by prefers-color-scheme or a Tailwind "dark:" class
  // toggle — every color token is a CSS variable that already resolves per
  // theme, so components rarely need a dark: variant at all.
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans:    ['Public Sans', 'sans-serif'],
        mono:    ['IBM Plex Mono', 'monospace'],
      },
      colors: {
        bg:            'var(--bg)',
        surface:       'var(--surface)',
        card:          'var(--card)',
        hairline:      'var(--border)',
        'hairline-hi': 'var(--border-hi)',
        ink:           'var(--text-1)',
        'ink-2':       'var(--text-2)',
        'ink-3':       'var(--text-3)',
        accent:        'var(--accent)',
        'accent-ink':  'var(--accent-ink)',
        error:         'var(--error)',
        success:       'var(--success)',
        'role-admin':  'var(--role-admin)',
      },
      // Clamped near-zero everywhere — no pill/rounded shapes in this system.
      // Even "lg" resolves to 2px so a stray class can't reintroduce rounding.
      borderRadius: {
        none: '0px',
        sm: '1px',
        DEFAULT: '2px',
        md: '2px',
        lg: '2px',
        xl: '2px',
      },
      letterSpacing: {
        micro: '0.10em',
        wide2: '0.14em',
      },
    },
  },
  plugins: [],
}

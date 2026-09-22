/**
 * Icon — a small hand-drawn line-icon set, all in one file.
 *
 * Every icon shares one viewBox (0 0 24 24) and one stroke treatment
 * (1.5px, square line caps/joins, no fill) so they're visually
 * interchangeable at any size. Square/miter joins (not round) match the
 * sharp-corner rule that runs through the rest of the design system —
 * this is deliberately not a rounded, friendly icon-library look.
 *
 * These replace every unicode glyph the app used to lean on for icons
 * (◈ ◉ ◆ ⌗ ✓ ↑ → and the literal "+"/"…" text).
 */

const PATHS = {
  chat: (
    <path d="M4 5h16v11H9l-4 4V5Z" />
  ),
  history: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </>
  ),
  dashboard: (
    <>
      <rect x="4" y="4" width="7" height="7" />
      <rect x="13" y="4" width="7" height="4" />
      <rect x="13" y="11" width="7" height="9" />
      <rect x="4" y="14" width="7" height="6" />
    </>
  ),
  'new-chat': (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  'sign-out': (
    <>
      <path d="M9 4H5v16h4" />
      <path d="M13 8l4 4-4 4" />
      <path d="M17 12H9" />
    </>
  ),
  'code-context': (
    <path d="M9 5 4 12l5 7M15 5l5 7-5 7" />
  ),
  clear: (
    <path d="M5 5l14 14M19 5 5 19" />
  ),
  chevron: (
    <path d="M6 9l6 6 6-6" />
  ),
  checkmark: (
    <path d="M4 12l5 5L20 6" />
  ),
  alert: (
    <>
      <path d="M12 3 2 20h20L12 3Z" />
      <path d="M12 10v5" />
      <path d="M12 17.5h.01" />
    </>
  ),
  spinner: (
    <path d="M12 3a9 9 0 1 1-6.36 2.64" />
  ),
  'avatar-fallback': (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </>
  ),
  moon: (
    <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
  ),
  'arrow-up': (
    <path d="M12 19V5M6 11l6-6 6 6" />
  ),
  'arrow-right': (
    <path d="M5 12h14M13 6l6 6-6 6" />
  ),
};

export default function Icon({ name, size = 20, className = '', ...rest }) {
  const path = PATHS[name];
  if (!path) return null;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {path}
    </svg>
  );
}

/**
 * Card — the base surface used for panels, stat tiles, and bubbles.
 * `padded` controls whether the default padding is applied (some callers,
 * like Panel, want to add their own).
 */
export default function Card({ padded = true, className = '', children, ...rest }) {
  return (
    <div
      className={`bg-card border border-hairline ${padded ? 'p-6' : ''} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

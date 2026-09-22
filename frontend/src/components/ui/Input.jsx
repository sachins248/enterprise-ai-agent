import FieldLabel from './FieldLabel';

/**
 * Input — a single-line text field: hairline border, sharp corners,
 * a crisp solid focus outline (no blurred glow ring).
 */
export default function Input({ label, className = '', ...rest }) {
  return (
    <div className={className}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <input
        className="w-full bg-card border border-hairline px-4 py-3 text-sm text-ink font-sans
          outline-none focus-visible:border-accent placeholder:text-ink-3"
        {...rest}
      />
    </div>
  );
}

/**
 * FieldLabel — the small uppercase mono label used above every form field.
 * Replaces the FieldLabel() local function duplicated in Login/Register.
 */
export default function FieldLabel({ children, className = '' }) {
  return (
    <label className={`block font-mono text-[11px] font-medium text-ink-2 tracking-micro uppercase mb-2 ${className}`}>
      {children}
    </label>
  );
}

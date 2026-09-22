import FieldLabel from './FieldLabel';

/**
 * Textarea — mirrors Input's focus/border treatment for multi-line fields
 * (used by Chat's code-context box).
 */
export default function Textarea({ label, className = '', ...rest }) {
  return (
    <div className={className}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <textarea
        className="w-full bg-card border border-hairline px-4 py-3 text-[12px] text-ink font-mono
          leading-relaxed outline-none focus-visible:border-accent placeholder:text-ink-3 resize-y"
        {...rest}
      />
    </div>
  );
}

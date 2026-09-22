/**
 * Divider — a "dimension line": a hairline rule with a small perpendicular
 * tick mark at each end, like a measurement line in a technical drawing.
 * Replaces plain <hr>/border-top section breaks.
 */
export default function Divider({ label, className = '' }) {
  return (
    <div className={`relative flex items-center gap-3 my-6 h-[7px] ${className}`}>
      {/* end ticks — perpendicular marks at each outer edge */}
      <span className="absolute left-0 top-0 w-px h-[7px] bg-hairline" />
      <span className="absolute right-0 top-0 w-px h-[7px] bg-hairline" />

      <span className="h-px flex-1 bg-hairline" />
      {label && (
        <span className="font-mono text-[10px] tracking-micro uppercase text-ink-3 shrink-0">{label}</span>
      )}
      <span className="h-px flex-1 bg-hairline" />
    </div>
  );
}

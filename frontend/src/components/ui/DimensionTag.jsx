/**
 * DimensionTag — a small mono "FIG. 01" / "§ 02" style index tag, used
 * near section headers for a technical-document feel. Use one per panel,
 * not one per row.
 */
export default function DimensionTag({ children, className = '' }) {
  return (
    <span className={`font-mono text-[10px] tracking-micro uppercase text-ink-3 ${className}`}>
      {children}
    </span>
  );
}

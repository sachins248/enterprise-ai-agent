/**
 * IndexedList — renders items with a mono "01 / 02 / 03…" prefix instead
 * of a bullet. Used for feature lists and role explainers.
 */
export default function IndexedList({ items, className = '' }) {
  return (
    <div className={`flex flex-col gap-3.5 ${className}`}>
      {items.map((item, i) => (
        <div key={i} className="flex items-baseline gap-3">
          <span className="font-mono text-[11px] text-accent shrink-0 tabular-nums">
            {String(i + 1).padStart(2, '0')}
          </span>
          <span className="text-[13px] text-ink-2">{item}</span>
        </div>
      ))}
    </div>
  );
}

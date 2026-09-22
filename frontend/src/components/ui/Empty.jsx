/**
 * Empty — a small centered mono message shown when a panel/list has no
 * data yet. Replaces the Empty() local function in Dashboard.jsx.
 */
export default function Empty({ label = 'NO DATA YET' }) {
  return (
    <p className="text-center font-mono text-[11px] tracking-micro uppercase text-ink-3 py-8">
      {label}
    </p>
  );
}

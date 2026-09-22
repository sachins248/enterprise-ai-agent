import Card from './Card';

const TONE_BAR = {
  'accent-ink': 'bg-accent-ink',
  accent:       'bg-accent',
  'role-admin': 'bg-role-admin',
  success:      'bg-success',
};

/**
 * StatTile — one of Dashboard's four summary cards: a flat 2px top accent
 * bar, a mono uppercase label, and the figure itself in mono (stats are
 * data, so they're set in the mono tier, not the display serif).
 */
export default function StatTile({ label, value, tone = 'accent' }) {
  return (
    <Card className="relative overflow-hidden">
      <span className={`absolute top-0 left-0 right-0 h-[2px] ${TONE_BAR[tone]}`} />
      <p className="font-mono text-[9px] tracking-wide2 uppercase text-ink-3 mb-2.5">{label}</p>
      <p className="font-mono text-[28px] font-medium text-ink leading-none">{value}</p>
    </Card>
  );
}

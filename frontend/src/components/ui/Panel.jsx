import Card from './Card';
import DimensionTag from './DimensionTag';

/**
 * Panel — a Card with a title row (and optional mono index tag),
 * replacing the Panel() local function duplicated in Dashboard.jsx.
 */
export default function Panel({ title, indexTag, className = '', children }) {
  return (
    <Card className={className}>
      <div className="flex items-baseline justify-between gap-3 mb-5">
        <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
        {indexTag && <DimensionTag>{indexTag}</DimensionTag>}
      </div>
      {children}
    </Card>
  );
}

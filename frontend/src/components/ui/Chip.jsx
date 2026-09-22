import Icon from './Icon';

/**
 * Chip — a small flat outlined toggle/action button, replacing the
 * Chip() local function duplicated in Chat.jsx.
 */
export default function Chip({ active = false, onClick, label, icon, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-[11px] font-sans
        transition-colors duration-150 whitespace-nowrap
        ${active
          ? 'border-accent text-accent'
          : 'border-hairline text-ink-2 hover:border-hairline-hi hover:text-ink'}
        ${className}`}
    >
      {icon && <Icon name={icon} size={12} />}
      {label}
    </button>
  );
}

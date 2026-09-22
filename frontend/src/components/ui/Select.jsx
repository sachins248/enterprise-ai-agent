import FieldLabel from './FieldLabel';
import Icon from './Icon';

/**
 * Select — a native <select> (kept native for accessibility/OS-level
 * behavior) with a custom chevron overlay, since a native arrow can't be
 * restyled reliably across browsers.
 */
export default function Select({ label, className = '', children, ...rest }) {
  return (
    <div className={className}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <div className="relative">
        <select
          className="w-full appearance-none bg-card border border-hairline px-4 py-3 pr-10 text-sm
            text-ink font-sans outline-none focus-visible:border-accent cursor-pointer"
          {...rest}
        >
          {children}
        </select>
        <Icon
          name="chevron"
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-3"
        />
      </div>
    </div>
  );
}

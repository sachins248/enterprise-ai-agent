import Icon from './Icon';

const KIND_STYLES = {
  ai:   'border-t-2 border-t-accent-ink text-accent-ink',
  user: 'border-t-2 border-t-accent text-ink-2',
};

/**
 * Avatar — a sharp square with a mono initial letter (or a fallback
 * icon), distinguished from its counterpart by a flat top-border accent
 * line instead of a gradient fill.
 */
export default function Avatar({ initial, kind = 'user', size = 28, className = '' }) {
  return (
    <div
      className={`flex items-center justify-center shrink-0 bg-surface border border-hairline
        font-mono font-medium ${KIND_STYLES[kind]} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initial ? initial.toUpperCase() : <Icon name="avatar-fallback" size={size * 0.55} />}
    </div>
  );
}

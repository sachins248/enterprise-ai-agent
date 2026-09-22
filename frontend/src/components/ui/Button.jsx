import Icon from './Icon';

const VARIANTS = {
  primary:   'bg-accent text-bg border border-accent hover:opacity-90',
  secondary: 'bg-surface text-ink border border-hairline hover:border-accent hover:text-accent',
  ghost:     'bg-transparent text-ink-2 border border-transparent hover:border-hairline hover:text-ink',
  danger:    'bg-transparent text-ink-2 border border-hairline hover:border-error hover:text-error',
};

const SIZES = {
  sm: 'text-[13px] px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2.5 gap-2',
};

/**
 * Button — the one button primitive used everywhere.
 * `variant`: primary | secondary | ghost | danger
 * `icon`: an icon name (rendered before the label) or a full <Icon/> element
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  className = '',
  children,
  ...rest
}) {
  const isDisabled = disabled || loading;
  const iconEl = loading
    ? <Icon name="spinner" size={size === 'sm' ? 14 : 16} className="spin" />
    : typeof icon === 'string' ? <Icon name={icon} size={size === 'sm' ? 14 : 16} /> : icon;

  return (
    <button
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center font-sans font-medium
        transition-colors duration-150
        disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:opacity-45
        ${!isDisabled ? 'cursor-pointer' : ''}
        ${VARIANTS[variant]} ${SIZES[size]} ${className}
      `}
      {...rest}
    >
      {iconEl}
      {children}
    </button>
  );
}

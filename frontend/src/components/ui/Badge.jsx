const TONES = {
  admin:   'text-role-admin border-role-admin',
  neutral: 'text-ink-3 border-hairline',
  success: 'text-success border-success',
  error:   'text-error border-error',
};

/**
 * Badge — a small flat outlined tag. No background wash, no glow —
 * just a hairline border in the tone color and matching text.
 */
export default function Badge({ tone = 'neutral', className = '', children }) {
  return (
    <span
      className={`inline-flex items-center font-mono text-[9px] tracking-micro uppercase
        border px-1.5 py-0.5 ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

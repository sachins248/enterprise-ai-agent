import Icon from './Icon';

const TONE = {
  error: 'border-error text-error',
  success: 'border-success text-success',
};

/**
 * Toast — a fixed-position bottom-right notice, generalized from
 * Sessions.jsx's inline error box.
 */
export default function Toast({ tone = 'error', message }) {
  if (!message) return null;

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-card border px-4 py-3
        text-[13px] ${TONE[tone]}`}
    >
      <Icon name="alert" size={15} />
      {message}
    </div>
  );
}

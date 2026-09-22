const ARM = 10; // length of each bracket arm, in px

function Mark({ corner }) {
  const pos = {
    tl: 'top-0 left-0',
    br: 'bottom-0 right-0',
  }[corner];

  // top-left mark: an L opening toward the bottom-right; bottom-right
  // mark: the same L rotated 180deg, opening toward the top-left.
  const rotate = corner === 'br' ? 'rotate-180' : '';

  return (
    <svg
      width={ARM}
      height={ARM}
      viewBox={`0 0 ${ARM} ${ARM}`}
      className={`absolute ${pos} ${rotate} text-hairline-hi`}
      aria-hidden="true"
    >
      <path d={`M0 ${ARM} V0 H${ARM}`} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/**
 * CornerFrame — wraps its children with two opposing L-shaped registration
 * marks (top-left / bottom-right), like crop marks on a technical drawing.
 * Used sparingly on one or two featured elements per page — not on every
 * card, or it stops reading as a deliberate accent.
 */
export default function CornerFrame({ children, className = '' }) {
  return (
    <div className={`relative p-3 ${className}`}>
      <Mark corner="tl" />
      <Mark corner="br" />
      {children}
    </div>
  );
}

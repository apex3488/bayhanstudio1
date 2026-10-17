/** Decorative arrow; "external" points up-right to signal leaving the site. */
export function ArrowIcon({ direction = 'right' }: { direction?: 'right' | 'external' }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      focusable="false"
      style={direction === 'external' ? { transform: 'rotate(-45deg)' } : undefined}
    >
      <path
        d="M2 8h11M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="square"
      />
    </svg>
  );
}

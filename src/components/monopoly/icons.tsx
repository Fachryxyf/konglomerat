// Shared custom SVG icons for the Monopoly board.

// Prison-bars icon for the Jail space (clearer than a padlock).
export function JailBarsIcon({ className, strokeWidth = 2 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" className={className}>
      <line x1="5" y1="3" x2="5" y2="21" />
      <line x1="12" y1="3" x2="12" y2="21" />
      <line x1="19" y1="3" x2="19" y2="21" />
      <line x1="3.5" y1="7" x2="20.5" y2="7" />
      <line x1="3.5" y1="17" x2="20.5" y2="17" />
    </svg>
  );
}

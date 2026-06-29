// Original brand glyph for KONGLOMERAT — an ascending city skyline (a property &
// economy empire), drawn in lucide's line style so it sits naturally beside the
// other icons. Uses `currentColor`, so it adopts the surrounding accent (yellow
// in the header, emerald on the setup screen, etc.) — keeping the existing
// aesthetic while replacing the generic dice mark.
export default function BrandMark({ className, strokeWidth = 2 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* ground line */}
      <line x1="2.5" y1="21" x2="21.5" y2="21" />
      {/* three ascending towers, sharing the baseline */}
      <path d="M4 21 V13 H8 V21" />
      <path d="M9.5 21 V6 H14.5 V21" />
      <path d="M16 21 V10 H20 V21" />
      {/* windows */}
      <line x1="11" y1="10" x2="13" y2="10" />
      <line x1="11" y1="13.5" x2="13" y2="13.5" />
      <line x1="17.1" y1="14" x2="18.9" y2="14" />
    </svg>
  );
}

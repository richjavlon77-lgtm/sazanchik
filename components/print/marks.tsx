/**
 * Общие «знаки» печатных материалов (меню, QR-карточки):
 * линия-рыба вместо логотипа и орнамент линия—ромб—линия.
 */

export function FishMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 96 48" fill="none" aria-hidden>
      <path
        d="M6 24 Q36 4 66 24 Q36 44 6 24 Z"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <path
        d="M66 24 Q80 14 90 8 Q86 18 86 24 Q86 30 90 40 Q80 34 66 24 Z"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <circle cx="20" cy="21" r="1.4" fill="currentColor" />
    </svg>
  );
}

export function Diamond() {
  return (
    <span className="orn" aria-hidden>
      <i />
      <b>◆</b>
      <i />
    </span>
  );
}

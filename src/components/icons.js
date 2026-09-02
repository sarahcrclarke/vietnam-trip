export function DragHandleIcon() {
  return (
    <span className="grid grid-cols-2 gap-x-[3px] gap-y-[3px]" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <span key={i} className="h-[3px] w-[3px] rounded-full bg-current" />
      ))}
    </span>
  );
}

export function CloseIcon({ className = "h-3 w-3" }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 12 12"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <line x1="2" y1="2" x2="10" y2="10" />
      <line x1="10" y1="2" x2="2" y2="10" />
    </svg>
  );
}

export function CameraIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
    >
      <path d="M3 8.5a1 1 0 0 1 1-1h2.2l1-1.6a1 1 0 0 1 .85-.4h7.9a1 1 0 0 1 .85.4l1 1.6H20a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
      <circle cx="12" cy="13" r="3.4" />
    </svg>
  );
}

export function CalendarIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
    >
      <rect x="1.5" y="2.5" width="13" height="12" rx="1" />
      <line x1="1.5" y1="6" x2="14.5" y2="6" />
      <line x1="4.5" y1="1" x2="4.5" y2="3.5" />
      <line x1="11.5" y1="1" x2="11.5" y2="3.5" />
    </svg>
  );
}

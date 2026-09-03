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

export function ClockIcon({ className = "h-3 w-3" }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="8" r="6.25" />
      <path d="M8 4.5V8l2.5 1.5" />
    </svg>
  );
}

export function ExternalLinkIcon({ className = "h-3 w-3" }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6.5 3H3.5A1.5 1.5 0 0 0 2 4.5v8A1.5 1.5 0 0 0 3.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-3" />
      <path d="M9.5 2H14v4.5M14 2 7.5 8.5" />
    </svg>
  );
}

export function ChevronLeftIcon({ className = "h-4 w-4" }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 3 5 8l5 5" />
    </svg>
  );
}

export function ChevronRightIcon({ className = "h-4 w-4" }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 3l5 5-5 5" />
    </svg>
  );
}

export function TransportIcon({ mode = "train" }) {
  const className = "h-6 w-6 sm:h-7 sm:w-7";

  if (mode.toLowerCase().includes("train")) {
    return (
      <svg aria-hidden viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M4 8v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M4 8h16M6 16h12M7 2h10v4H7z" />
        <circle cx="8" cy="18" r="1" />
        <circle cx="16" cy="18" r="1" />
      </svg>
    );
  } else if (mode.toLowerCase().includes("flight")) {
    return (
      <svg aria-hidden viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M3 9l9-7 9 7M12 2v15M2 12h4l6 8 6-8h4" />
      </svg>
    );
  } else if (mode.toLowerCase().includes("bus")) {
    return (
      <svg aria-hidden viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M3 8h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" />
        <path d="M7 8V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v3M6 16h1M17 16h1" />
        <circle cx="7.5" cy="18" r="1.5" />
        <circle cx="16.5" cy="18" r="1.5" />
      </svg>
    );
  } else if (mode.toLowerCase().includes("car")) {
    return (
      <svg aria-hidden viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M7 2h10a1 1 0 0 1 1 1v4h2l2 4v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-8l2-4h2V3a1 1 0 0 1 1-1z" />
        <circle cx="7" cy="17" r="1.5" />
        <circle cx="17" cy="17" r="1.5" />
      </svg>
    );
  } else if (mode.toLowerCase().includes("ferry") || mode.toLowerCase().includes("boat")) {
    return (
      <svg aria-hidden viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M2 18h20v2H2z" />
        <path d="M12 2v10M8 6l4-4 4 4M12 5v7l-4-2v8M12 12l4-2v8" />
      </svg>
    );
  }

  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M5 12h14M12 5v14" />
    </svg>
  );
}

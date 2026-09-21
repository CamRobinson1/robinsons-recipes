type P = { size?: number };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export function ChefHat({ size = 22 }: P) {
  return (
    <svg {...base(size)}>
      <path d="M6 19h12v-2H6v2Z" />
      <path d="M17 15a4 4 0 0 0 1.2-7.8 3.6 3.6 0 0 0-6.2-2.6 3.6 3.6 0 0 0-6.2 2.6A4 4 0 0 0 7 15Z" />
    </svg>
  );
}

export function Search({ size = 17 }: P) {
  return (
    <svg {...base(size)}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  );
}

export function Plus({ size = 17 }: P) {
  return (
    <svg {...base(size)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function Clock({ size = 14 }: P) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </svg>
  );
}

export function Bowl({ size = 14 }: P) {
  return (
    <svg {...base(size)}>
      <path d="M3.5 11h17a8.5 8.5 0 0 1-8.5 8 8.5 8.5 0 0 1-8.5-8Z" />
      <path d="M9 7.5c0-1.2 1.3-1.8 1.3-3M14 7.5c0-1.2 1.3-1.8 1.3-3" />
    </svg>
  );
}

export function Camera({ size = 14 }: P) {
  return (
    <svg {...base(size)}>
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13.5" r="3.4" />
    </svg>
  );
}

export function Flame({ size = 14 }: P) {
  return (
    <svg {...base(size)}>
      <path d="M12 3s5 4.2 5 9a5 5 0 0 1-10 0c0-2 1-3.4 1-3.4S9 11 10.5 11C10.5 8 12 6 12 3Z" />
    </svg>
  );
}

export function Repeat({ size = 13 }: P) {
  return (
    <svg {...base(size)}>
      <path d="M3 11V9a4 4 0 0 1 4-4h11" />
      <path d="m15 2 3 3-3 3" />
      <path d="M21 13v2a4 4 0 0 1-4 4H6" />
      <path d="m9 22-3-3 3-3" />
    </svg>
  );
}

export function Star({ size = 14, filled = false }: P & { filled?: boolean }) {
  return (
    <svg {...base(size)} fill={filled ? "currentColor" : "none"}>
      <path d="m12 3.6 2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L3.5 9.8l5.9-.9L12 3.6Z" />
    </svg>
  );
}

export function Dollar({ size = 14 }: P) {
  return (
    <svg {...base(size)}>
      <path d="M12 3v18" />
      <path d="M16.5 7.3C16 6 14.4 5.2 12.3 5.2c-2.4 0-4 1.2-4 3 0 4.4 8 2 8 6.4 0 1.9-1.8 3.2-4.3 3.2-2.3 0-4-.9-4.6-2.4" />
    </svg>
  );
}

export function Link({ size = 14 }: P) {
  return (
    <svg {...base(size)}>
      <path d="M10.5 13.5a4 4 0 0 0 5.7 0l2.6-2.6a4 4 0 0 0-5.7-5.7l-1.3 1.3" />
      <path d="M13.5 10.5a4 4 0 0 0-5.7 0l-2.6 2.6a4 4 0 0 0 5.7 5.7l1.3-1.3" />
    </svg>
  );
}

export function Trash({ size = 15 }: P) {
  return (
    <svg {...base(size)}>
      <path d="M4 6.5h16M9.5 6.5V4.8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1.7" />
      <path d="M6.5 6.5 7.4 19a1 1 0 0 0 1 .9h7.2a1 1 0 0 0 1-.9l.9-12.5" />
    </svg>
  );
}

export function Pencil({ size = 15 }: P) {
  return (
    <svg {...base(size)}>
      <path d="M16.5 3.9a2 2 0 0 1 2.8 2.8L8.4 17.6l-3.7 1 1-3.7L16.5 3.9Z" />
    </svg>
  );
}

export function X({ size = 14 }: P) {
  return (
    <svg {...base(size)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function ArrowLeft({ size = 15 }: P) {
  return (
    <svg {...base(size)}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}

export function Check({ size = 14 }: P) {
  return (
    <svg {...base(size)} strokeWidth={2.6}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}

export function Dice({ size = 17 }: P) {
  return (
    <svg {...base(size)}>
      <rect x="4" y="4" width="16" height="16" rx="3.5" />
      <circle cx="9" cy="9" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="15" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Cart({ size = 15 }: P) {
  return (
    <svg {...base(size)}>
      <path d="M3 4h2.2l2.3 10.4a1.5 1.5 0 0 0 1.5 1.2h7.6a1.5 1.5 0 0 0 1.5-1.2L20 7.5H6" />
      <circle cx="9.5" cy="19.5" r="1.3" />
      <circle cx="16.5" cy="19.5" r="1.3" />
    </svg>
  );
}

export function ChevronLeft({ size = 16 }: P) {
  return (
    <svg {...base(size)}>
      <path d="m14 6-6 6 6 6" />
    </svg>
  );
}

export function ChevronRight({ size = 16 }: P) {
  return (
    <svg {...base(size)}>
      <path d="m10 6 6 6-6 6" />
    </svg>
  );
}

export function Sliders({ size = 16 }: P) {
  return (
    <svg {...base(size)}>
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </svg>
  );
}

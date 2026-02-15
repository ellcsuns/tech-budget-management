export default function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-accent, #3B82F6)" />
          <stop offset="100%" stopColor="var(--color-primary, #1E40AF)" />
        </linearGradient>
      </defs>
      {/* Outer hexagon - tech feel */}
      <path d="M24 4L42 14V34L24 44L6 34V14L24 4Z" stroke="url(#logoGrad)" strokeWidth="2" fill="none" />
      {/* Inner chart bars */}
      <rect x="14" y="28" width="4" height="10" rx="1" stroke="url(#logoGrad)" strokeWidth="1.5" fill="none" />
      <rect x="22" y="22" width="4" height="16" rx="1" stroke="url(#logoGrad)" strokeWidth="1.5" fill="none" />
      <rect x="30" y="16" width="4" height="22" rx="1" stroke="url(#logoGrad)" strokeWidth="1.5" fill="none" />
      {/* Trend line */}
      <path d="M14 26L22 20L30 14" stroke="url(#logoGrad)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Dollar sign at top */}
      <path d="M24 8V10M22 10.5C22 10.5 22 9.5 24 9.5S26 10.5 26 10.5S26 12 24 12S22 13 22 13S22 14 24 14S26 13 26 13M24 14V16" 
        stroke="url(#logoGrad)" strokeWidth="1" strokeLinecap="round" fill="none" />
    </svg>
  );
}

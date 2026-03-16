export default function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>
      </defs>
      
      {/* Rounded square background with gradient */}
      <rect x="2" y="2" width="96" height="96" rx="20" fill="url(#bgGrad)" />
      
      {/* Letter "I" */}
      <rect x="20" y="30" width="8" height="40" rx="4" fill="white" />
      
      {/* Letter "Q" - outer circle */}
      <path d="M 50 30 
               A 20 20 0 1 1 50 70
               A 20 20 0 1 1 50 30
               M 50 38
               A 12 12 0 1 0 50 62
               A 12 12 0 1 0 50 38"
            fill="white" fillRule="evenodd" />
      
      {/* Q tail/handle */}
      <path d="M 62 62 L 72 72" 
            stroke="white" strokeWidth="8" strokeLinecap="round" />
      
      {/* Growth bars inside Q */}
      <rect x="44" y="52" width="4" height="8" rx="2" fill="#1e3a8a" />
      <rect x="50" y="48" width="4" height="12" rx="2" fill="#1e3a8a" />
      <rect x="56" y="42" width="4" height="18" rx="2" fill="#1e3a8a" />
    </svg>
  );
}

export default function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="bulbGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      
      {/* Background glow circle */}
      <circle cx="32" cy="32" r="28" fill="url(#glowGrad)" />
      
      {/* Light bulb body - representing intelligence */}
      <path d="M32 12C26 12 21 17 21 23C21 26 22 28 24 30L24 36C24 37.5 25.5 39 27 39L37 39C38.5 39 40 37.5 40 36L40 30C42 28 43 26 43 23C43 17 38 12 32 12Z" 
        fill="url(#bulbGrad)" stroke="url(#logoGrad)" strokeWidth="1.5" />
      
      {/* Bulb filament */}
      <path d="M32 16L32 24M28 20L36 20" 
        stroke="url(#logoGrad)" strokeWidth="2" strokeLinecap="round" />
      
      {/* Light rays - intelligence radiating */}
      <path d="M32 6L32 10M18 18L21 21M46 18L43 21M12 32L16 32M52 32L48 32" 
        stroke="url(#logoGrad)" strokeWidth="2.5" strokeLinecap="round" />
      
      {/* Bulb base */}
      <rect x="27" y="39" width="10" height="3" rx="1" fill="url(#logoGrad)" />
      <rect x="28" y="42" width="8" height="2" rx="1" fill="url(#logoGrad)" />
      
      {/* Growth arrow - investment growth */}
      <path d="M16 52L24 44L32 48L40 38L48 42" 
        stroke="url(#logoGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Arrow head */}
      <path d="M48 42L44 41L45 37" 
        stroke="url(#logoGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Dollar sign in bulb - investment */}
      <path d="M32 20L32 28M30 22C30 21 31 20 32 20C33 20 34 21 34 22C34 23 33 23.5 32 23.5C31 23.5 30 24 30 25C30 26 31 27 32 27C33 27 34 26 34 25" 
        stroke="#1E40AF" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

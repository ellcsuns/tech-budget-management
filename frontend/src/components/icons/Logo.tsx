export default function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      
      {/* Outer circle with glow */}
      <circle cx="24" cy="24" r="20" fill="url(#glowGrad)" />
      <circle cx="24" cy="24" r="18" stroke="url(#logoGrad)" strokeWidth="2" fill="none" />
      
      {/* Brain/Intelligence symbol - left hemisphere */}
      <path d="M16 20C16 20 14 22 14 24C14 26 16 28 16 28" 
        stroke="url(#logoGrad)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M18 18C18 18 16 20 16 22C16 24 18 26 18 26" 
        stroke="url(#logoGrad)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      
      {/* Brain/Intelligence symbol - right hemisphere */}
      <path d="M32 20C32 20 34 22 34 24C34 26 32 28 32 28" 
        stroke="url(#logoGrad)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M30 18C30 18 32 20 32 22C32 24 30 26 30 26" 
        stroke="url(#logoGrad)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      
      {/* Central growth arrow/chart */}
      <path d="M20 30L24 20L28 26L32 18" 
        stroke="url(#logoGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      
      {/* Arrow head */}
      <path d="M32 18L29 19L30 22" 
        stroke="url(#logoGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      
      {/* IQ spark/star at top */}
      <circle cx="24" cy="12" r="2" fill="url(#logoGrad)" />
      <path d="M24 10V14M22 12H26M22.5 10.5L25.5 13.5M25.5 10.5L22.5 13.5" 
        stroke="url(#logoGrad)" strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  );
}

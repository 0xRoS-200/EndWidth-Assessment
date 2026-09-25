/* Professional inline SVG Logo icon - reusable across components */
export function LogoIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="slg1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6B8AFF" />
          <stop offset="100%" stopColor="#3D5AFF" />
        </linearGradient>
        <linearGradient id="slg2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#6B5AFF" />
        </linearGradient>
      </defs>
      <polygon points="20,2 36,11 36,29 20,38 4,29 4,11" stroke="url(#slg1)" strokeWidth="1.5" fill="none" />
      <polygon points="20,8 30,14 30,26 20,32 10,26 10,14" stroke="url(#slg2)" strokeWidth="1" fill="rgba(61,90,255,0.08)" />
      <circle cx="20" cy="8"  r="1.8" fill="url(#slg1)" />
      <circle cx="30" cy="14" r="1.8" fill="url(#slg1)" />
      <circle cx="30" cy="26" r="1.8" fill="url(#slg1)" />
      <circle cx="20" cy="32" r="1.8" fill="url(#slg1)" />
      <circle cx="10" cy="26" r="1.8" fill="url(#slg1)" />
      <circle cx="10" cy="14" r="1.8" fill="url(#slg1)" />
      <circle cx="20" cy="20" r="2.5" fill="url(#slg2)" />
      <line x1="20" y1="8"  x2="20" y2="20" stroke="url(#slg1)" strokeWidth="0.8" opacity="0.6"/>
      <line x1="30" y1="14" x2="20" y2="20" stroke="url(#slg1)" strokeWidth="0.8" opacity="0.6"/>
      <line x1="30" y1="26" x2="20" y2="20" stroke="url(#slg1)" strokeWidth="0.8" opacity="0.6"/>
      <line x1="20" y1="32" x2="20" y2="20" stroke="url(#slg1)" strokeWidth="0.8" opacity="0.6"/>
      <line x1="10" y1="26" x2="20" y2="20" stroke="url(#slg1)" strokeWidth="0.8" opacity="0.6"/>
      <line x1="10" y1="14" x2="20" y2="20" stroke="url(#slg1)" strokeWidth="0.8" opacity="0.6"/>
    </svg>
  );
}

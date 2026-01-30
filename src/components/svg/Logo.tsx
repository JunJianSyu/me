import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: number;
}

/**
 * Creative geometric logo design
 * Represents creativity and modern design with overlapping shapes
 */
export function Logo({ className, size = 40 }: LogoProps) {
  return (
    <svg
      className={cn('logo', className)}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Creative Blog Logo"
    >
      {/* Background circle with gradient */}
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>

      {/* Main geometric shape - tilted square */}
      <rect
        x="20"
        y="20"
        width="45"
        height="45"
        rx="8"
        fill="url(#logoGradient)"
        transform="rotate(15, 42.5, 42.5)"
      />

      {/* Overlapping circle */}
      <circle
        cx="60"
        cy="55"
        r="28"
        fill="url(#accentGradient)"
        opacity="0.9"
      />

      {/* Accent dot */}
      <circle cx="75" cy="30" r="8" fill="#f8fafc" opacity="0.9" />

      {/* Letter "C" stylized */}
      <path
        d="M45 45 Q35 45 35 55 Q35 65 45 65"
        stroke="#f8fafc"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export default Logo;

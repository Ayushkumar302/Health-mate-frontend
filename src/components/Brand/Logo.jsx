import { useId } from "react";
import { Link } from "react-router-dom";
import { BRAND } from "@/brand";

// heart with a pulse line, drawn in SVG so it stays sharp and themeable
export const LogoMark = ({ className = "h-9 w-9" }) => {
  const id = useId();
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5596cc" />
          <stop offset="0.55" stopColor="#3d7fb8" />
          <stop offset="1" stopColor="#2c6595" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill={`url(#${id})`} />
      <path
        d="M24 35.5s-11-6.6-11-14.2A6.3 6.3 0 0 1 24 17.6a6.3 6.3 0 0 1 11 3.7c0 7.6-11 14.2-11 14.2z"
        fill="#fff"
        opacity="0.95"
      />
      <path
        d="M15.5 25h5l2-3.5 3 7 2-3.5h5"
        fill="none"
        stroke="#4fae94"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const Logo = ({ className = "" }) => (
  <Link to="/" className={`group inline-flex items-center gap-2.5 ${className}`} aria-label={`${BRAND.name} home`}>
    <LogoMark className="h-9 w-9 transition-transform duration-500 group-hover:rotate-[8deg] group-hover:scale-105" />
    <span className="text-xl font-extrabold tracking-tight text-foreground">
      {BRAND.name}
      <span className="text-primary">.</span>
    </span>
  </Link>
);

export default Logo;

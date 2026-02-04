import React from "react";

interface ShieldIconProps {
  className?: string;
}

export default function ShieldIcon({ className }: ShieldIconProps) {
  return (
    <svg
      viewBox="0 0 120 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <filter id="shieldGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d="M60 10 L110 35 L110 75 C110 100 90 120 60 130 C30 120 10 100 10 75 L10 35 Z"
        stroke="#00ff41"
        strokeWidth="3"
        fill="none"
        filter="url(#shieldGlow)"
      />
      <path
        d="M60 25 L98 45 L98 72 C98 92 82 108 60 116 C38 108 22 92 22 72 L22 45 Z"
        stroke="#00ff41"
        strokeWidth="1.5"
        fill="rgba(0, 255, 65, 0.05)"
      />
      <path
        d="M50 70 L57 77 L73 61"
        stroke="#00ff41"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter="url(#shieldGlow)"
      />
    </svg>
  );
}

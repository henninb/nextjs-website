import React from "react";

interface LockIconProps {
  className?: string;
}

export default function LockIcon({ className }: LockIconProps) {
  return (
    <svg
      viewBox="0 0 60 70"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <filter id="lockGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d="M15 30 L15 20 C15 11 22 4 30 4 C38 4 45 11 45 20 L45 30"
        stroke="#00ff41"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        filter="url(#lockGlow)"
      />
      <rect
        x="8"
        y="30"
        width="44"
        height="34"
        rx="4"
        stroke="#00ff41"
        strokeWidth="2.5"
        fill="rgba(0, 255, 65, 0.05)"
      />
      <circle
        cx="30"
        cy="45"
        r="5"
        stroke="#00ff41"
        strokeWidth="2"
        fill="none"
      />
      <line
        x1="30"
        y1="50"
        x2="30"
        y2="56"
        stroke="#00ff41"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

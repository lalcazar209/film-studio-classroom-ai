"use client";

import { motion } from "framer-motion";

export function ProgressRing({
  value,
  max,
  color,
  size = 64,
  trackColor = "#242430",
}: {
  value: number;
  max: number;
  color: string;
  size?: number;
  trackColor?: string;
}) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const center = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={center} cy={center} r={radius} fill="none" stroke={trackColor} strokeWidth="6" />
      <motion.circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: circumference * (1 - pct) }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        transform={`rotate(-90 ${center} ${center})`}
      />
    </svg>
  );
}

"use client";

import Image from "next/image";
import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";

interface BeforeAfterRevealProps {
  before: string;
  after: string;
  alt: string;
  caption?: string;
  priority?: boolean;
}

// How many percentage points the divider leans horizontally between its
// top and bottom endpoints — this is what makes the line diagonal.
const SKEW = 14;

export function BeforeAfterReveal({
  before,
  after,
  alt,
  caption,
  priority = false,
}: BeforeAfterRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.85", "end 0.15"],
  });

  // The divider's horizontal position (in %) at its vertical midpoint.
  // Sweeps from fully off the right (all "before") to fully off the left
  // (all "after") as the panel scrolls through the viewport.
  const reveal = useTransform(scrollYProgress, (p) =>
    prefersReducedMotion ? 50 : 100 + SKEW - p * (100 + 2 * SKEW),
  );

  const clipPath = useTransform(
    reveal,
    (r) => `polygon(${r + SKEW}% 0%, 100% 0%, 100% 100%, ${r - SKEW}% 100%)`,
  );
  const lineX1 = useTransform(reveal, (r) => r + SKEW);
  const lineX2 = useTransform(reveal, (r) => r - SKEW);

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        role="img"
        aria-label={`Before and after comparison: ${alt}`}
        className="relative aspect-[4/3] md:aspect-[16/9] max-h-[520px] w-full select-none overflow-hidden rounded-2xl shadow-[0_24px_60px_-16px_rgba(19,26,19,0.5)]"
      >
        <Image
          src={before}
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, 1100px"
          className="object-cover"
        />
        <motion.div className="absolute inset-0" style={{ clipPath }}>
          <Image
            src={after}
            alt={alt}
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, 1100px"
            className="object-cover"
          />
        </motion.div>

        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden
        >
          <motion.line
            x1={lineX1}
            x2={lineX2}
            y1={0}
            y2={100}
            stroke="white"
            strokeOpacity={0.9}
            strokeWidth={0.6}
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <span className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
          Before
        </span>
        <span className="pointer-events-none absolute bottom-4 right-4 rounded-full bg-water/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
          After
        </span>
      </div>
      {caption && (
        <p className="mt-3 text-center text-sm text-mud">{caption}</p>
      )}
    </div>
  );
}

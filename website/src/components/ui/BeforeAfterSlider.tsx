"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

interface BeforeAfterSliderProps {
  before: string;
  after: string;
  alt: string;
  caption?: string;
  priority?: boolean;
}

// How many percentage points the divider leans horizontally between its
// top and bottom endpoints — this is what makes the line diagonal.
const SKEW = 14;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function BeforeAfterSlider({
  before,
  after,
  alt,
  caption,
  priority = false,
}: BeforeAfterSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [reveal, setReveal] = useState(50);
  const draggingRef = useRef(false);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    setReveal(clamp(Math.round(ratio * 100), 0, 100));
  }, []);

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromClientX(e.clientX);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    updateFromClientX(e.clientX);
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      setReveal((r) => clamp(r - 5, 0, 100));
      e.preventDefault();
    } else if (e.key === "ArrowRight") {
      setReveal((r) => clamp(r + 5, 0, 100));
      e.preventDefault();
    } else if (e.key === "Home") {
      setReveal(0);
      e.preventDefault();
    } else if (e.key === "End") {
      setReveal(100);
      e.preventDefault();
    }
  };

  const clipPath = `polygon(${reveal + SKEW}% 0%, 100% 0%, 100% 100%, ${reveal - SKEW}% 100%)`;

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        role="slider"
        tabIndex={0}
        aria-label={`Drag to compare before and after: ${alt}`}
        aria-valuenow={reveal}
        aria-valuemin={0}
        aria-valuemax={100}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        className="relative aspect-[4/3] md:aspect-[16/9] max-h-[520px] w-full touch-none select-none overflow-hidden rounded-2xl shadow-[0_24px_60px_-16px_rgba(19,26,19,0.5)] outline-none ring-water/60 focus-visible:ring-4"
      >
        <Image
          src={before}
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, 1100px"
          className="pointer-events-none object-cover"
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ clipPath }}
        >
          <Image
            src={after}
            alt={alt}
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, 1100px"
            className="object-cover"
          />
        </div>

        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden
        >
          <line
            x1={reveal + SKEW}
            x2={reveal - SKEW}
            y1={0}
            y2={100}
            stroke="white"
            strokeOpacity={0.9}
            strokeWidth={0.6}
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <div
          className="pointer-events-none absolute flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md"
          style={{ left: `${reveal}%`, top: "50%" }}
        >
          <span className="text-xs font-bold text-charcoal">↔</span>
        </div>

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

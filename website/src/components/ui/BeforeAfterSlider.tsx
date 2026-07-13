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
  const [pos, setPos] = useState(50);
  const draggingRef = useRef(false);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    setPos(clamp(Math.round(ratio * 100), 0, 100));
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
      setPos((p) => clamp(p - 5, 0, 100));
      e.preventDefault();
    } else if (e.key === "ArrowRight") {
      setPos((p) => clamp(p + 5, 0, 100));
      e.preventDefault();
    } else if (e.key === "Home") {
      setPos(0);
      e.preventDefault();
    } else if (e.key === "End") {
      setPos(100);
      e.preventDefault();
    }
  };

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        role="slider"
        tabIndex={0}
        aria-label={`Drag to compare before and after: ${alt}`}
        aria-valuenow={pos}
        aria-valuemin={0}
        aria-valuemax={100}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        className="relative aspect-[4/3] md:aspect-[16/9] max-h-[520px] w-full touch-none select-none overflow-hidden rounded-2xl shadow-xl outline-none ring-water/60 focus-visible:ring-4"
      >
        <Image
          src={after}
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, 1100px"
          className="pointer-events-none object-cover"
        />
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        >
          <Image
            src={before}
            alt={alt}
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, 1100px"
            className="object-cover"
          />
        </div>

        <div
          className="pointer-events-none absolute inset-y-0 flex w-0.5 -translate-x-1/2 items-center bg-white/90"
          style={{ left: `${pos}%` }}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md">
            <span className="text-xs font-bold text-charcoal">↔</span>
          </div>
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

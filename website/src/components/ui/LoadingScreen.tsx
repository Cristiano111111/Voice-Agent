"use client";

import { useEffect, useState } from "react";

const DASHES = 12;
const RING = 104; // determinate arc radius
const CIRC = 2 * Math.PI * RING;

export function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    let raf = 0;
    let current = 0;
    let loaded = document.readyState === "complete";
    const onLoad = () => {
      loaded = true;
    };
    if (!loaded) window.addEventListener("load", onLoad, { once: true });

    const start = performance.now();

    const tick = (ts: number) => {
      const elapsed = ts - start;
      const cap = loaded ? 100 : 90;
      // Ease toward the cap with a small constant nudge so it always creeps up.
      current = Math.min(cap, current + (cap - current) * 0.06 + 0.4);
      setProgress(Math.round(current));

      if (loaded && current >= 99.5 && elapsed > 700) {
        setProgress(100);
        setHidden(true);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // Failsafe: never trap the user behind the loader.
    const failsafe = window.setTimeout(() => setHidden(true), 8000);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("load", onLoad);
      window.clearTimeout(failsafe);
    };
  }, []);

  if (removed) return null;

  return (
    <div
      aria-hidden
      onTransitionEnd={() => {
        if (hidden) setRemoved(true);
      }}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-charcoal transition-opacity duration-500 ${
        hidden ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      {/* Ambient blue glow behind the ring */}
      <div className="pointer-events-none absolute h-72 w-72 rounded-full bg-water/20 blur-3xl" />

      <div className="relative h-[220px] w-[220px]">
        {/* Determinate progress arc */}
        <svg
          viewBox="0 0 220 220"
          className="absolute inset-0 h-full w-full -rotate-90"
        >
          <circle
            cx={110}
            cy={110}
            r={RING}
            fill="none"
            stroke="rgba(245,244,240,0.10)"
            strokeWidth={3}
          />
          <circle
            cx={110}
            cy={110}
            r={RING}
            fill="none"
            stroke="#1B62E8"
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - progress / 100)}
            style={{ transition: "stroke-dashoffset 0.2s linear" }}
          />
        </svg>

        {/* Rotating spray dashes */}
        <div className="absolute inset-0 [animation-duration:1.3s] motion-safe:animate-spin">
          {Array.from({ length: DASHES }).map((_, i) => {
            const angle = (i / DASHES) * 360;
            const opacity = 0.12 + (i / (DASHES - 1)) * 0.88;
            return (
              <span
                key={i}
                className="absolute left-1/2 top-1/2 h-5 w-[6px] rounded-full bg-water"
                style={{
                  transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-86px)`,
                  opacity,
                }}
              />
            );
          })}
        </div>

        {/* Live percentage */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-5xl font-extrabold tabular-nums text-stone">
            {progress}
            <span className="text-2xl text-water">%</span>
          </span>
        </div>
      </div>

      <p className="mt-8 font-display text-sm font-bold uppercase tracking-[0.3em] text-mud">
        Rabbit Pressure Washing
      </p>
    </div>
  );
}

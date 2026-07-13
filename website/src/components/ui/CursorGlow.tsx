"use client";

import { useEffect, useRef } from "react";

// A soft water-blue glow that trails the cursor. Desktop / fine-pointer
// only — never mounts its listeners on touch devices, and snaps instead
// of easing when the user prefers reduced motion.
export function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    if (!finePointer) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const el = glowRef.current;
    if (!el) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let x = targetX;
    let y = targetY;
    let visible = false;
    let rafId = 0;

    const onMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!visible) {
        visible = true;
        el.style.opacity = "1";
      }
    };

    const onLeave = () => {
      visible = false;
      el.style.opacity = "0";
    };

    const render = () => {
      // Ease toward the cursor for a subtle trailing feel.
      const ease = reduce ? 1 : 0.15;
      x += (targetX - x) * ease;
      y += (targetY - y) * ease;
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      rafId = requestAnimationFrame(render);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    rafId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-30 hidden h-[320px] w-[320px] rounded-full opacity-0 mix-blend-screen transition-opacity duration-500 md:block"
      style={{
        background:
          "radial-gradient(circle, rgba(27,98,232,0.26) 0%, rgba(27,98,232,0.11) 38%, transparent 66%)",
      }}
    />
  );
}

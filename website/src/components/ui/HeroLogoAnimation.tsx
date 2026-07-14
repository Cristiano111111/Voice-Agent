"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Logo } from "@/components/ui/Logo";

const FRAME_COUNT = 54;
const FPS = 20;

const framePath = (i: number) =>
  `/logo-anim/frame-${String(i).padStart(3, "0")}.webp`;

interface HeroLogoAnimationProps {
  className?: string;
}

// Plays the rabbit-spraying-the-badge sequence on a loop. Frames are
// preloaded once, then drawn to a canvas at a fixed rate (independent of
// display refresh rate) so it stays smooth without re-triggering React
// renders every frame.
export function HeroLogoAnimation({ className }: HeroLogoAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const reduceMotion = useReducedMotion();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (reduceMotion) return;
    let cancelled = false;
    let loaded = 0;
    const images: HTMLImageElement[] = [];

    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      img.src = framePath(i);
      img.onload = () => {
        loaded++;
        if (loaded === FRAME_COUNT && !cancelled) {
          imagesRef.current = images;
          setReady(true);
        }
      };
      images.push(img);
    }

    return () => {
      cancelled = true;
    };
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion || !ready) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = canvas.clientWidth;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    let rafId = 0;
    let last = 0;
    let frame = 0;
    const interval = 1000 / FPS;

    const tick = (t: number) => {
      if (t - last >= interval) {
        last = t;
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(imagesRef.current[frame], 0, 0, size, size);
        frame = (frame + 1) % FRAME_COUNT;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    const onVisibility = () => {
      cancelAnimationFrame(rafId);
      if (!document.hidden) rafId = requestAnimationFrame(tick);
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [ready, reduceMotion]);

  // Reduced motion, or still preloading: show the static brand mark.
  if (reduceMotion || !ready) {
    return <Logo variant="full" priority className={className} />;
  }

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="Rabbit Pressure Washing"
      className={className}
      style={{ width: "100%", height: "auto", aspectRatio: "1 / 1" }}
    />
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Logo } from "@/components/ui/Logo";

const FRAME_COUNT = 54;
// How many pixels of scroll it takes to play through the whole sequence.
const SCRUB_DISTANCE = 700;

const framePath = (i: number) =>
  `/logo-anim/frame-${String(i).padStart(3, "0")}.webp`;

interface HeroLogoAnimationProps {
  className?: string;
}

// The rabbit-spraying-the-badge sequence, scrubbed directly by scroll
// position: scrolling down plays it forward, scrolling up reverses it,
// and it holds still at whatever frame matches the current scroll depth.
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

    let rafPending = false;
    const draw = () => {
      rafPending = false;
      const progress = Math.min(1, Math.max(0, window.scrollY / SCRUB_DISTANCE));
      const frame = Math.round(progress * (FRAME_COUNT - 1));
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(imagesRef.current[frame], 0, 0, size, size);
    };
    draw();

    const onScroll = () => {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(draw);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
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

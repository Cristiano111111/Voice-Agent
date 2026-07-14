"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
import {
  CalendarCheck,
  ClipboardList,
  Sparkles,
  SprayCan,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { processSteps, type ProcessStep } from "@/data/process-steps";

const stepIcons: LucideIcon[] = [
  ClipboardList,
  CalendarCheck,
  SprayCan,
  Sparkles,
];

const TOTAL = processSteps.length;
const MUTED = "rgba(19,26,19,0.1)";
const LIT = "rgba(27,98,232,0.55)";

// Connecting rail: flat across each card, with a short dip at every
// internal seam (25/50/75%) — the four originally-separate dividers
// read as one continuous wire once the blue overlay draws over it.
const RAIL_PATH = (() => {
  const seams = [100, 200, 300];
  let d = "M0,5";
  for (const x of seams) {
    d += ` L${x - 9},5 Q${x},5 ${x},19 Q${x},5 ${x + 9},5`;
  }
  d += " L400,5";
  return d;
})();

export function Process() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 0.8", "end 0.35"],
  });

  const glowLeft = useTransform(scrollYProgress, (p) => `${p * 100}%`);
  const glowOpacity = useTransform(
    scrollYProgress,
    [0, 0.03, 0.97, 1],
    [0, 1, 1, 0],
  );

  return (
    <section id="process" className="bg-stone py-24 md:py-32">
      <Container>
        <RevealOnScroll>
          <SectionHeading
            eyebrow="Why Rabbit"
            title="Four steps to a spotless property"
          />
        </RevealOnScroll>

        <div ref={sectionRef} className="relative mt-14">
          {/* Connecting rail spanning all 4 cards — desktop only; the
              4-column math doesn't apply once cards stack on mobile */}
          <svg
            aria-hidden
            viewBox="0 0 400 24"
            preserveAspectRatio="none"
            className="absolute inset-x-0 -top-1 hidden h-6 w-full overflow-visible md:block"
          >
            {/* Dim static track */}
            <path
              d={RAIL_PATH}
              fill="none"
              stroke="rgba(19,26,19,0.12)"
              strokeWidth={2}
              strokeLinecap="round"
            />
            {/* Blue glow trail, drawn in as you scroll (or fully drawn if reduced motion) */}
            <motion.path
              d={RAIL_PATH}
              fill="none"
              stroke="#1B62E8"
              strokeWidth={2.5}
              strokeLinecap="round"
              style={{ pathLength: reduceMotion ? 1 : scrollYProgress }}
              filter="drop-shadow(0 0 4px rgba(27,98,232,0.65))"
            />
          </svg>

          {/* Soft glow blob that travels with the rail */}
          {!reduceMotion && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute top-0 hidden h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-water/40 blur-2xl md:block"
              style={{ left: glowLeft, opacity: glowOpacity }}
            />
          )}

          <div className="grid gap-8 md:grid-cols-4">
            {processSteps.map((step, i) => (
              <RevealOnScroll key={step.number} delay={i * 0.08}>
                <StepCard
                  step={step}
                  Icon={stepIcons[i]}
                  threshold={(i + 1) / TOTAL}
                  progress={scrollYProgress}
                  reduceMotion={!!reduceMotion}
                />
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

function StepCard({
  step,
  Icon,
  threshold,
  progress,
  reduceMotion,
}: {
  step: ProcessStep;
  Icon: LucideIcon;
  threshold: number;
  progress: MotionValue<number>;
  reduceMotion: boolean;
}) {
  const litColor = useTransform(
    progress,
    [Math.max(0, threshold - 0.1), threshold],
    [MUTED, LIT],
  );

  return (
    <div className="border-t-2 border-water/30 pt-6 md:border-t-0">
      <div className="flex items-baseline gap-3">
        <motion.span
          style={{ color: reduceMotion ? LIT : litColor }}
          className="font-display text-5xl font-extrabold"
        >
          {step.number}
        </motion.span>
        <Icon size={22} className="text-water" />
      </div>
      <h3 className="mt-4 font-display text-xl font-bold uppercase tracking-tight text-charcoal">
        {step.title}
      </h3>
      <p className="mt-2 text-sm text-charcoal/70">{step.description}</p>
    </div>
  );
}

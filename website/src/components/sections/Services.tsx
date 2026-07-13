"use client";

import Image from "next/image";
import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
import { Droplets, Home, Square, Fence, type LucideIcon } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { services, type ServiceItem } from "@/data/services";

const iconMap: Record<ServiceItem["icon"], LucideIcon> = {
  driveway: Droplets,
  house: Home,
  concrete: Square,
  fence: Fence,
};

interface ServicesProps {
  showHeading?: boolean;
}

export function Services({ showHeading = true }: ServicesProps) {
  const reduce = useReducedMotion();

  return (
    <section id="services" className="bg-charcoal text-stone">
      {/* Mobile / reduced-motion: simple stacked layout */}
      <div className={reduce ? "block" : "block md:hidden"}>
        <ServicesStatic showHeading={showHeading} />
      </div>

      {/* Desktop: immersive pinned, scroll-driven stage */}
      {!reduce && (
        <div className="hidden md:block">
          <ServicesImmersive showHeading={showHeading} />
        </div>
      )}
    </section>
  );
}

/* ─── Static fallback (mobile + reduced motion) ───────────────────── */

function ServicesStatic({ showHeading }: { showHeading: boolean }) {
  return (
    <Container className="py-24 md:py-32">
      <div className="mx-auto mb-12 w-40 sm:w-48">
        <Image
          src="/wand.webp"
          alt="Pressure washer wand"
          width={800}
          height={1200}
          unoptimized
          className="h-auto w-full"
        />
      </div>

      {showHeading && (
        <RevealOnScroll>
          <SectionHeading
            eyebrow="What We Do"
            title="Services built for Montgomery County homes"
            dark
          />
        </RevealOnScroll>
      )}

      <div className={`border-t border-white/10 ${showHeading ? "mt-14" : ""}`}>
        {services.map((service, i) => {
          const Icon = iconMap[service.icon];
          return (
            <RevealOnScroll key={service.title} delay={i * 0.06}>
              <div className="grid grid-cols-1 gap-3 border-b border-white/10 py-8 sm:grid-cols-[80px_1fr]">
                <span className="font-display text-4xl font-extrabold text-white/15">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="flex items-center gap-3 font-display text-2xl font-bold uppercase tracking-tight">
                    <Icon size={22} className="text-water" />
                    {service.title}
                  </h3>
                  <p className="mt-2 text-mud">{service.description}</p>
                </div>
              </div>
            </RevealOnScroll>
          );
        })}
      </div>
    </Container>
  );
}

/* ─── Immersive pinned stage (desktop) ────────────────────────────── */

function ServicesImmersive({ showHeading }: { showHeading: boolean }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Wand parallax — sweeps the nozzle down toward each service as you scroll.
  const rotate = useTransform(scrollYProgress, [0, 1], [5, 19]);
  const wandY = useTransform(scrollYProgress, [0, 1], [0, -28]);
  const wandScale = useTransform(scrollYProgress, [0, 1], [1, 1.05]);

  const n = services.length;

  return (
    <div ref={sectionRef} className="relative h-[360vh]">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <Container className="grid w-full grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] items-center gap-8 lg:gap-16">
          {/* Left: pinned wand with parallax + spray mist */}
          <div className="relative flex h-screen items-center justify-center">
            <motion.div
              style={{
                rotate,
                y: wandY,
                scale: wandScale,
                transformOrigin: "42% 12%",
              }}
              className="relative h-[80vh]"
            >
              <Image
                src="/wand.webp"
                alt="Pressure washer wand"
                width={800}
                height={1200}
                priority
                unoptimized
                className="h-full w-auto object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)]"
              />
            </motion.div>
          </div>

          {/* Right: heading + scroll-swapped service panels */}
          <div className="relative">
            {showHeading && (
              <div className="mb-10">
                <span className="text-sm font-semibold uppercase tracking-widest text-ember">
                  What We Do
                </span>
                <h2 className="mt-3 max-w-xl text-balance font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-tight text-stone lg:text-5xl">
                  Services built for Montgomery County homes
                </h2>
              </div>
            )}

            <div className="relative flex gap-6">
              {/* Scroll progress rail */}
              <div className="relative w-px shrink-0 self-stretch bg-white/10">
                <motion.div
                  className="absolute left-0 top-0 w-px bg-water"
                  style={{
                    height: "100%",
                    scaleY: scrollYProgress,
                    transformOrigin: "top",
                  }}
                />
              </div>

              {/* Panels (stacked, cross-faded by scroll) */}
              <div className="relative h-[340px] flex-1">
                {services.map((service, i) => (
                  <ServicePanel
                    key={service.title}
                    index={i}
                    total={n}
                    progress={scrollYProgress}
                    service={service}
                  />
                ))}
              </div>
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
}

function ServicePanel({
  index,
  total,
  progress,
  service,
}: {
  index: number;
  total: number;
  progress: MotionValue<number>;
  service: ServiceItem;
}) {
  const seg = 1 / total;
  const center = (index + 0.5) * seg;
  const half = seg * 0.62;

  let p0 = center - half;
  let p1 = center - half * 0.28;
  let p2 = center + half * 0.28;
  let p3 = center + half;
  if (index === 0) {
    p0 = -0.5;
    p1 = -0.25;
  }
  if (index === total - 1) {
    p2 = 1.25;
    p3 = 1.5;
  }

  const input = [p0, p1, p2, p3];
  const opacity = useTransform(progress, input, [0, 1, 1, 0]);
  const y = useTransform(progress, input, [70, 0, 0, -70]);

  const Icon = iconMap[service.icon];

  return (
    <motion.div
      style={{ opacity, y }}
      className="absolute inset-0 flex flex-col justify-center"
    >
      <span className="font-display text-7xl font-extrabold leading-none text-white/10 lg:text-8xl">
        {String(index + 1).padStart(2, "0")}
      </span>
      <h3 className="mt-4 flex items-center gap-3 font-display text-3xl font-bold uppercase tracking-tight lg:text-4xl">
        <Icon size={28} className="text-water" />
        {service.title}
      </h3>
      <p className="mt-4 max-w-md text-lg text-mud">{service.description}</p>
    </motion.div>
  );
}

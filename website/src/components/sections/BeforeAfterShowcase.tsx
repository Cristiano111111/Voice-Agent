"use client";

import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { BeforeAfterSlider } from "@/components/ui/BeforeAfterSlider";
import { beforeAfterPairs } from "@/data/before-after-pairs";

export function BeforeAfterShowcase() {
  const [activeId, setActiveId] = useState(beforeAfterPairs[0]?.id);
  const active =
    beforeAfterPairs.find((p) => p.id === activeId) ?? beforeAfterPairs[0];

  if (!active) return null;

  return (
    <section id="results" className="bg-stone py-24 md:py-32">
      <Container>
        <RevealOnScroll>
          <SectionHeading
            eyebrow="The Rabbit Difference"
            title="See it before you believe it"
            description="Drag the slider to see what a single visit does. No filters, no staging — just before and after."
          />
        </RevealOnScroll>

        <RevealOnScroll delay={0.1} className="mt-12">
          <BeforeAfterSlider
            before={active.before}
            after={active.after}
            alt={active.alt}
            caption={active.caption}
            priority
          />
        </RevealOnScroll>

        {beforeAfterPairs.length > 1 && (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {beforeAfterPairs.map((pair) => (
              <button
                key={pair.id}
                type="button"
                onClick={() => setActiveId(pair.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  pair.id === active.id
                    ? "bg-charcoal text-stone"
                    : "bg-black/5 text-charcoal/70 hover:bg-black/10"
                }`}
              >
                {pair.caption ?? `Pair ${pair.id}`}
              </button>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}

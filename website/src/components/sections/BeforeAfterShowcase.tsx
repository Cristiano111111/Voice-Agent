"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { BeforeAfterReveal } from "@/components/ui/BeforeAfterReveal";
import { beforeAfterPairs } from "@/data/before-after-pairs";

interface BeforeAfterShowcaseProps {
  variant?: "teaser" | "full";
  showHeading?: boolean;
}

export function BeforeAfterShowcase({
  variant = "full",
  showHeading = true,
}: BeforeAfterShowcaseProps) {
  const [activeId, setActiveId] = useState(beforeAfterPairs[0]?.id);
  const active =
    beforeAfterPairs.find((p) => p.id === activeId) ?? beforeAfterPairs[0];

  if (!active) return null;

  const showTabs = variant === "full" && beforeAfterPairs.length > 1;

  return (
    <section id="results" className="bg-stone py-24 md:py-32">
      <Container>
        {showHeading && (
          <RevealOnScroll>
            <SectionHeading
              eyebrow="The Rabbit Difference"
              title="See it before you believe it"
              description="Scroll to see what a single visit does. No filters, no staging — just before and after."
            />
          </RevealOnScroll>
        )}

        <RevealOnScroll delay={0.1} className={showHeading ? "mt-12" : ""}>
          <BeforeAfterReveal
            before={active.before}
            after={active.after}
            alt={active.alt}
            caption={active.caption}
            priority
          />
        </RevealOnScroll>

        {showTabs && (
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

        {variant === "teaser" && (
          <div className="mt-8 text-center">
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 text-base font-semibold text-charcoal transition-colors hover:text-water"
            >
              See more transformations
              <ArrowRight size={18} />
            </Link>
          </div>
        )}
      </Container>
    </section>
  );
}

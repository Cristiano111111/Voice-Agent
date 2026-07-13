import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { testimonials } from "@/data/testimonials";

interface TestimonialsProps {
  showHeading?: boolean;
}

export function Testimonials({ showHeading = true }: TestimonialsProps) {
  return (
    <section className="bg-stone py-24 md:py-32">
      <Container>
        {showHeading && (
          <RevealOnScroll>
            <SectionHeading
              eyebrow="Customer Reviews"
              title="What neighbors are saying"
            />
          </RevealOnScroll>
        )}

        <div
          className={`max-w-3xl border-t border-charcoal/10 ${showHeading ? "mt-14" : ""}`}
        >
          {testimonials.map((t, i) => (
            <RevealOnScroll key={t.name + i} delay={i * 0.06}>
              <div className="flex flex-col gap-4 border-b border-charcoal/10 py-10 md:flex-row md:gap-10">
                <span
                  aria-hidden
                  className="font-display text-6xl leading-none text-ember/30 md:text-7xl"
                >
                  &ldquo;
                </span>
                <div>
                  <p className="font-body text-xl italic leading-snug text-charcoal md:text-2xl">
                    {t.quote}
                  </p>
                  <div className="mt-5 flex items-baseline gap-3">
                    <span className="text-sm font-semibold uppercase tracking-wide text-charcoal">
                      {t.name}
                    </span>
                    <span className="text-sm text-charcoal/50">
                      {t.location}
                    </span>
                    <span className="text-sm font-semibold uppercase tracking-wide text-ember">
                      5.0
                    </span>
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>

        <p className="mt-8 text-sm uppercase tracking-widest text-charcoal/40">
          Placeholder reviews — real customer testimonials coming soon
        </p>
      </Container>
    </section>
  );
}

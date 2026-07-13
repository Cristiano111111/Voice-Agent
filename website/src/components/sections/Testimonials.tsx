import { Quote, Star } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { testimonials } from "@/data/testimonials";

export function Testimonials() {
  return (
    <section className="bg-stone py-24 md:py-32">
      <Container>
        <RevealOnScroll>
          <SectionHeading
            eyebrow="Customer Reviews"
            title="What neighbors are saying"
            align="center"
          />
        </RevealOnScroll>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <RevealOnScroll key={t.name + i} delay={i * 0.08}>
              <div className="relative h-full rounded-2xl bg-white p-7 shadow-sm">
                <Quote className="text-water/30" size={28} />
                <p className="mt-4 text-charcoal/80">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-charcoal">{t.name}</p>
                    <p className="text-sm text-charcoal/50">{t.location}</p>
                  </div>
                  <div className="flex gap-0.5 text-ember">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} size={14} fill="currentColor" />
                    ))}
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>

        <p className="mt-8 text-center text-xs uppercase tracking-widest text-charcoal/40">
          Placeholder reviews — real customer testimonials coming soon
        </p>
      </Container>
    </section>
  );
}

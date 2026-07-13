import { MapPin } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { business } from "@/data/business";

export function ServiceArea() {
  return (
    <section id="area" className="bg-charcoal py-24 text-stone md:py-32">
      <Container className="grid gap-12 md:grid-cols-2 md:items-start">
        <RevealOnScroll>
          <SectionHeading
            eyebrow="Where We Work"
            title="Proudly serving Montgomery County, MD"
            description={business.bookingInfo}
            dark
          />
        </RevealOnScroll>

        <RevealOnScroll delay={0.1}>
          <div className="border-t border-white/10 pt-6">
            <div className="flex items-center gap-2 text-water">
              <MapPin size={20} />
              <span className="text-sm font-semibold uppercase tracking-widest">
                Service Area
              </span>
            </div>
            <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 text-base">
              {business.serviceArea.map((town) => (
                <li key={town} className="text-stone/90">
                  {town}
                </li>
              ))}
            </ul>
            <p className="mt-8 text-sm text-mud">
              Don&apos;t see your town listed? Reach out anyway — we cover
              most of Montgomery County.
            </p>
          </div>
        </RevealOnScroll>
      </Container>
    </section>
  );
}

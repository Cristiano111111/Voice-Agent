import {
  Droplets,
  Home,
  Sparkles,
  Square,
  Fence,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { services, type ServiceItem } from "@/data/services";

const iconMap: Record<ServiceItem["icon"], LucideIcon> = {
  driveway: Droplets,
  house: Home,
  deck: Sparkles,
  concrete: Square,
  fence: Fence,
  roof: Waves,
};

export function Services() {
  return (
    <section id="services" className="bg-charcoal py-24 text-stone md:py-32">
      <Container>
        <RevealOnScroll>
          <SectionHeading
            eyebrow="What We Do"
            title="Services built for Montgomery County homes"
            dark
          />
        </RevealOnScroll>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => {
            const Icon = iconMap[service.icon];
            return (
              <RevealOnScroll key={service.title} delay={i * 0.06}>
                <div className="h-full rounded-2xl border border-white/10 bg-white/5 p-7 transition-colors hover:border-water/40">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-water/15 text-water">
                    <Icon size={24} />
                  </div>
                  <h3 className="mt-5 font-display text-xl font-bold uppercase tracking-tight">
                    {service.title}
                  </h3>
                  <p className="mt-2 text-sm text-mud">
                    {service.description}
                  </p>
                </div>
              </RevealOnScroll>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

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
  return (
    <section id="services" className="bg-charcoal py-24 text-stone md:py-32">
      <Container>
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
                <div className="grid grid-cols-1 gap-3 border-b border-white/10 py-8 md:grid-cols-[100px_1fr_2fr] md:items-baseline md:gap-8">
                  <span className="font-display text-4xl font-extrabold text-white/15 md:text-5xl">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="flex items-center gap-3 font-display text-2xl font-bold uppercase tracking-tight">
                    <Icon size={22} className="text-water" />
                    {service.title}
                  </h3>
                  <p className="text-mud md:text-right">
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

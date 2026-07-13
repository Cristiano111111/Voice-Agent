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
import { processSteps } from "@/data/process-steps";

const stepIcons: LucideIcon[] = [
  ClipboardList,
  CalendarCheck,
  SprayCan,
  Sparkles,
];

export function Process() {
  return (
    <section id="process" className="bg-stone py-24 md:py-32">
      <Container>
        <RevealOnScroll>
          <SectionHeading
            eyebrow="Why Rabbit"
            title="Four steps to a spotless property"
          />
        </RevealOnScroll>

        <div className="mt-14 grid gap-8 md:grid-cols-4">
          {processSteps.map((step, i) => {
            const Icon = stepIcons[i];
            return (
              <RevealOnScroll key={step.number} delay={i * 0.08}>
                <div className="relative">
                  <span className="font-display text-6xl font-extrabold text-charcoal/10">
                    {step.number}
                  </span>
                  <div className="-mt-8 flex h-12 w-12 items-center justify-center rounded-xl bg-water text-white">
                    <Icon size={22} />
                  </div>
                  <h3 className="mt-4 font-display text-xl font-bold uppercase tracking-tight text-charcoal">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-charcoal/70">
                    {step.description}
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

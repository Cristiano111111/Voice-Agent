import Link from "next/link";
import { Hero } from "@/components/sections/Hero";
import { BeforeAfterShowcase } from "@/components/sections/BeforeAfterShowcase";
import { Services } from "@/components/sections/Services";
import { Container } from "@/components/ui/Container";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

export default function Home() {
  return (
    <main>
      <Hero />
      <BeforeAfterShowcase variant="teaser" />
      <Services />

      <section className="bg-stone py-24 md:py-32">
        <Container className="text-center">
          <RevealOnScroll>
            <h2 className="text-balance font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-tight text-charcoal md:text-5xl">
              Ready for a clean that lasts?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-charcoal/70">
              Free flat-rate quotes, no hourly surprises. Tell us what needs
              cleaning and we&apos;ll take it from there.
            </p>
            <Link
              href="/contact"
              className="mt-8 inline-block rounded-full bg-ember px-8 py-4 text-base font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              Get a Free Quote
            </Link>
          </RevealOnScroll>
        </Container>
      </section>
    </main>
  );
}

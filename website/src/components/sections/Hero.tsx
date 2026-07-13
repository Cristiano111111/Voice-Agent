import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Phone } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { ScrollLink } from "@/components/ui/ScrollLink";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { business } from "@/data/business";

export function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-[92vh] items-center overflow-hidden bg-charcoal text-stone"
    >
      <div className="absolute inset-0">
        <Image
          src="/images/after-1.jpg"
          alt="Freshly pressure washed driveway"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/80 to-charcoal/40" />
      </div>

      <Container className="relative z-10 py-32">
        <RevealOnScroll y={16}>
          <div className="mb-8 w-56 md:w-72">
            <Logo variant="full" priority />
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={0.1}>
          <h1 className="max-w-3xl text-balance font-display text-5xl font-extrabold uppercase leading-[0.92] tracking-tight md:text-7xl">
            Fast. Clean.
            <br />
            <span className="text-water">Thorough.</span>
          </h1>
        </RevealOnScroll>

        <RevealOnScroll delay={0.2}>
          <p className="mt-6 max-w-xl text-lg text-mud md:text-xl">
            Pressure washing for driveways, siding, decks, and more —
            serving Clarksburg, Rockville, and the rest of Montgomery
            County, MD.
          </p>
        </RevealOnScroll>

        <RevealOnScroll delay={0.3}>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/contact"
              className="rounded-full bg-ember px-8 py-4 text-base font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              Get a Free Quote
            </Link>
            <a
              href={business.phoneHref}
              className="flex items-center gap-2 rounded-full border border-stone/30 px-6 py-4 text-base font-semibold text-stone transition-colors hover:border-water hover:text-water"
            >
              <Phone size={18} />
              {business.phone}
            </a>
          </div>
        </RevealOnScroll>
      </Container>

      <ScrollLink
        href="#results"
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-stone/70 transition-colors hover:text-water"
      >
        <ChevronDown size={32} className="animate-bounce" />
      </ScrollLink>
    </section>
  );
}

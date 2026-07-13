import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { Process } from "@/components/sections/Process";
import { Container } from "@/components/ui/Container";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

export const metadata: Metadata = {
  title: "About | Rabbit Pressure Washing",
  description:
    "How Rabbit Pressure Washing works — a straightforward, no-surprises process from quote to reveal across Montgomery County, MD.",
};

export default function AboutPage() {
  return (
    <main>
      <PageHero
        eyebrow="About Rabbit"
        title="Fast, clean, thorough"
        description="A straightforward, no-surprises process from quote to reveal."
      />
      <Process />

      <section className="bg-charcoal py-20 text-stone md:py-24">
        <Container className="text-center">
          <RevealOnScroll>
            <h2 className="text-balance font-display text-3xl font-extrabold uppercase tracking-tight lg:text-4xl">
              Serving Rockville, Clarksburg, and nearby
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-mud">
              Centered on Rockville and Clarksburg, plus the surrounding
              Montgomery County communities — see the full map and check if
              your home is in our zone.
            </p>
            <Link
              href="/service-area"
              className="mt-8 inline-block rounded-full bg-ember px-8 py-4 text-base font-bold text-white transition-transform hover:scale-105 active:scale-95"
            >
              View Service Area
            </Link>
          </RevealOnScroll>
        </Container>
      </section>
    </main>
  );
}

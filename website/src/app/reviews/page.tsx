import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { Testimonials } from "@/components/sections/Testimonials";

export const metadata: Metadata = {
  title: "Reviews | Rabbit Pressure Washing",
  description:
    "What neighbors in Rockville, Clarksburg, and Montgomery County, MD are saying about Rabbit Pressure Washing.",
};

export default function ReviewsPage() {
  return (
    <main>
      <PageHero
        eyebrow="Customer Reviews"
        title="What neighbors are saying"
      />
      <Testimonials showHeading={false} />
    </main>
  );
}

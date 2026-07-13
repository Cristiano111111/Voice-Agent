import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { BeforeAfterShowcase } from "@/components/sections/BeforeAfterShowcase";

export const metadata: Metadata = {
  title: "Before & After Gallery | Rabbit Pressure Washing",
  description:
    "Real before-and-after results from pressure washing jobs across Rockville, Clarksburg, and Montgomery County, MD.",
};

export default function GalleryPage() {
  return (
    <main>
      <PageHero
        eyebrow="Real Results"
        title="Before & after"
        description="Drag to see what a single visit does. No filters, no staging — just before and after."
      />
      <BeforeAfterShowcase variant="full" showHeading={false} />
    </main>
  );
}

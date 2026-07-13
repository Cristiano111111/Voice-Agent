import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { Services } from "@/components/sections/Services";

export const metadata: Metadata = {
  title: "Services | Rabbit Pressure Washing",
  description:
    "Driveway cleaning, house washing, concrete flatwork, and fence washing across Rockville, Clarksburg, and Montgomery County, MD.",
};

export default function ServicesPage() {
  return (
    <main>
      <PageHero
        eyebrow="What We Do"
        title="Services"
        description="Flat-rate pressure washing for the surfaces that take the most abuse — driveways, siding, concrete, and fencing."
      />
      <Services showHeading={false} />
    </main>
  );
}

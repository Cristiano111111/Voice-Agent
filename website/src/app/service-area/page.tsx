import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { ServiceAreaMap } from "@/components/sections/ServiceAreaMap";

export const metadata: Metadata = {
  title: "Service Area | Rabbit Pressure Washing",
  description:
    "See the Montgomery County, MD communities Rabbit Pressure Washing serves — Rockville, Clarksburg, Gaithersburg, and more. Check if your home is in our zone.",
};

export default function ServiceAreaPage() {
  return (
    <main>
      <PageHero
        eyebrow="Where We Work"
        title="Service area"
        description="We cover Clarksburg, Rockville, and most of Montgomery County, MD. Check the map or enter your address below."
      />
      <ServiceAreaMap />
    </main>
  );
}

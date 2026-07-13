import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { Process } from "@/components/sections/Process";
import { ServiceArea } from "@/components/sections/ServiceArea";

export const metadata: Metadata = {
  title: "About | Rabbit Pressure Washing",
  description:
    "How Rabbit Pressure Washing works, and the Montgomery County, MD communities we serve.",
};

export default function AboutPage() {
  return (
    <main>
      <PageHero
        eyebrow="About Rabbit"
        title="Fast, clean, thorough"
        description="A straightforward process and a service area built around Montgomery County, MD."
      />
      <Process />
      <ServiceArea />
    </main>
  );
}

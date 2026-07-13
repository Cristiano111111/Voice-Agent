import { Hero } from "@/components/sections/Hero";
import { BeforeAfterShowcase } from "@/components/sections/BeforeAfterShowcase";
import { Services } from "@/components/sections/Services";
import { Process } from "@/components/sections/Process";
import { ServiceArea } from "@/components/sections/ServiceArea";
import { Testimonials } from "@/components/sections/Testimonials";
import { ContactForm } from "@/components/sections/ContactForm";

export default function Home() {
  return (
    <main>
      <Hero />
      <BeforeAfterShowcase />
      <Services />
      <Process />
      <ServiceArea />
      <Testimonials />
      <ContactForm />
    </main>
  );
}

import type { Metadata } from "next";
import { ContactForm } from "@/components/sections/ContactForm";

export const metadata: Metadata = {
  title: "Contact | Rabbit Pressure Washing",
  description:
    "Get a free flat-rate quote for pressure washing in Rockville, Clarksburg, and Montgomery County, MD.",
};

export default function ContactPage() {
  return (
    <main>
      <ContactForm />
    </main>
  );
}

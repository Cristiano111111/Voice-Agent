import { Mail, Phone } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Container } from "@/components/ui/Container";
import { FacebookIcon, InstagramIcon } from "@/components/ui/SocialIcons";
import { business } from "@/data/business";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-charcoal text-stone">
      <Container className="grid gap-10 py-16 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <Logo variant="icon" className="h-12 w-auto" />
            <span className="font-display text-lg font-extrabold uppercase tracking-tight">
              Rabbit Pressure Washing
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm text-mud">
            Fast, clean, thorough pressure washing for driveways, siding,
            decks, and more across Montgomery County, MD.
          </p>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-widest text-emberLight">
            Get in touch
          </h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <Phone size={16} className="text-water" />
              <a href={business.phoneHref}>{business.phone}</a>
            </li>
            <li className="flex items-center gap-2">
              <Mail size={16} className="text-water" />
              <a href={`mailto:${business.email}`}>{business.email}</a>
            </li>
          </ul>
          <div className="mt-5 flex items-center gap-4">
            <a
              href="#"
              aria-label="Facebook"
              className="text-mud transition-colors hover:text-water"
            >
              <FacebookIcon size={20} />
            </a>
            <a
              href="#"
              aria-label="Instagram"
              className="text-mud transition-colors hover:text-water"
            >
              <InstagramIcon size={20} />
            </a>
          </div>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-widest text-emberLight">
            Service area
          </h3>
          <p className="mt-4 text-sm text-mud">
            {business.serviceArea.join(", ")}
          </p>
        </div>
      </Container>

      <div className="border-t border-white/10 py-6">
        <Container className="flex flex-col items-center justify-between gap-2 text-xs text-mud md:flex-row">
          <span>
            &copy; {year} {business.name}. All rights reserved.
          </span>
          <span>{business.website}</span>
        </Container>
      </div>
    </footer>
  );
}

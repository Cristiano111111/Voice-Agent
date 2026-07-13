"use client";

import { useState } from "react";
import { Menu, Phone, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Container } from "@/components/ui/Container";
import { business } from "@/data/business";
import { useLenis } from "@/components/providers/SmoothScrollProvider";

const links = [
  { href: "#results", label: "Before & After" },
  { href: "#services", label: "Services" },
  { href: "#process", label: "Process" },
  { href: "#area", label: "Service Area" },
  { href: "#contact", label: "Contact" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const { scrollTo } = useLenis();

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    e.preventDefault();
    setOpen(false);
    scrollTo(href);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-stone/90 backdrop-blur">
      <Container className="flex h-20 items-center justify-between">
        <a
          href="#top"
          onClick={(e) => handleNavClick(e, "#top")}
          className="flex items-center gap-3"
          aria-label="Rabbit Pressure Washing home"
        >
          <Logo variant="icon" priority className="h-12 w-auto md:h-14" />
          <span className="font-display text-lg font-extrabold uppercase tracking-tight text-charcoal md:text-xl">
            Rabbit Pressure Washing
          </span>
        </a>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="text-sm font-semibold text-charcoal/80 transition-colors hover:text-water"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          <a
            href={business.phoneHref}
            className="flex items-center gap-2 text-sm font-semibold text-charcoal"
          >
            <Phone size={16} className="text-water" />
            {business.phone}
          </a>
          <a
            href="#contact"
            onClick={(e) => handleNavClick(e, "#contact")}
            className="rounded-full bg-ember px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-transform hover:scale-105"
          >
            Get a Free Quote
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-charcoal lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </Container>

      {open && (
        <div className="border-t border-black/5 bg-stone lg:hidden">
          <Container className="flex flex-col gap-5 py-6">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="text-base font-semibold text-charcoal"
              >
                {link.label}
              </a>
            ))}
            <a
              href={business.phoneHref}
              className="flex items-center gap-2 text-base font-semibold text-charcoal"
            >
              <Phone size={18} className="text-water" />
              {business.phone}
            </a>
            <a
              href="#contact"
              onClick={(e) => handleNavClick(e, "#contact")}
              className="rounded-full bg-ember px-5 py-3 text-center text-base font-bold text-white"
            >
              Get a Free Quote
            </a>
          </Container>
        </div>
      )}
    </header>
  );
}

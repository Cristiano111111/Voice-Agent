"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Phone, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Container } from "@/components/ui/Container";
import { business } from "@/data/business";

const links = [
  { href: "/gallery", label: "Gallery" },
  { href: "/services", label: "Services" },
  { href: "/service-area", label: "Service Area" },
  { href: "/about", label: "About" },
  { href: "/reviews", label: "Reviews" },
  { href: "/contact", label: "Contact" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-stone/90 backdrop-blur">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-6 md:px-10">
        <Link
          href="/"
          className="flex items-center gap-3"
          aria-label="Rabbit Pressure Washing home"
        >
          <Logo variant="icon" priority className="h-12 w-auto md:h-14" />
          <span className="hidden font-display text-lg font-extrabold uppercase tracking-tight text-charcoal xl:inline">
            Rabbit Pressure Washing
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap text-sm font-semibold transition-colors hover:text-water ${
                  active ? "text-water" : "text-charcoal/80"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          <a
            href={business.phoneHref}
            className="flex items-center gap-2 text-sm font-semibold text-charcoal"
          >
            <Phone size={16} className="text-water" />
            {business.phone}
          </a>
          <Link
            href="/contact"
            className="rounded-full bg-ember px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
          >
            Get a Free Quote
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-water lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-black/5 bg-stone lg:hidden">
          <Container className="flex flex-col gap-5 py-6">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`text-base font-semibold ${
                    active ? "text-water" : "text-charcoal"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <a
              href={business.phoneHref}
              className="flex items-center gap-2 text-base font-semibold text-charcoal"
            >
              <Phone size={18} className="text-water" />
              {business.phone}
            </a>
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="rounded-full bg-ember px-5 py-3 text-center text-base font-bold text-white"
            >
              Get a Free Quote
            </Link>
          </Container>
        </div>
      )}
    </header>
  );
}

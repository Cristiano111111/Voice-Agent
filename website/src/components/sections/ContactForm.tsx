"use client";

import { useState, type FormEvent } from "react";
import { Mail, MessageSquare, Phone, Send, User } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { business } from "@/data/business";
import { services } from "@/data/services";
import type { ContactResponseBody } from "@/types/contact";

type Status = "idle" | "submitting" | "success" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body: ContactResponseBody = await res.json();

      if (!res.ok || !body.success) {
        throw new Error(body.error ?? "Something went wrong.");
      }

      setStatus("success");
      form.reset();
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    }
  };

  return (
    <section id="contact" className="bg-charcoal py-24 text-stone md:py-32">
      <Container className="grid gap-12 md:grid-cols-2">
        <RevealOnScroll>
          <SectionHeading
            eyebrow="Get a Free Quote"
            title="Ready for a clean that lasts?"
            description={business.pricingInfo}
            dark
          />
          <div className="mt-8 space-y-3 text-sm text-mud">
            <p className="flex items-center gap-2">
              <Phone size={16} className="text-water" />
              {business.phone}
            </p>
            <p className="flex items-center gap-2">
              <Mail size={16} className="text-water" />
              {business.email}
            </p>
            <p>{business.hours}</p>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={0.1}>
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-7"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="relative">
                <User
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mud"
                />
                <input
                  required
                  name="name"
                  placeholder="Full name"
                  className="w-full rounded-lg border border-white/10 bg-charcoal py-3 pl-11 pr-4 text-sm text-stone placeholder:text-mud focus:border-water focus:outline-none"
                />
              </div>
              <div className="relative">
                <Phone
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mud"
                />
                <input
                  name="phone"
                  placeholder="Phone"
                  className="w-full rounded-lg border border-white/10 bg-charcoal py-3 pl-11 pr-4 text-sm text-stone placeholder:text-mud focus:border-water focus:outline-none"
                />
              </div>
            </div>

            <div className="relative">
              <Mail
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mud"
              />
              <input
                required
                type="email"
                name="email"
                placeholder="Email"
                className="w-full rounded-lg border border-white/10 bg-charcoal py-3 pl-11 pr-4 text-sm text-stone placeholder:text-mud focus:border-water focus:outline-none"
              />
            </div>

            <select
              name="service"
              defaultValue=""
              className="w-full rounded-lg border border-white/10 bg-charcoal px-4 py-3 text-sm text-stone focus:border-water focus:outline-none"
            >
              <option value="" disabled>
                Select a service
              </option>
              {services.map((s) => (
                <option key={s.title} value={s.title}>
                  {s.title}
                </option>
              ))}
              <option value="Other">Other / Not sure</option>
            </select>

            <input
              name="address"
              placeholder="Address or area"
              className="w-full rounded-lg border border-white/10 bg-charcoal px-4 py-3 text-sm text-stone placeholder:text-mud focus:border-water focus:outline-none"
            />

            <div className="relative">
              <MessageSquare
                size={16}
                className="pointer-events-none absolute left-4 top-4 text-mud"
              />
              <textarea
                name="message"
                placeholder="Anything else we should know?"
                rows={4}
                className="w-full rounded-lg border border-white/10 bg-charcoal py-3 pl-11 pr-4 text-sm text-stone placeholder:text-mud focus:border-water focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={status === "submitting"}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-ember px-6 py-4 text-base font-bold text-white transition-transform hover:scale-[1.02] disabled:opacity-60"
            >
              <Send size={18} />
              {status === "submitting" ? "Sending..." : "Request Free Quote"}
            </button>

            {status === "success" && (
              <p className="text-center text-sm font-semibold text-emberLight">
                Thanks! We&apos;ll be in touch shortly.
              </p>
            )}
            {status === "error" && (
              <p className="text-center text-sm font-semibold text-red-400">
                {errorMessage}
              </p>
            )}
          </form>
        </RevealOnScroll>
      </Container>
    </section>
  );
}

"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import Link from "next/link";
import { MapPin, Search } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import {
  serviceTowns,
  coveragePerimeter,
  checkServiceArea,
  type CheckResult,
} from "@/data/service-area";

export function ServiceAreaMap() {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Record<string, Marker>>({});

  const [query, setQuery] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapEl.current || mapRef.current) return;

      const map = L.map(mapEl.current, {
        scrollWheelZoom: false,
        zoomControl: true,
        attributionControl: true,
      });
      mapRef.current = map;

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          maxZoom: 19,
        },
      ).addTo(map);

      // Coverage zone
      L.polygon(coveragePerimeter, {
        color: "#1B62E8",
        weight: 2,
        fillColor: "#1B62E8",
        fillOpacity: 0.12,
      }).addTo(map);

      // Town markers (custom dots — no external icon assets)
      const bounds = L.latLngBounds([]);
      serviceTowns.forEach((t) => {
        const icon = L.divIcon({
          className: "",
          html: `<span style="display:block;width:14px;height:14px;border-radius:9999px;background:#1B62E8;box-shadow:0 0 0 4px rgba(27,98,232,0.25);border:2px solid #F5F4F0"></span>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        const marker = L.marker([t.lat, t.lng], { icon })
          .addTo(map)
          .bindPopup(`<strong>${t.name}, MD</strong>`);
        markersRef.current[t.name] = marker;
        bounds.extend([t.lat, t.lng]);
      });

      map.fitBounds(bounds, { padding: [40, 40] });
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const res = checkServiceArea(query);
    setResult(res);

    if (res.status === "in" && mapRef.current) {
      mapRef.current.flyTo([res.town.lat, res.town.lng], 12, {
        duration: 0.8,
      });
      markersRef.current[res.town.name]?.openPopup();
    }
  };

  return (
    <section className="bg-charcoal py-20 text-stone md:py-28">
      <Container className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-start">
        {/* Map (not wrapped in RevealOnScroll — that would remount the
            container node on hydration and orphan the Leaflet instance) */}
        <div
          ref={mapEl}
          className="relative z-0 h-[380px] w-full isolate overflow-hidden rounded-2xl border border-white/10 md:h-[520px]"
          style={{ background: "#0d120d" }}
        />

        {/* Checker + town list */}
        <RevealOnScroll delay={0.1}>
          <div className="border-t-2 border-ember pt-6">
            <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight lg:text-4xl">
              Are you in our zone?
            </h2>
            <p className="mt-3 text-mud">
              Enter your town or ZIP code to check if we cover your home.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 flex gap-3">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mud"
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Town or ZIP code"
                  aria-label="Town or ZIP code"
                  className="w-full rounded-lg border border-white/10 bg-black/20 py-3 pl-11 pr-4 text-sm text-stone placeholder:text-mud focus:border-water focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-ember px-5 py-3 text-sm font-bold text-white transition-transform hover:scale-105 active:scale-95"
              >
                Check
              </button>
            </form>

            {result?.status === "in" && (
              <div className="mt-5 rounded-lg border border-water/40 bg-water/10 p-4">
                <p className="font-semibold text-stone">
                  Yes — we serve {result.town.name}, MD.
                </p>
                <Link
                  href="/contact"
                  className="mt-2 inline-block text-sm font-semibold text-emberLight hover:underline"
                >
                  Get your free quote →
                </Link>
              </div>
            )}
            {result?.status === "out" && (
              <div className="mt-5 rounded-lg border border-white/10 bg-black/20 p-4">
                <p className="font-semibold text-stone">
                  We may still cover you.
                </p>
                <p className="mt-1 text-sm text-mud">
                  We serve most of Montgomery County — reach out and we&apos;ll
                  let you know.
                </p>
                <Link
                  href="/contact"
                  className="mt-2 inline-block text-sm font-semibold text-emberLight hover:underline"
                >
                  Contact us →
                </Link>
              </div>
            )}
            {result?.status === "empty" && (
              <p className="mt-4 text-sm text-emberLight">
                Please enter a town or ZIP code.
              </p>
            )}

            <div className="mt-8">
              <div className="flex items-center gap-2 text-water">
                <MapPin size={18} />
                <span className="text-sm font-semibold uppercase tracking-widest">
                  Communities we serve
                </span>
              </div>
              <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3 lg:grid-cols-2">
                {serviceTowns.map((t) => (
                  <li key={t.name} className="text-stone/90">
                    {t.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </RevealOnScroll>
      </Container>
    </section>
  );
}

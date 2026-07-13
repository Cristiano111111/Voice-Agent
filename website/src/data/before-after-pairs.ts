export interface BeforeAfterPair {
  id: string;
  before: string;
  after: string;
  alt: string;
  caption?: string;
}

// Add a new pair by dropping before-N.jpg / after-N.jpg into public/images
// and adding one entry here — no component changes needed.
export const beforeAfterPairs: BeforeAfterPair[] = [
  {
    id: "1",
    before: "/images/before-1.jpg",
    after: "/images/after-1.jpg",
    alt: "Driveway before and after pressure washing",
    caption: "Driveway — Rockville, MD",
  },
];

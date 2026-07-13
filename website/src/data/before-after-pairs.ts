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
    caption: "Concrete Driveway",
  },
  {
    id: "2",
    before: "/images/before-2.jpg",
    after: "/images/after-2.jpg",
    alt: "Stained driveway before and after pressure washing",
    caption: "Stained Driveway",
  },
  {
    id: "3",
    before: "/images/before-3.jpg",
    after: "/images/after-3.jpg",
    alt: "Vinyl siding before and after soft washing",
    caption: "Vinyl Siding",
  },
];

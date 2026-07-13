export interface Testimonial {
  quote: string;
  name: string;
  location: string;
  isPlaceholder: true;
}

// Placeholder content — replace with real reviews before launch.
export const testimonials: Testimonial[] = [
  {
    quote:
      "Our driveway looked brand new after they were done. Showed up on time and the price matched the quote exactly.",
    name: "Placeholder Review",
    location: "Rockville, MD",
    isPlaceholder: true,
  },
  {
    quote:
      "The siding on our house had years of green algae buildup. One visit and it's completely gone — no damage to the paint at all.",
    name: "Placeholder Review",
    location: "Clarksburg, MD",
    isPlaceholder: true,
  },
  {
    quote:
      "Easy to book, fast to respond, and the deck looks ready for summer. Would call again.",
    name: "Placeholder Review",
    location: "Germantown, MD",
    isPlaceholder: true,
  },
];

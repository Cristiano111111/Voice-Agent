export interface ServiceItem {
  icon: "driveway" | "house" | "deck" | "concrete" | "fence" | "roof";
  title: string;
  description: string;
}

export const services: ServiceItem[] = [
  {
    icon: "driveway",
    title: "Driveway Cleaning",
    description:
      "Oil stains, tire marks, and years of grime lifted from concrete and pavers — restored to like-new.",
  },
  {
    icon: "house",
    title: "House Washing",
    description:
      "Soft wash siding cleaning that removes mold, mildew, and algae without damaging paint or trim.",
  },
  {
    icon: "deck",
    title: "Deck & Patio Cleaning",
    description:
      "Wood, composite, and pavers cleaned and prepped for your next season — great before sealing or staining.",
  },
  {
    icon: "concrete",
    title: "Concrete Flatwork",
    description:
      "Sidewalks, walkways, and pool decks pressure washed to remove buildup and slip hazards.",
  },
  {
    icon: "fence",
    title: "Fence Washing",
    description:
      "Wood or vinyl fencing cleaned to remove the grime that builds up year after year.",
  },
  {
    icon: "roof",
    title: "Roof Soft Wash",
    description:
      "Low-pressure roof cleaning that removes black streaks and algae safely, without damaging shingles.",
  },
];

export interface ServiceItem {
  icon: "driveway" | "house" | "concrete" | "fence";
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
];

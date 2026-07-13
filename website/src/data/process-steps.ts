export interface ProcessStep {
  number: string;
  title: string;
  description: string;
}

export const processSteps: ProcessStep[] = [
  {
    number: "01",
    title: "Quote",
    description:
      "Tell us what needs cleaning and where. We give you a flat-rate quote — no surprises, no hourly guessing.",
  },
  {
    number: "02",
    title: "Schedule",
    description:
      "Pick a day that works for you. We show up on time, ready to go.",
  },
  {
    number: "03",
    title: "Wash",
    description:
      "We treat every surface with the right pressure and process — soft wash for siding and roofs, hot water for tough stains on concrete.",
  },
  {
    number: "04",
    title: "Reveal",
    description:
      "Step outside and see the difference. Clean, protected, and ready to show off.",
  },
];

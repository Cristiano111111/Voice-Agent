export interface ServiceTown {
  name: string;
  lat: number;
  lng: number;
  zips: string[];
}

// Montgomery County, MD communities we serve — coordinates + primary ZIPs
// power the map markers and the address/ZIP checker.
export const serviceTowns: ServiceTown[] = [
  { name: "Rockville", lat: 39.084, lng: -77.153, zips: ["20850", "20851", "20852", "20853", "20855"] },
  { name: "Clarksburg", lat: 39.238, lng: -77.279, zips: ["20871"] },
  { name: "Gaithersburg", lat: 39.143, lng: -77.201, zips: ["20877", "20878", "20879", "20882", "20886"] },
  { name: "Germantown", lat: 39.173, lng: -77.272, zips: ["20874", "20876"] },
  { name: "North Potomac", lat: 39.094, lng: -77.246, zips: ["20878"] },
  { name: "Potomac", lat: 39.018, lng: -77.208, zips: ["20854", "20859"] },
  { name: "Montgomery Village", lat: 39.178, lng: -77.185, zips: ["20886"] },
  { name: "Boyds", lat: 39.208, lng: -77.316, zips: ["20841"] },
  { name: "Damascus", lat: 39.288, lng: -77.203, zips: ["20872"] },
  { name: "Bethesda", lat: 38.984, lng: -77.094, zips: ["20814", "20816", "20817"] },
  { name: "Chevy Chase", lat: 38.968, lng: -77.078, zips: ["20815"] },
  { name: "Silver Spring", lat: 38.991, lng: -77.026, zips: ["20901", "20902", "20903", "20904", "20905", "20906", "20910"] },
  { name: "Olney", lat: 39.153, lng: -77.067, zips: ["20832", "20830"] },
];

// Rough perimeter (outer towns) drawn as the highlighted coverage zone.
export const coveragePerimeter: [number, number][] = [
  [39.288, -77.203], // Damascus (N)
  [39.238, -77.279], // Clarksburg (NW)
  [39.208, -77.316], // Boyds (W)
  [39.018, -77.208], // Potomac (SW)
  [38.984, -77.094], // Bethesda (S)
  [38.968, -77.078], // Chevy Chase (S)
  [38.991, -77.026], // Silver Spring (SE)
  [39.153, -77.067], // Olney (E)
];

export type CheckResult =
  | { status: "in"; town: ServiceTown }
  | { status: "out" }
  | { status: "empty" };

export function checkServiceArea(input: string): CheckResult {
  const q = input.trim().toLowerCase();
  if (!q) return { status: "empty" };

  const zipMatch = q.match(/\b\d{5}\b/);
  if (zipMatch) {
    const zip = zipMatch[0];
    const town = serviceTowns.find((t) => t.zips.includes(zip));
    return town ? { status: "in", town } : { status: "out" };
  }

  const town = serviceTowns.find(
    (t) => q.includes(t.name.toLowerCase()) || t.name.toLowerCase().includes(q),
  );
  return town ? { status: "in", town } : { status: "out" };
}

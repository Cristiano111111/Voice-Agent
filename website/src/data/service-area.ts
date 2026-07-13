export interface ServiceTown {
  name: string;
  lat: number;
  lng: number;
  zips: string[];
}

// Core service area: Rockville and Clarksburg, plus the towns immediately
// around them. Coordinates + primary ZIPs power the map markers and the
// address/ZIP checker.
export const serviceTowns: ServiceTown[] = [
  { name: "Rockville", lat: 39.084, lng: -77.153, zips: ["20850", "20851", "20852", "20853", "20855"] },
  { name: "Clarksburg", lat: 39.238, lng: -77.279, zips: ["20871"] },
  { name: "Gaithersburg", lat: 39.143, lng: -77.201, zips: ["20877", "20878", "20879", "20882", "20886"] },
  { name: "Germantown", lat: 39.173, lng: -77.272, zips: ["20874", "20876"] },
  { name: "North Potomac", lat: 39.094, lng: -77.246, zips: ["20878"] },
  { name: "Potomac", lat: 39.018, lng: -77.208, zips: ["20854", "20859"] },
  { name: "Montgomery Village", lat: 39.178, lng: -77.185, zips: ["20886"] },
  { name: "Boyds", lat: 39.208, lng: -77.316, zips: ["20841"] },
];

// Tight perimeter around the core towns (hull of the outermost points)
// drawn as the highlighted coverage zone — centered on Rockville/Clarksburg.
export const coveragePerimeter: [number, number][] = [
  [39.238, -77.279], // Clarksburg (N)
  [39.178, -77.185], // Montgomery Village (NE)
  [39.084, -77.153], // Rockville (E)
  [39.018, -77.208], // Potomac (S)
  [39.208, -77.316], // Boyds (W)
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

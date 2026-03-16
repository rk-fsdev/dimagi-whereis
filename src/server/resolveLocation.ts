import { geonamesSearchCached } from "@/server/geonames";

export type ResolvedLocation = {
  source: "geonames";
  query: string;
  resolved_name: string;
  geonameid: number | null;
  latitude: number;
  longitude: number;
  country_code: string | null;
  admin1_code: string | null;
  population: number | null;
  debug?: Record<string, unknown>;
};

export type ResolutionStrategy = "population" | "closest";

type LatLng = { latitude: number; longitude: number };

function normalizeQuery(q: string) {
  return q.trim().replace(/\s+/g, " ");
}

function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371; // km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);

  const h =
    sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

function pickBest<T extends { latitude: number; longitude: number; population?: number | null }>(
  candidates: T[],
  strategy: ResolutionStrategy,
  lastSeen?: LatLng
): T | null {
  if (!candidates.length) return null;

  const list = [...candidates];

  if (strategy === "closest" && lastSeen && Number.isFinite(lastSeen.latitude) && Number.isFinite(lastSeen.longitude)) {
    list.sort((a, b) => {
      const da = haversineKm(lastSeen, { latitude: a.latitude, longitude: a.longitude });
      const db = haversineKm(lastSeen, { latitude: b.latitude, longitude: b.longitude });
      if (!Number.isFinite(da) || !Number.isFinite(db)) {
        return Number(b.population ?? 0) - Number(a.population ?? 0);
      }
      if (da !== db) return da - db; // closer first
      return Number(b.population ?? 0) - Number(a.population ?? 0); // tie-breaker by population
    });
    return list[0] ?? null;
  }

  // Default: greatest population.
  return list.sort((a, b) => Number(b.population ?? 0) - Number(a.population ?? 0))[0] ?? null;
}

export async function resolveLocation(
  raw: string,
  options?: { strategy?: ResolutionStrategy; lastSeen?: LatLng }
): Promise<ResolvedLocation> {
  const query = normalizeQuery(raw);
  if (!query) throw new Error("Location is required");

  // GeoNames API (with SQLite-backed cache) lookup only.
  const strategy = options?.strategy ?? "population";
  const lastSeen = options?.lastSeen;

  const json = await geonamesSearchCached(query);
  const list = (json.geonames ?? []).map((g) => ({
    geonameid: g.geonameId,
    name: g.name,
    latitude: Number(g.lat),
    longitude: Number(g.lng),
    country_code: g.countryCode ?? null,
    admin1_code: g.adminCode1 ?? null,
    population: (g.population ?? null) as number | null,
  }));

  const apiBest = pickBest(list, strategy, lastSeen);
  if (!apiBest || !Number.isFinite(apiBest.latitude) || !Number.isFinite(apiBest.longitude)) {
    throw new Error("No matching location found");
  }

  return {
    source: "geonames",
    query,
    resolved_name: apiBest.name,
    geonameid: apiBest.geonameid,
    latitude: apiBest.latitude,
    longitude: apiBest.longitude,
    country_code: apiBest.country_code,
    admin1_code: apiBest.admin1_code,
    population: apiBest.population,
    debug: { match: "geonames", status: (json as any).status ?? null },
  };
}


import { createHash } from "node:crypto";
import { db } from "@/server/db";

export type GeoNamesToponym = {
  geonameId: number;
  name: string;
  lat: string;
  lng: string;
  countryCode?: string;
  adminCode1?: string;
  population?: number;
  fcl?: string;
  fcode?: string;
};

function sha1(s: string) {
  return createHash("sha1").update(s).digest("hex");
}

export async function geonamesSearchCached(query: string) {
  const username = process.env.GEONAMES_USERNAME || "dimagi";
  const cacheKey = sha1(`geonames:search:v1:${username}:${query.toLowerCase().trim()}`);
  const row = db()
    .prepare("select response_json from geonames_cache where cache_key = ?")
    .get(cacheKey) as { response_json: string } | undefined;
  if (row) {
    return JSON.parse(row.response_json) as { geonames?: GeoNamesToponym[]; status?: unknown };
  }

  const url = new URL("http://api.geonames.org/searchJSON");
  url.searchParams.set("username", username);
  url.searchParams.set("q", query);
  url.searchParams.set("maxRows", "10");
  url.searchParams.set("featureClass", "P");
  url.searchParams.set("orderby", "relevance");

  const res = await fetch(url, { headers: { "user-agent": "whereis-lite/0.1" } });
  if (!res.ok) throw new Error(`GeoNames HTTP ${res.status}`);
  const json = (await res.json()) as { geonames?: GeoNamesToponym[]; status?: unknown };

  db()
    .prepare("insert or replace into geonames_cache(cache_key, query, created_at, response_json) values(?,?,datetime('now'),?)")
    .run(cacheKey, query, JSON.stringify(json));

  return json;
}


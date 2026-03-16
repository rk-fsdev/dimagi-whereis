import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { resolveLocation, ResolutionStrategy } from "@/server/resolveLocation";

const CheckinSchema = z.object({
  email: z.string().email(),
  observed_at: z.string().min(1), // ISO string
  location: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = CheckinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }

  const { email, observed_at, location } = parsed.data;

  try {
    const strategyFromBody = (body as any)?.strategy as ResolutionStrategy | undefined;

    const last = db()
      .prepare(
        `
        select latitude, longitude
        from checkins
        where email = ?
          and latitude is not null
          and longitude is not null
        order by observed_at desc
        limit 1
        `
      )
      .get(email) as { latitude: number; longitude: number } | undefined;

    const lastSeen =
      last && Number.isFinite(last.latitude) && Number.isFinite(last.longitude)
        ? { latitude: last.latitude, longitude: last.longitude }
        : undefined;

    const resolved = await resolveLocation(location, {
      strategy: strategyFromBody ?? "population",
      lastSeen,
    });

    const row = db()
      .prepare(
        `
        insert into checkins(
          email, observed_at, raw_location,
          resolved_source, resolved_name, geonameid,
          latitude, longitude, country_code, admin1_code, population,
          created_at
        ) values (
          ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?, ?,
          datetime('now')
        )
        returning *
        `
      )
      .get(
        email,
        observed_at,
        location,
        resolved.source,
        resolved.resolved_name,
        resolved.geonameid,
        resolved.latitude,
        resolved.longitude,
        resolved.country_code,
        resolved.admin1_code,
        resolved.population
      ) as any;

    return NextResponse.json({ ok: true, checkin: row, resolved });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Failed to resolve location" }, { status: 500 });
  }
}


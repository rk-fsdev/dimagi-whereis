import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";

const QuerySchema = z.object({
  email: z.string().email(),
  at: z.string().min(1), // ISO string
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email");
  const at = url.searchParams.get("at");

  const parsed = QuerySchema.safeParse({ email, at });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid query parameters", issues: parsed.error.issues }, { status: 400 });
  }

  const { email: emailVal, at: atVal } = parsed.data;

  const row = db()
    .prepare(
      `
      select *
      from checkins
      where email = ?
        and observed_at <= ?
      order by observed_at desc
      limit 1
      `
    )
    .get(emailVal, atVal) as any | undefined;

  if (!row) {
    return NextResponse.json(
      { ok: false, error: "No location found at or before that time for this email" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, checkin: row });
}


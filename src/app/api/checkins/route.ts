import { NextResponse } from "next/server";
import { db } from "@/server/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "25") || 25, 200);

  const rows = email
    ? db()
        .prepare("select * from checkins where email = ? order by observed_at desc limit ?")
        .all(email, limit)
    : db().prepare("select * from checkins order by observed_at desc limit ?").all(limit);

  return NextResponse.json({ ok: true, checkins: rows });
}


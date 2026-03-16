"use client";

import { useState } from "react";

type CheckinRow = {
  id: number;
  email: string;
  observed_at: string;
  raw_location: string;
  resolved_source: string;
  resolved_name: string | null;
  latitude: number | null;
  longitude: number | null;
  country_code: string | null;
  admin1_code: string | null;
  population: number | null;
};

function nowLocalISOForInput() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export function LocationAtQuery() {
  const [queryEmail, setQueryEmail] = useState("nick@dimagi.com");
  const [queryAtLocal, setQueryAtLocal] = useState(nowLocalISOForInput());
  const [queryResult, setQueryResult] = useState<CheckinRow | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  async function onQuery(e: React.FormEvent) {
    e.preventDefault();
    setQueryError(null);
    setQueryResult(null);
    try {
      const atISO = new Date(queryAtLocal).toISOString();
      const url = new URL("/api/location-at", window.location.origin);
      url.searchParams.set("email", queryEmail);
      url.searchParams.set("at", atISO);
      const res = await fetch(url.toString());
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Query failed");
      setQueryResult(json.checkin);
    } catch (err: any) {
      setQueryError(err?.message ?? "Failed to query location");
    }
  }

  return (
    <div className="card">
      <h2 className="page-section-title">Query location at a time</h2>
      <div className="muted field-help">
        Given an email and timestamp, show the most recent known location at or before that time.
      </div>
      <form onSubmit={onQuery} className="grid">
        <div>
          <label>Email</label>
          <input value={queryEmail} onChange={(e) => setQueryEmail(e.target.value)} placeholder="nick@dimagi.com" />
        </div>
        <div>
          <label>At time</label>
          <input type="datetime-local" value={queryAtLocal} onChange={(e) => setQueryAtLocal(e.target.value)} />
        </div>
        <div className="actions-row">
          <button type="submit">Run query</button>
        </div>
      </form>
      {queryError ? <div className="error-text">{queryError}</div> : null}
      {queryResult ? (
        <div className="field-help">
          <div className="muted">
            Location at that time:
          </div>
          <pre>{JSON.stringify(queryResult, null, 2)}</pre>
          {queryResult.latitude != null && queryResult.longitude != null ? (
            <div className="muted">
              Map link:{" "}
              <a
                href={`https://www.openstreetmap.org/?mlat=${queryResult.latitude}&mlon=${queryResult.longitude}#map=10/${queryResult.latitude}/${queryResult.longitude}`}
                target="_blank"
                rel="noreferrer"
              >
                OpenStreetMap
              </a>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}


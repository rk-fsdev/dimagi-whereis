"use client";

import { useMemo, useState } from "react";

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

export function CheckinForm() {
  const [email, setEmail] = useState("nick@dimagi.com");
  const [observedAtLocal, setObservedAtLocal] = useState(nowLocalISOForInput());
  const [location, setLocation] = useState("Dodoma");
  const [strategy, setStrategy] = useState<"population" | "closest">("population");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const observedAtISO = useMemo(() => {
    const d = new Date(observedAtLocal);
    return d.toISOString();
  }, [observedAtLocal]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, observed_at: observedAtISO, location, strategy }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Request failed");
      setResult(json);
    } catch (err: any) {
      setError(err?.message ?? "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card">
      <form onSubmit={onSubmit} className="grid">
        <div>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nick@dimagi.com" />
        </div>
        <div>
          <label>Observed at</label>
          <input type="datetime-local" value={observedAtLocal} onChange={(e) => setObservedAtLocal(e.target.value)} />
          <div className="muted field-help">
            Stored as ISO timestamp: <code>{observedAtISO}</code>
          </div>
        </div>
        <div className="field-full">
          <label>Location</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Dodoma" />
          <div className="muted field-help">
            Try: <code>Lusaka</code>, <code>Dodoma</code>, <code>Andorra la Vella</code>.
          </div>
        </div>
        <div className="field-full">
          <label>Resolution strategy</label>
          <div className="muted radio-row">
            <label className="radio-label">
              <input
                type="radio"
                name="strategy"
                value="population"
                checked={strategy === "population"}
                onChange={() => setStrategy("population")}
              />
              Greatest population (default)
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="strategy"
                value="closest"
                checked={strategy === "closest"}
                onChange={() => setStrategy("closest")}
              />
              Closest to last known location
            </label>
          </div>
        </div>
        <div className="actions-row">
          <button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit check-in"}
          </button>
        </div>
      </form>

      {error ? <div className="error-text">{error}</div> : null}

      {result ? (
        <div className="field-help">
          <div className="muted">
            Normalized output (includes resolution debug info):
          </div>
          <pre>{JSON.stringify(result, null, 2)}</pre>
          {result?.checkin?.latitude != null && result?.checkin?.longitude != null ? (
            <div className="muted">
              Map link:{" "}
              <a
                href={`https://www.openstreetmap.org/?mlat=${result.checkin.latitude}&mlon=${result.checkin.longitude}#map=10/${result.checkin.latitude}/${result.checkin.longitude}`}
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


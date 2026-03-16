# Whereis Lite (Next.js + SQLite)

Lightweight staff check-in form that normalizes a free-text location to latitude/longitude.

Resolution strategy:

- Use GeoNames Search API (`searchJSON`) with a SQLite-backed response cache.

## Requirements

- Node.js (tested with Node 22)

## Setup

```bash
npm install
copy .env.example .env.local
```

## Run

```bash
npm run dev
```

Then open `http://localhost:3000`.

## API

- `POST /api/checkin`

Payload:

```json
{
  "email": "nick@dimagi.com",
  "observed_at": "2011-05-19T14:05:00.000Z",
  "location": "Dodoma"
}
```

- `GET /api/checkins?limit=25`
- `GET /api/checkins?email=nick@dimagi.com&limit=25`

## Notes

- Cache is stored in the same SQLite DB (`geonames_cache` table).

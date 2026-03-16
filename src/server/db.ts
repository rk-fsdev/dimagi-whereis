import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_PATH = path.join(DATA_DIR, "whereis.sqlite");

let _db: Database.Database | null = null;

export function db(): Database.Database {
  if (_db) return _db;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const database = new Database(DB_PATH);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  database.exec(`
    create table if not exists geonames_cache (
      cache_key text primary key,
      query text not null,
      created_at text not null,
      response_json text not null
    );

    create table if not exists checkins (
      id integer primary key autoincrement,
      email text not null,
      observed_at text not null,
      raw_location text not null,
      resolved_source text not null,
      resolved_name text,
      geonameid integer,
      latitude real,
      longitude real,
      country_code text,
      admin1_code text,
      population integer,
      created_at text not null
    );
    create index if not exists idx_checkins_email_time on checkins(email, observed_at desc);
  `);
  _db = database;
  return database;
}


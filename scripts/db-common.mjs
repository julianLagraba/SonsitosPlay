import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);

/**
 * Carga .env.local y .env sin depender de flags de Node.
 */
export function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const fullPath = path.join(ROOT, file);
    if (!fs.existsSync(fullPath)) continue;

    const content = fs.readFileSync(fullPath, 'utf8');
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      const match = line.match(/^([\w.-]+)\s*=\s*(.*)$/);
      if (!match) continue;

      const key = match[1];
      let value = match[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

export function getConnectionString() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED
  );
}

// Mantener en sync con src/lib/db.ts
export const SCHEMA_STATEMENTS = [
  'SELECT pg_advisory_xact_lock(918273645)',
  `CREATE TABLE IF NOT EXISTS movies (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    year INTEGER,
    synopsis TEXT,
    poster_url TEXT,
    genre TEXT,
    status TEXT NOT NULL DEFAULT 'para_ver' CHECK (status IN ('para_ver', 'viendo', 'ya_vista')),
    rating DOUBLE PRECISION CHECK (rating >= 1 AND rating <= 10),
    review TEXT,
    type TEXT NOT NULL DEFAULT 'movie' CHECK (type IN ('movie', 'series')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  'CREATE INDEX IF NOT EXISTS idx_movies_status ON movies(status)',
  'CREATE INDEX IF NOT EXISTS idx_movies_title ON movies(title)',
  'CREATE INDEX IF NOT EXISTS idx_movies_rating ON movies(rating)',
  `CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    rating DOUBLE PRECISION NOT NULL CHECK (rating >= 1 AND rating <= 10),
    review TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  'CREATE INDEX IF NOT EXISTS idx_reviews_movie_id ON reviews(movie_id)',
];

export async function ensureSchema(sql) {
  await sql.transaction(SCHEMA_STATEMENTS.map((statement) => sql.query(statement)));
}

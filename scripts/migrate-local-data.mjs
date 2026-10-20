import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { neon } from '@neondatabase/serverless';
import { ROOT, ensureSchema, getConnectionString, loadEnv } from './db-common.mjs';

loadEnv();

const connectionString = getConnectionString();
if (!connectionString) {
  console.error(
    '❌ Falta DATABASE_URL (o POSTGRES_URL). Configurala en .env.local o en las variables de entorno.'
  );
  process.exit(1);
}

const localDbPath = path.join(ROOT, 'data', 'pelislog.db');
if (!fs.existsSync(localDbPath)) {
  console.error(`❌ No se encontró la base local en ${localDbPath}`);
  process.exit(1);
}

const sql = neon(connectionString);
await ensureSchema(sql);

const localDb = new DatabaseSync(localDbPath);
const localMovies = localDb
  .prepare('SELECT * FROM movies ORDER BY id')
  .all();

const existing = await sql.query('SELECT id, title, year FROM movies');
const existingByKey = new Map(
  existing.map((movie) => [keyOf(movie.title, movie.year), movie.id])
);

const idMap = new Map();
let inserted = 0;
let skipped = 0;

for (const movie of localMovies) {
  const key = keyOf(movie.title, movie.year);

  if (existingByKey.has(key)) {
    idMap.set(movie.id, existingByKey.get(key));
    skipped++;
    continue;
  }

  const [row] = await sql.query(
    `INSERT INTO movies
       (title, year, synopsis, poster_url, genre, status, rating, review, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8,
             COALESCE($9::timestamptz, NOW()), COALESCE($10::timestamptz, NOW()))
     RETURNING id`,
    [
      movie.title,
      movie.year ?? null,
      movie.synopsis ?? null,
      movie.poster_url ?? null,
      movie.genre ?? null,
      movie.status ?? 'para_ver',
      movie.rating ?? null,
      movie.review ?? null,
      movie.created_at ?? null,
      movie.updated_at ?? null,
    ]
  );

  idMap.set(movie.id, row.id);
  existingByKey.set(key, row.id);
  inserted++;
}

let localReviews = [];
try {
  localReviews = localDb.prepare('SELECT * FROM reviews ORDER BY id').all();
} catch {
  // La tabla reviews puede no existir en bases viejas.
}

let insertedReviews = 0;

for (const review of localReviews) {
  const movieId = idMap.get(review.movie_id);
  if (!movieId) continue;

  const [alreadyThere] = await sql.query(
    'SELECT 1 AS found FROM reviews WHERE movie_id = $1 AND review = $2 LIMIT 1',
    [movieId, review.review]
  );
  if (alreadyThere) continue;

  await sql.query(
    `INSERT INTO reviews (movie_id, rating, review, created_at)
     VALUES ($1, $2, $3, COALESCE($4::timestamptz, NOW()))`,
    [movieId, review.rating, review.review, review.created_at ?? null]
  );
  insertedReviews++;
}

console.log(
  `✅ Migración lista: ${inserted} películas y ${insertedReviews} reseñas copiadas (${skipped} ya existían).`
);

function keyOf(title, year) {
  return `${String(title).toLowerCase()}|${year ?? ''}`;
}

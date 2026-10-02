import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { Movie, MovieInput, ReviewInput, MovieStatus } from '@/types';

const DB_PATH = path.join(process.cwd(), 'data', 'pelislog.db');

let db: DatabaseSync | null = null;

function getDb(): DatabaseSync {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new DatabaseSync(DB_PATH);
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

function initSchema(database: DatabaseSync): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      year INTEGER,
      synopsis TEXT,
      poster_url TEXT,
      genre TEXT,
      status TEXT NOT NULL DEFAULT 'para_ver' CHECK (status IN ('para_ver', 'viendo', 'ya_vista')),
      rating INTEGER CHECK (rating >= 1 AND rating <= 10),
      review TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_movies_status ON movies(status);
    CREATE INDEX IF NOT EXISTS idx_movies_title ON movies(title);
    CREATE INDEX IF NOT EXISTS idx_movies_rating ON movies(rating);

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      movie_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
      review TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_reviews_movie_id ON reviews(movie_id);
  `);
}

export function getAllMovies(): Movie[] {
  const database = getDb();
  return database
    .prepare('SELECT * FROM movies ORDER BY created_at DESC')
    .all() as unknown as Movie[];
}

export function getMoviesByStatus(status: MovieStatus): Movie[] {
  const database = getDb();
  return database
    .prepare('SELECT * FROM movies WHERE status = ? ORDER BY created_at DESC')
    .all(status) as unknown as Movie[];
}

export function searchMovies(query: string): Movie[] {
  const database = getDb();
  return database
    .prepare('SELECT * FROM movies WHERE title LIKE ? ORDER BY created_at DESC')
    .all(`%${query}%`) as unknown as Movie[];
}

export function getMoviesByRating(rating: number): Movie[] {
  const database = getDb();
  return database
    .prepare('SELECT * FROM movies WHERE rating = ? ORDER BY created_at DESC')
    .all(rating) as unknown as Movie[];
}

export function getMovieById(id: number): Movie | null {
  const database = getDb();
  const row = database
    .prepare('SELECT * FROM movies WHERE id = ?')
    .get(id);
  return (row as unknown as Movie) || null;
}

export function createMovie(input: MovieInput): Movie {
  const database = getDb();
  const result = database
    .prepare(
      `INSERT INTO movies (title, year, synopsis, poster_url, genre, status)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.title,
      input.year ?? null,
      input.synopsis ?? null,
      input.poster_url ?? null,
      input.genre ?? null,
      input.status || 'para_ver'
    );
  return getMovieById(Number(result.lastInsertRowid))!;
}

export function updateMovieStatus(id: number, status: MovieStatus): Movie | null {
  const database = getDb();
  database
    .prepare(
      `UPDATE movies SET status = ?, updated_at = datetime('now') WHERE id = ?`
    )
    .run(status, id);
  return getMovieById(id);
}

export function updateMovieReview(id: number, input: ReviewInput): Movie | null {
  const database = getDb();
  database
    .prepare(
      `UPDATE movies SET rating = ?, review = ?, status = 'ya_vista', updated_at = datetime('now') WHERE id = ?`
    )
    .run(input.rating, input.review, id);

  database
    .prepare(
      `INSERT INTO reviews (movie_id, rating, review) VALUES (?, ?, ?)`
    )
    .run(id, input.rating, input.review);

  return getMovieById(id);
}

export function updateMovie(id: number, input: Partial<MovieInput>): Movie | null {
  const database = getDb();
  const fields: string[] = [];
  const values: (string | number | bigint | null)[] = [];

  if (input.title !== undefined) {
    fields.push('title = ?');
    values.push(input.title);
  }
  if (input.year !== undefined) {
    fields.push('year = ?');
    values.push(input.year ?? null);
  }
  if (input.synopsis !== undefined) {
    fields.push('synopsis = ?');
    values.push(input.synopsis ?? null);
  }
  if (input.poster_url !== undefined) {
    fields.push('poster_url = ?');
    values.push(input.poster_url ?? null);
  }
  if (input.genre !== undefined) {
    fields.push('genre = ?');
    values.push(input.genre ?? null);
  }
  if (input.status !== undefined) {
    fields.push('status = ?');
    values.push(input.status);
  }

  if (fields.length === 0) return getMovieById(id);

  fields.push("updated_at = datetime('now')");
  values.push(id);

  database
    .prepare(`UPDATE movies SET ${fields.join(', ')} WHERE id = ?`)
    .run(...values);

  return getMovieById(id);
}

export function deleteMovie(id: number): boolean {
  const database = getDb();
  const result = database.prepare('DELETE FROM movies WHERE id = ?').run(id);
  return Number(result.changes) > 0;
}

export function getRandomMovieByStatus(status: MovieStatus): Movie | null {
  const database = getDb();
  const row = database
    .prepare('SELECT * FROM movies WHERE status = ? ORDER BY RANDOM() LIMIT 1')
    .get(status);
  return (row as unknown as Movie) || null;
}

export function seedMovies(): void {
  // Seed data eliminada - las películas se cargan manualmente desde la UI
  // Este función ahora solo asegura que la base de datos esté inicializada
}

export function getStats(): { total: number; para_ver: number; viendo: number; ya_vista: number } {
  const database = getDb();
  const result = database
    .prepare(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'para_ver' THEN 1 ELSE 0 END) as para_ver,
        SUM(CASE WHEN status = 'viendo' THEN 1 ELSE 0 END) as viendo,
        SUM(CASE WHEN status = 'ya_vista' THEN 1 ELSE 0 END) as ya_vista
      FROM movies`
    )
    .get() as { total: number | bigint; para_ver: number | bigint | null; viendo: number | bigint | null; ya_vista: number | bigint | null } | undefined;

  return {
    total: Number(result?.total || 0),
    para_ver: Number(result?.para_ver || 0),
    viendo: Number(result?.viendo || 0),
    ya_vista: Number(result?.ya_vista || 0),
  };
}

import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { Movie, MovieInput, MediaType, ReviewInput, MovieStatus } from '@/types';

type Sql = NeonQueryFunction<false, false>;

// Vercel/Neon inyectan la cadena de conexión en distintas variables según
// cómo se haya creado la base. Soportamos las más comunes.
const CONNECTION_STRING =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL_UNPOOLED;

const SCHEMA_STATEMENTS = [
  // Evita que dos instancias serverless creen el esquema al mismo tiempo.
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

let sqlClient: Sql | null = null;
let schemaPromise: Promise<void> | null = null;

function getSql(): Sql {
  if (!CONNECTION_STRING) {
    throw new Error(
      'Falta DATABASE_URL. Creá una base Postgres (Neon) y configurá la cadena de conexión en las variables de entorno.'
    );
  }
  if (!sqlClient) {
    sqlClient = neon(CONNECTION_STRING);
  }
  return sqlClient;
}

async function ensureSchema(): Promise<void> {
  if (!schemaPromise) {
    const sql = getSql();
    schemaPromise = sql
      .transaction(SCHEMA_STATEMENTS.map((statement) => sql.query(statement)))
      .then(() => undefined)
      .catch((error) => {
        // Si falla, permitimos reintentar en la próxima consulta.
        schemaPromise = null;
        throw error;
      });
  }
  return schemaPromise;
}

async function fetchRows<T>(query: string, params: unknown[] = []): Promise<T[]> {
  await ensureSchema();
  const rows = await getSql().query(query, params);
  return rows as T[];
}

export async function getAllMovies(type?: MediaType): Promise<Movie[]> {
  if (type) {
    return fetchRows<Movie>(
      'SELECT * FROM movies WHERE type = $1 ORDER BY created_at DESC, id DESC',
      [type]
    );
  }
  return fetchRows<Movie>(
    'SELECT * FROM movies ORDER BY created_at DESC, id DESC'
  );
}

export async function getMoviesByStatus(
  status: MovieStatus,
  type?: MediaType
): Promise<Movie[]> {
  if (type) {
    return fetchRows<Movie>(
      'SELECT * FROM movies WHERE status = $1 AND type = $2 ORDER BY created_at DESC, id DESC',
      [status, type]
    );
  }
  return fetchRows<Movie>(
    'SELECT * FROM movies WHERE status = $1 ORDER BY created_at DESC, id DESC',
    [status]
  );
}

export async function searchMovies(query: string, type?: MediaType): Promise<Movie[]> {
  if (type) {
    return fetchRows<Movie>(
      'SELECT * FROM movies WHERE title ILIKE $1 AND type = $2 ORDER BY created_at DESC, id DESC',
      [`%${query}%`, type]
    );
  }
  return fetchRows<Movie>(
    'SELECT * FROM movies WHERE title ILIKE $1 ORDER BY created_at DESC, id DESC',
    [`%${query}%`]
  );
}

export async function getMoviesByRating(rating: number): Promise<Movie[]> {
  return fetchRows<Movie>(
    'SELECT * FROM movies WHERE rating = $1 ORDER BY created_at DESC, id DESC',
    [rating]
  );
}

export async function getMovieById(id: number): Promise<Movie | null> {
  const rows = await fetchRows<Movie>('SELECT * FROM movies WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function createMovie(input: MovieInput): Promise<Movie> {
  const rows = await fetchRows<Movie>(
    `INSERT INTO movies (title, year, synopsis, poster_url, genre, status, type)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      input.title,
      input.year ?? null,
      input.synopsis ?? null,
      input.poster_url ?? null,
      input.genre ?? null,
      input.status || 'para_ver',
      input.type || 'movie',
    ]
  );
  return rows[0];
}

export async function updateMovieStatus(
  id: number,
  status: MovieStatus
): Promise<Movie | null> {
  const rows = await fetchRows<Movie>(
    `UPDATE movies SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return rows[0] ?? null;
}

export async function updateMovieReview(
  id: number,
  input: ReviewInput
): Promise<Movie | null> {
  // Un solo statement atómico: actualiza la película y registra la reseña.
  const rows = await fetchRows<Movie>(
    `WITH updated AS (
       UPDATE movies
       SET rating = $1, review = $2, status = 'ya_vista', updated_at = NOW()
       WHERE id = $3
       RETURNING *
     ), inserted AS (
       INSERT INTO reviews (movie_id, rating, review)
       SELECT id, $1, $2 FROM updated
     )
     SELECT * FROM updated`,
    [input.rating, input.review, id]
  );
  return rows[0] ?? null;
}

export async function updateMovie(
  id: number,
  input: Partial<MovieInput>
): Promise<Movie | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let index = 1;

  if (input.title !== undefined) {
    fields.push(`title = $${index++}`);
    values.push(input.title);
  }
  if (input.year !== undefined) {
    fields.push(`year = $${index++}`);
    values.push(input.year ?? null);
  }
  if (input.synopsis !== undefined) {
    fields.push(`synopsis = $${index++}`);
    values.push(input.synopsis ?? null);
  }
  if (input.poster_url !== undefined) {
    fields.push(`poster_url = $${index++}`);
    values.push(input.poster_url ?? null);
  }
  if (input.genre !== undefined) {
    fields.push(`genre = $${index++}`);
    values.push(input.genre ?? null);
  }
  if (input.status !== undefined) {
    fields.push(`status = $${index++}`);
    values.push(input.status);
  }
  if (input.type !== undefined) {
    fields.push(`type = $${index++}`);
    values.push(input.type);
  }

  if (fields.length === 0) {
    return getMovieById(id);
  }

  fields.push('updated_at = NOW()');
  values.push(id);

  const rows = await fetchRows<Movie>(
    `UPDATE movies SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`,
    values
  );
  return rows[0] ?? null;
}

export async function deleteMovie(id: number): Promise<boolean> {
  const rows = await fetchRows<{ id: number }>(
    'DELETE FROM movies WHERE id = $1 RETURNING id',
    [id]
  );
  return rows.length > 0;
}

export async function getRandomMovieByStatus(
  status: MovieStatus,
  type?: MediaType
): Promise<Movie | null> {
  if (type) {
    const rows = await fetchRows<Movie>(
      'SELECT * FROM movies WHERE status = $1 AND type = $2 ORDER BY RANDOM() LIMIT 1',
      [status, type]
    );
    return rows[0] ?? null;
  }

  const rows = await fetchRows<Movie>(
    'SELECT * FROM movies WHERE status = $1 ORDER BY RANDOM() LIMIT 1',
    [status]
  );
  return rows[0] ?? null;
}

export async function seedMovies(): Promise<void> {
  // El esquema se crea de forma perezosa en la primera consulta.
  await ensureSchema();
}

export async function getStats(type?: MediaType): Promise<{
  total: number;
  para_ver: number;
  viendo: number;
  ya_vista: number;
}> {
  const rows = await fetchRows<{
    total: number;
    para_ver: number;
    viendo: number;
    ya_vista: number;
  }>(
    `SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'para_ver')::int AS para_ver,
      COUNT(*) FILTER (WHERE status = 'viendo')::int AS viendo,
      COUNT(*) FILTER (WHERE status = 'ya_vista')::int AS ya_vista
    FROM movies
    ${type ? 'WHERE type = $1' : ''}`,
    type ? [type] : []
  );

  return rows[0] ?? { total: 0, para_ver: 0, viendo: 0, ya_vista: 0 };
}

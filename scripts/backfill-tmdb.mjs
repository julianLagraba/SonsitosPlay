import { neon } from '@neondatabase/serverless';
import { ensureSchema, getConnectionString, loadEnv } from './db-common.mjs';

loadEnv();

const apiKey = process.env.TMDB_API_KEY;
if (!apiKey) {
  console.error('❌ Falta TMDB_API_KEY. Configurala en .env.local.');
  process.exit(1);
}

const connectionString = getConnectionString();
if (!connectionString) {
  console.error('❌ Falta DATABASE_URL (o POSTGRES_URL).');
  process.exit(1);
}

const sql = neon(connectionString);
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function normalize(value) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

async function tmdb(path, params = {}) {
  const url = new URL(`${TMDB_BASE_URL}/${path}`);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('language', 'es-AR');
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${path} respondió ${response.status}`);
  }
  return response.json();
}

function pickMatch(results, title, year) {
  if (!results.length) return null;
  const target = normalize(title);

  const scored = results
    .map((item) => {
      const itemTitle = item.title ?? item.name ?? '';
      const date = item.release_date ?? item.first_air_date ?? '';
      const itemYear = date ? Number(date.slice(0, 4)) : null;
      let score = 0;

      if (normalize(itemTitle) === target) score += 10;
      else if (
        normalize(itemTitle).includes(target) ||
        target.includes(normalize(itemTitle))
      ) {
        score += 4;
      }

      if (year && itemYear) {
        const difference = Math.abs(itemYear - year);
        if (difference === 0) score += 5;
        else if (difference <= 1) score += 2;
      }

      return { item, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0].item;
}

async function enrich(row) {
  const isSeries = row.type === 'series';

  let match = null;
  if (row.tmdb_id) {
    match = { id: row.tmdb_id };
  } else {
    const results = await tmdb(isSeries ? 'search/tv' : 'search/movie', {
      query: row.title,
      ...(row.year
        ? isSeries
          ? { first_air_date_year: row.year }
          : { year: row.year }
        : {}),
    });

    match = pickMatch(results.results ?? [], row.title, row.year);
    if (!match) return null;
  }

  await sleep(200);
  const details = await tmdb(`${isSeries ? 'tv' : 'movie'}/${match.id}`);

  if (!isSeries) {
    return {
      match,
      runtime: details.runtime ?? null,
      totalSeasons: null,
      totalEpisodes: null,
    };
  }

  const seasons = (details.seasons ?? []).filter(
    (season) => season.season_number > 0
  );
  const totalEpisodes = seasons.length
    ? seasons.reduce((total, season) => total + (season.episode_count ?? 0), 0)
    : details.number_of_episodes ?? null;

  let runtime = details.episode_run_time?.[0] ?? null;

  // Muchas series no traen episode_run_time: promediamos la temporada 1.
  if (!runtime) {
    try {
      await sleep(200);
      const firstSeason = await tmdb(`tv/${match.id}/season/1`);
      const runtimes = (firstSeason.episodes ?? [])
        .map((episode) => episode.runtime)
        .filter((value) => typeof value === 'number' && value > 0);

      if (runtimes.length > 0) {
        runtime = Math.round(
          runtimes.reduce((total, value) => total + value, 0) / runtimes.length
        );
      }
    } catch {
      // Si falla, seguimos sin duración.
    }
  }

  return {
    match,
    runtime,
    totalSeasons: details.number_of_seasons ?? (seasons.length || null),
    totalEpisodes,
  };
}

async function main() {
  await ensureSchema(sql);

  const rows = await sql.query(
    `SELECT id, title, year, type, tmdb_id, runtime
     FROM movies
     WHERE tmdb_id IS NULL OR (type = 'series' AND (runtime IS NULL OR total_episodes IS NULL))
     ORDER BY id`
  );

  console.log(`🔎 Títulos a completar: ${rows.length}`);

  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    try {
      const data = await enrich(row);

      if (!data) {
        skipped += 1;
        console.log(`  ⚠️  Sin coincidencia: ${row.title} (${row.year ?? 's/año'})`);
        continue;
      }

      await sql.query(
        `UPDATE movies
         SET tmdb_id = $1, runtime = $2, total_seasons = $3, total_episodes = $4, updated_at = NOW()
         WHERE id = $5`,
        [
          data.match.id,
          data.runtime,
          data.totalSeasons,
          data.totalEpisodes,
          row.id,
        ]
      );

      updated += 1;
      console.log(
        `  ✅ ${row.title} → TMDB ${data.match.id} | min=${data.runtime ?? '-'} | T=${data.totalSeasons ?? '-'} | E=${data.totalEpisodes ?? '-'}`
      );
    } catch (error) {
      skipped += 1;
      console.error(`  ❌ ${row.title}: ${error.message}`);
    }

    await sleep(250);
  }

  console.log(`\nResumen: ${updated} actualizados, ${skipped} sin datos.`);
}

main().catch((error) => {
  console.error('❌ Error en el backfill:', error);
  process.exit(1);
});

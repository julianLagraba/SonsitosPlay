import { neon } from '@neondatabase/serverless';
import { ensureSchema, getConnectionString, loadEnv } from './db-common.mjs';

loadEnv();

const connectionString = getConnectionString();
if (!connectionString) {
  console.error(
    '❌ Falta DATABASE_URL (o POSTGRES_URL). Configurala en .env.local o en las variables de entorno.'
  );
  process.exit(1);
}

const sql = neon(connectionString);

try {
  await ensureSchema(sql);
  const [stats] = await sql.query('SELECT COUNT(*)::int AS count FROM movies');
  console.log(`✅ Base de datos lista. Películas actuales: ${stats.count}`);
} catch (error) {
  console.error('❌ No se pudo inicializar la base de datos:', error);
  process.exit(1);
}

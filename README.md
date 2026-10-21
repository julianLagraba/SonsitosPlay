# SonsitosPlay - Tu Lista de Películas Compartida

Aplicación web para gestionar una lista de películas compartida con estilo Letterboxd/Netflix.

## Características

- **Gestión de Estados**: Clasifica películas y series en "Para ver", "Viendo" y "Ya vista"
- **Películas y Series**: listas separadas con pestañas, cada una con su búsqueda, filtros y ruleta
- **Sistema de Puntajes**: Calificación de 1 a 10 (admite decimales) y reseña personal opcional, disponible para películas y series en cualquier estado
- **Dónde ver**: plataformas disponibles en Argentina (Netflix, Prime Video, Max, etc.) con logos y opciones de alquiler o compra. Datos de TMDB/JustWatch
- **Progreso de Series**: temporada y episodio actual, porcentaje completado y badge "T2 E5" en la tarjeta. Al guardar progreso, la serie pasa a "Viendo"
- **Tráiler y Reparto**: trailer de YouTube y elenco principal dentro del detalle de cada título
- **Estadísticas**: totales, promedio de puntajes, géneros favoritos, horas estimadas y mejor puntuadas
- **Buscador y Filtros**: Búsqueda por título y filtros por estado/puntaje
- **Integración TMDB**: Autocompletado de sinopsis, año, póster, duración y temporadas para películas y series
- **Ruleta Rusa**: Selección aleatoria de películas o series pendientes
- **Diseño Mobile First**: 100% responsive, dark mode, glassmorphism

## Estructura del Proyecto

```
pelislog/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── movies/
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── route.ts
│   │   │   │   │   └── review/
│   │   │   │   │       └── route.ts
│   │   │   │   └── route.ts
│   │   │   ├── details/
│   │   │   │   └── route.ts
│   │   │   ├── roulette/
│   │   │   │   └── route.ts
│   │   │   └── seed/
│   │   │       └── route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── AddMovieModal.tsx
│   │   ├── FilterButtons.tsx
│   │   ├── MovieCard.tsx
│   │   ├── MovieModal.tsx
│   │   ├── RussianRoulette.tsx
│   │   ├── SearchBar.tsx
│   │   └── StatsModal.tsx
│   ├── lib/
│   │   ├── db.ts
│   │   └── tmdb.ts
│   └── types/
│       └── index.ts
├── public/
│   └── manifest.json
├── .env.example
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

## Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Edita .env.local y agrega tu TMDB_API_KEY y tu DATABASE_URL (Postgres/Neon)

# 3. Inicializar la base de datos (opcional, se crea sola en la primera consulta)
npm run db:init

# 4. (Opcional) Completar TMDB ID, duración y temporadas de títulos ya cargados
npm run db:backfill

# 5. Ejecutar en desarrollo
npm run dev
```

> **Importante:** la app necesita una base Postgres (Neon / Vercel Postgres) porque en Vercel no existe disco persistente. Si no configurás `DATABASE_URL`, las rutas de la API van a devolver un error explicándolo.

## API de TMDB (películas y series)

1. Crea una cuenta en [TMDB](https://www.themoviedb.org/)
2. Ve a Settings > API
3. Copia tu API Key
4. Agregala a `.env.local`:

```
TMDB_API_KEY=tu_api_key_aqui
```

El buscador consulta `search/movie` y `search/tv` en paralelo y unifica los resultados, indicando si cada uno es película o serie.

### Dónde ver, tráiler y reparto

El endpoint `/api/details` consulta TMDB para obtener:

- Plataformas disponibles en **Argentina** (`AR`), separadas en incluidas, gratis, con anuncios, alquiler y compra.
- Tráiler oficial de YouTube y reparto principal.
- Duración (películas) o duración por episodio y listado de temporadas (series).

Los datos de disponibilidad los provee **JustWatch** a través de TMDB. La app muestra la atribución correspondiente en el detalle de cada título.

Para los títulos cargados antes de esta funcionalidad, ejecutá:

```bash
npm run db:backfill
```

El script busca cada título en TMDB por nombre, año y tipo, y guarda `tmdb_id`, `runtime`, `total_seasons` y `total_episodes`. Es idempotente: solo completa los que faltan.

## Esquema de Base de Datos

Base de datos: **PostgreSQL** (Neon / Vercel Postgres).

### Tabla: `movies`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | SERIAL PK | Identificador único |
| title | TEXT NOT NULL | Título de la película |
| year | INTEGER | Año de lanzamiento |
| synopsis | TEXT | Sinopsis/descripción |
| poster_url | TEXT | URL del póster oficial |
| genre | TEXT | Género |
| status | TEXT | Estado: para_ver, viendo, ya_vista |
| rating | DOUBLE PRECISION | Calificación 1-10 (admite decimales) |
| review | TEXT | Reseña personal |
| type | TEXT | movie o series |
| tmdb_id | INTEGER | ID del título en TMDB (para detalles, plataformas y tráiler) |
| runtime | INTEGER | Minutos de la película o duración por episodio de la serie |
| total_seasons | INTEGER | Cantidad de temporadas (series) |
| total_episodes | INTEGER | Cantidad total de episodios (series) |
| current_season | INTEGER | Temporada actual del progreso (series) |
| current_episode | INTEGER | Episodio actual del progreso (series) |
| created_at | TIMESTAMPTZ | Fecha de creación |
| updated_at | TIMESTAMPTZ | Fecha de actualización |

### Tabla: `reviews`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | SERIAL PK | Identificador único |
| movie_id | INTEGER FK | Referencia a movies.id |
| rating | DOUBLE PRECISION | Calificación 1-10 |
| review | TEXT | Texto de la reseña |
| created_at | TIMESTAMPTZ | Fecha de creación |

El esquema se crea automáticamente en la primera consulta. También se puede forzar con `npm run db:init`.

## API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /api/movies?type=movie\|series | Obtener títulos (opcionalmente filtrados por tipo) |
| POST | /api/movies | Crear película o serie (campo `type`) |
| GET | /api/movies/:id | Obtener título por ID |
| PATCH | /api/movies/:id | Actualizar título |
| DELETE | /api/movies/:id | Eliminar título |
| POST | /api/movies/:id/review | Guardar puntaje y reseña (opcional) |
| PATCH | /api/movies/:id | Actualizar estado, progreso o metadata |
| GET | /api/details?type=movie\|series&id=... | Plataformas, tráiler, reparto y temporadas desde TMDB |
| POST | /api/roulette?type=movie\|series | Título aleatorio de "Para ver" |
| GET | /api/search?q=... | Buscar películas y series en TMDB |
| POST | /api/seed | Inicializar datos |

## Despliegue

### Vercel (Recomendado)

La app guarda los datos en Postgres, no en el disco de Vercel (que es temporal). Pasos:

1. En el panel de Vercel del proyecto, ir a **Storage → Create Database → Neon**.
2. Conectarla al proyecto. Vercel agrega la variable `DATABASE_URL` automáticamente.
3. Hacer **Redeploy** para que la función reciba la variable.
4. (Opcional) Copiar la cadena de conexión a `.env.local` y migrar los datos que ya tengas en la base SQLite local:

   ```bash
   npm run db:migrate
   ```

```bash
# Alternativa por CLI
npm i -g vercel
vercel
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Tecnologías

- **Framework**: Next.js 14 (App Router)
- **Estilos**: Tailwind CSS
- **Base de Datos**: PostgreSQL serverless (Neon) con `@neondatabase/serverless`
- **Iconos**: Lucide React
- **API**: TMDB (The Movie Database)

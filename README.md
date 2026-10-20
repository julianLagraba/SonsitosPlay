# SonsitosPlay - Tu Lista de Películas Compartida

Aplicación web para gestionar una lista de películas compartida con estilo Letterboxd/Netflix.

## Características

- **Gestión de Estados**: Clasifica películas en "Para ver", "Viendo" y "Ya vista"
- **Sistema de Reseñas**: Calificación de 1-5 estrellas y reseñas personales
- **Buscador y Filtros**: Búsqueda por título y filtros por estado/calificación
- **Integración TMDB**: Autocompletado de sinopsis, año y póster oficial
- **Ruleta Rusa**: Selección aleatoria de películas pendientes
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
│   │   ├── RussianRoulette.tsx
│   │   └── SearchBar.tsx
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

# 4. Ejecutar en desarrollo
npm run dev
```

> **Importante:** la app necesita una base Postgres (Neon / Vercel Postgres) porque en Vercel no existe disco persistente. Si no configurás `DATABASE_URL`, las rutas de la API van a devolver un error explicándolo.

## API de Películas (TMDB)

1. Crea una cuenta en [TMDB](https://www.themoviedb.org/)
2. Ve a Settings > API
3. Copia tu API Key
4. Agregala a `.env.local`:

```
TMDB_API_KEY=tu_api_key_aqui
```

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
| GET | /api/movies | Obtener todas las películas |
| POST | /api/movies | Crear nueva película |
| GET | /api/movies/:id | Obtener película por ID |
| PATCH | /api/movies/:id | Actualizar película |
| DELETE | /api/movies/:id | Eliminar película |
| POST | /api/movies/:id/review | Agregar reseña |
| POST | /api/roulette | Película aleatoria |
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

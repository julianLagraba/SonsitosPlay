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
# Edita .env.local y agrega tu TMDB_API_KEY

# 3. Inicializar la base de datos (opcional, se hace automáticamente)
curl -X POST http://localhost:3000/api/seed

# 4. Ejecutar en desarrollo
npm run dev
```

## API de Películas (TMDB)

1. Crea una cuenta en [TMDB](https://www.themoviedb.org/)
2. Ve a Settings > API
3. Copia tu API Key
4. Agregala a `.env.local`:

```
TMDB_API_KEY=tu_api_key_aqui
```

## Esquema de Base de Datos

### Tabla: `movies`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | INTEGER PK | Identificador único |
| title | TEXT NOT NULL | Título de la película |
| year | INTEGER | Año de lanzamiento |
| synopsis | TEXT | Sinopsis/descripción |
| poster_url | TEXT | URL del póster oficial |
| status | TEXT | Estado: para_ver, viendo, ya_vista |
| rating | INTEGER | Calificación 1-5 |
| review | TEXT | Reseña personal |
| created_at | TEXT | Fecha de creación |
| updated_at | TEXT | Fecha de actualización |

### Tabla: `reviews`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | INTEGER PK | Identificador único |
| movie_id | INTEGER FK | Referencia a movies.id |
| rating | INTEGER | Calificación 1-5 |
| review | TEXT | Texto de la reseña |
| created_at | TEXT | Fecha de creación |

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

```bash
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
- **Base de Datos**: SQLite (mejor-sqlite3)
- **Iconos**: Lucide React
- **API**: TMDB (The Movie Database)

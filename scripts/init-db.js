const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'data', 'pelislog.db');
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    year INTEGER,
    synopsis TEXT,
    poster_url TEXT,
    status TEXT NOT NULL DEFAULT 'para_ver' CHECK (status IN ('para_ver', 'viendo', 'ya_vista')),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
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
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_reviews_movie_id ON reviews(movie_id);
`);

const countRow = db.prepare('SELECT COUNT(*) as count FROM movies').get();
const count = Number(countRow?.count || 0);

if (count === 0) {
  const seedData = [
    { title: 'Ángeles y Demonios', year: 2009 },
    { title: 'El Código Da Vinci', year: 2006 },
    { title: 'Cónclave', year: 2024 },
    { title: 'Hokun', year: null },
    { title: 'Infierno', year: 2016 },
    { title: 'La Hipótesis del Amor', year: 2024 },
    { title: 'Michael (Jackson)', year: null },
  ];

  const insert = db.prepare('INSERT INTO movies (title, year, status) VALUES (?, ?, ?)');
  db.exec('BEGIN');
  try {
    for (const m of seedData) {
      insert.run(m.title, m.year ?? null, 'para_ver');
    }
    db.exec('COMMIT');
    console.log('✅ Base de datos inicializada y poblada con 7 películas de ejemplo.');
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('Error al poblar la base de datos:', err);
  }
} else {
  console.log(`ℹ️ La base de datos ya contiene ${count} películas.`);
}

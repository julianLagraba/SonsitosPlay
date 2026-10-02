import { TMDBMovie, TMDBResponse } from '@/types';

const TMDB_API_KEY = process.env.TMDB_API_KEY || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

export async function searchTMDBMovies(query: string, language: string = 'es-ES'): Promise<TMDBMovie[]> {
  if (!TMDB_API_KEY) {
    console.warn('TMDB_API_KEY no configurada. Usando datos simulados.');
    return getMockResults(query);
  }

  try {
    const url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&language=${language}&query=${encodeURIComponent(query)}&page=1`;
    const response = await fetch(url, { next: { revalidate: 3600 } });

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data: TMDBResponse = await response.json();
    return data.results;
  } catch (error) {
    console.error('Error buscando en TMDB:', error);
    return [];
  }
}

export function getTMDBPosterUrl(posterPath: string | null): string | null {
  if (!posterPath) return null;
  return `${TMDB_IMAGE_BASE}${posterPath}`;
}

export function parseTMDBMovie(movie: TMDBMovie) {
  return {
    title: movie.title,
    year: movie.release_date ? parseInt(movie.release_date.split('-')[0], 10) : null,
    synopsis: movie.overview || null,
    poster_url: getTMDBPosterUrl(movie.poster_path),
  };
}

function getMockResults(query: string): TMDBMovie[] {
  const mockMovies: TMDBMovie[] = [
    {
      id: 1,
      title: 'Ángeles y Demonios',
      original_title: 'Angels & Demons',
      overview: 'El simbologo Robert Langdon investiga una sociedad secreta que amenaza al Vaticano.',
      release_date: '2009-05-14',
      poster_path: '/mock/angels.jpg',
      backdrop_path: null,
      vote_average: 6.7,
    },
    {
      id: 2,
      title: 'El Código Da Vinci',
      original_title: 'The Da Vinci Code',
      overview: 'Un simbologo y una criptóloga deben resolver un asesinato que podría cambiar la historia del cristianismo.',
      release_date: '2006-05-18',
      poster_path: '/mock/davinci.jpg',
      backdrop_path: null,
      vote_average: 6.7,
    },
    {
      id: 3,
      title: 'Cónclave',
      original_title: 'Conclave',
      overview: 'Un cardenal debe elegir al nuevo Papa en un proceso lleno de secretos y traiciones.',
      release_date: '2024-10-25',
      poster_path: '/mock/conclave.jpg',
      backdrop_path: null,
      vote_average: 7.8,
    },
    {
      id: 4,
      title: 'La Hipótesis del Amor',
      original_title: 'The Love Hypothesis',
      overview: 'Una científica finge una relación con un profesor universitario, pero las cosas se complican.',
      release_date: '2024-03-15',
      poster_path: '/mock/love.jpg',
      backdrop_path: null,
      vote_average: 7.2,
    },
  ];

  return mockMovies.filter((m) =>
    m.title.toLowerCase().includes(query.toLowerCase()) ||
    m.original_title.toLowerCase().includes(query.toLowerCase())
  );
}

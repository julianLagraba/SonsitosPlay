import { NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [], connected: false });
  }

  if (!TMDB_API_KEY) {
    return NextResponse.json({
      results: [],
      connected: false,
      error: 'TMDB_API_KEY no configurada',
    });
  }

  try {
    const url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&language=es-ES&query=${encodeURIComponent(query)}&page=1`;
    const response = await fetch(url, { next: { revalidate: 3600 } });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json({
        results: [],
        connected: false,
        error: errorData.status_message || `Error ${response.status}`,
      });
    }

    const data = await response.json();

    const results = data.results.map((movie: {
      id: number;
      title: string;
      original_title: string;
      overview: string;
      release_date: string;
      poster_path: string | null;
      vote_average: number;
      genre_ids: number[];
    }) => ({
      id: movie.id,
      title: movie.title,
      original_title: movie.original_title,
      overview: movie.overview,
      release_date: movie.release_date,
      poster_path: movie.poster_path,
      vote_average: movie.vote_average,
      genre_ids: movie.genre_ids || [],
    }));

    return NextResponse.json({
      results,
      connected: true,
    });
  } catch (error) {
    console.error('Error searching TMDB:', error);
    return NextResponse.json({
      results: [],
      connected: false,
      error: 'Error de conexión',
    });
  }
}

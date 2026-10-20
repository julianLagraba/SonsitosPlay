import { NextResponse } from 'next/server';
import { MediaType } from '@/types';

const TMDB_API_KEY = process.env.TMDB_API_KEY || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

interface RawTMDBItem {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  genre_ids?: number[];
  popularity?: number;
}

interface SearchResult {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  vote_average: number;
  genre_ids: number[];
  popularity: number;
  media_type: MediaType;
}

function normalize(item: RawTMDBItem, mediaType: MediaType): SearchResult {
  return {
    id: item.id,
    title: item.title ?? item.name ?? '',
    original_title: item.original_title ?? item.original_name ?? '',
    overview: item.overview ?? '',
    release_date: item.release_date ?? item.first_air_date ?? '',
    poster_path: item.poster_path ?? null,
    vote_average: item.vote_average ?? 0,
    genre_ids: item.genre_ids ?? [],
    popularity: item.popularity ?? 0,
    media_type: mediaType,
  };
}

async function searchTmdb(path: 'search/movie' | 'search/tv', query: string) {
  const url = `${TMDB_BASE_URL}/${path}?api_key=${TMDB_API_KEY}&language=es-ES&query=${encodeURIComponent(query)}&page=1`;
  const response = await fetch(url, { next: { revalidate: 3600 } });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.status_message || `Error ${response.status}`);
  }

  const data = await response.json();
  return (data.results ?? []) as RawTMDBItem[];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const typeParam = searchParams.get('type');
  const typeFilter: MediaType | null =
    typeParam === 'movie' || typeParam === 'series' ? typeParam : null;

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
    const searches: Promise<SearchResult[]>[] = [];

    if (!typeFilter || typeFilter === 'movie') {
      searches.push(
        searchTmdb('search/movie', query).then((items) =>
          items.map((item) => normalize(item, 'movie'))
        )
      );
    }
    if (!typeFilter || typeFilter === 'series') {
      searches.push(
        searchTmdb('search/tv', query).then((items) =>
          items.map((item) => normalize(item, 'series'))
        )
      );
    }

    const settled = await Promise.allSettled(searches);
    const results = settled
      .filter(
        (result): result is PromiseFulfilledResult<SearchResult[]> =>
          result.status === 'fulfilled'
      )
      .flatMap((result) => result.value)
      .sort((a, b) => b.popularity - a.popularity);

    if (settled.every((result) => result.status === 'rejected')) {
      const firstError = settled[0] as PromiseRejectedResult;
      return NextResponse.json({
        results: [],
        connected: false,
        error: firstError.reason?.message || 'Error de conexión',
      });
    }

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

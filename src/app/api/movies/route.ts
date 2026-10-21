import { NextResponse } from 'next/server';
import { getAllMovies, createMovie, seedMovies, getStats } from '@/lib/db';
import { MediaType, MovieInput } from '@/types';

// Evita que Next cachee la respuesta y devuelva datos viejos.
export const dynamic = 'force-dynamic';

function parseType(value: string | null): MediaType | undefined {
  return value === 'movie' || value === 'series' ? value : undefined;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = parseType(searchParams.get('type'));

    await seedMovies();
    const movies = await getAllMovies(type);
    const stats = await getStats(type);
    return NextResponse.json({ movies, stats });
  } catch (error) {
    console.error('Error fetching movies:', error);
    return NextResponse.json(
      { error: 'Error al obtener los títulos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: MovieInput = await request.json();

    if (!body.title || body.title.trim() === '') {
      return NextResponse.json(
        { error: 'El título es obligatorio' },
        { status: 400 }
      );
    }

    const movie = await createMovie({
      title: body.title.trim(),
      year: body.year || null,
      synopsis: body.synopsis || null,
      poster_url: body.poster_url || null,
      genre: body.genre || null,
      status: body.status || 'para_ver',
      type: body.type === 'series' ? 'series' : 'movie',
      tmdb_id: typeof body.tmdb_id === 'number' ? body.tmdb_id : null,
      runtime: typeof body.runtime === 'number' ? body.runtime : null,
      total_seasons:
        typeof body.total_seasons === 'number' ? body.total_seasons : null,
      total_episodes:
        typeof body.total_episodes === 'number' ? body.total_episodes : null,
    });

    return NextResponse.json({ movie }, { status: 201 });
  } catch (error) {
    console.error('Error creating movie:', error);
    return NextResponse.json(
      { error: 'Error al crear el título' },
      { status: 500 }
    );
  }
}

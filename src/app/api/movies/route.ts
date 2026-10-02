import { NextResponse } from 'next/server';
import { getAllMovies, createMovie, seedMovies, getStats } from '@/lib/db';
import { MovieInput } from '@/types';

export async function GET() {
  try {
    seedMovies();
    const movies = getAllMovies();
    const stats = getStats();
    return NextResponse.json({ movies, stats });
  } catch (error) {
    console.error('Error fetching movies:', error);
    return NextResponse.json(
      { error: 'Error al obtener películas' },
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

    const movie = createMovie({
      title: body.title.trim(),
      year: body.year || null,
      synopsis: body.synopsis || null,
      poster_url: body.poster_url || null,
      genre: body.genre || null,
      status: body.status || 'para_ver',
    });

    return NextResponse.json({ movie }, { status: 201 });
  } catch (error) {
    console.error('Error creating movie:', error);
    return NextResponse.json(
      { error: 'Error al crear película' },
      { status: 500 }
    );
  }
}

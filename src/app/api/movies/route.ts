import { NextResponse } from 'next/server';
import { getAllMovies, createMovie, seedMovies, getStats } from '@/lib/db';
import { MovieInput } from '@/types';

// Evita que Next cachee la respuesta y devuelva datos viejos.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await seedMovies();
    const movies = await getAllMovies();
    const stats = await getStats();
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

    const movie = await createMovie({
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

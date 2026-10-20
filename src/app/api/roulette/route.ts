import { NextResponse } from 'next/server';
import { getRandomMovieByStatus } from '@/lib/db';
import { MediaType } from '@/types';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get('type');
    const type: MediaType | undefined =
      typeParam === 'movie' || typeParam === 'series' ? typeParam : undefined;

    const movie = await getRandomMovieByStatus('para_ver', type);

    if (!movie) {
      return NextResponse.json(
        {
          error:
            type === 'series'
              ? 'No hay series en la lista "Para ver"'
              : type === 'movie'
                ? 'No hay películas en la lista "Para ver"'
                : 'No hay títulos en la lista "Para ver"',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ movie });
  } catch (error) {
    console.error('Error with roulette:', error);
    return NextResponse.json(
      { error: 'Error al seleccionar título aleatorio' },
      { status: 500 }
    );
  }
}

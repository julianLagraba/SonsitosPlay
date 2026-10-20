import { NextResponse } from 'next/server';
import { getRandomMovieByStatus } from '@/lib/db';

export async function POST() {
  try {
    const movie = await getRandomMovieByStatus('para_ver');

    if (!movie) {
      return NextResponse.json(
        { error: 'No hay películas en la lista "Para ver"' },
        { status: 404 }
      );
    }

    return NextResponse.json({ movie });
  } catch (error) {
    console.error('Error with roulette:', error);
    return NextResponse.json(
      { error: 'Error al seleccionar película aleatoria' },
      { status: 500 }
    );
  }
}

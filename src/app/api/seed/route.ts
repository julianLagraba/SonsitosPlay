import { NextResponse } from 'next/server';
import { seedMovies, getAllMovies } from '@/lib/db';

export async function POST() {
  try {
    seedMovies();
    const movies = getAllMovies();
    return NextResponse.json({
      message: 'Base de datos inicializada correctamente',
      count: movies.length,
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json(
      { error: 'Error al inicializar la base de datos' },
      { status: 500 }
    );
  }
}

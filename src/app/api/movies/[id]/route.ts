import { NextResponse } from 'next/server';
import { updateMovie, deleteMovie, getMovieById } from '@/lib/db';
import { MovieStatus } from '@/types';

type Params = {
  params: { id: string };
};

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: Params) {
  try {
    const movie = await getMovieById(parseInt(params.id, 10));
    if (!movie) {
      return NextResponse.json(
        { error: 'Título no encontrado' },
        { status: 404 }
      );
    }
    return NextResponse.json({ movie });
  } catch (error) {
    console.error('Error fetching movie:', error);
    return NextResponse.json(
      { error: 'Error al obtener el título' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const body = await request.json();
    const id = parseInt(params.id, 10);

    if (body.status !== undefined) {
      const validStatuses: MovieStatus[] = ['para_ver', 'viendo', 'ya_vista'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: 'Estado inválido' },
          { status: 400 }
        );
      }
    }

    for (const key of ['current_season', 'current_episode'] as const) {
      if (body[key] !== undefined && body[key] !== null) {
        const value = Number(body[key]);
        if (!Number.isInteger(value) || value < 1) {
          return NextResponse.json(
            { error: 'El progreso debe ser un número entero mayor a 0' },
            { status: 400 }
          );
        }
      }
    }

    const movie = await updateMovie(id, body);
    if (!movie) {
      return NextResponse.json(
        { error: 'Título no encontrado' },
        { status: 404 }
      );
    }
    return NextResponse.json({ movie });
  } catch (error) {
    console.error('Error updating movie:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el título' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const id = parseInt(params.id, 10);
    const success = await deleteMovie(id);
    if (!success) {
      return NextResponse.json(
        { error: 'Título no encontrado' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting movie:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el título' },
      { status: 500 }
    );
  }
}

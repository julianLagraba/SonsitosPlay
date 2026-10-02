import { NextResponse } from 'next/server';
import { updateMovieStatus, updateMovie, deleteMovie, getMovieById } from '@/lib/db';
import { MovieStatus } from '@/types';

type Params = {
  params: { id: string };
};

export async function GET(_request: Request, { params }: Params) {
  try {
    const movie = getMovieById(parseInt(params.id, 10));
    if (!movie) {
      return NextResponse.json(
        { error: 'Película no encontrada' },
        { status: 404 }
      );
    }
    return NextResponse.json({ movie });
  } catch (error) {
    console.error('Error fetching movie:', error);
    return NextResponse.json(
      { error: 'Error al obtener película' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const body = await request.json();
    const id = parseInt(params.id, 10);

    if (body.status) {
      const validStatuses: MovieStatus[] = ['para_ver', 'viendo', 'ya_vista'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: 'Estado inválido' },
          { status: 400 }
        );
      }
      const movie = updateMovieStatus(id, body.status);
      if (!movie) {
        return NextResponse.json(
          { error: 'Película no encontrada' },
          { status: 404 }
        );
      }
      return NextResponse.json({ movie });
    }

    const movie = updateMovie(id, body);
    if (!movie) {
      return NextResponse.json(
        { error: 'Película no encontrada' },
        { status: 404 }
      );
    }
    return NextResponse.json({ movie });
  } catch (error) {
    console.error('Error updating movie:', error);
    return NextResponse.json(
      { error: 'Error al actualizar película' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const id = parseInt(params.id, 10);
    const success = deleteMovie(id);
    if (!success) {
      return NextResponse.json(
        { error: 'Película no encontrada' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting movie:', error);
    return NextResponse.json(
      { error: 'Error al eliminar película' },
      { status: 500 }
    );
  }
}

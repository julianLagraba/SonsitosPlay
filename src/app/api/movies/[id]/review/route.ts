import { NextResponse } from 'next/server';
import { updateMovieReview } from '@/lib/db';
import { ReviewInput } from '@/types';

type Params = {
  params: { id: string };
};

export async function POST(request: Request, { params }: Params) {
  try {
    const body: ReviewInput = await request.json();
    const id = parseInt(params.id, 10);

    if (body.rating === undefined || body.rating === null || body.rating < 1 || body.rating > 10) {
      return NextResponse.json(
        { error: 'El puntaje debe ser entre 1 y 10' },
        { status: 400 }
      );
    }

    const movie = await updateMovieReview(id, {
      rating: body.rating,
      review: (body.review ?? '').trim(),
    });

    if (!movie) {
      return NextResponse.json(
        { error: 'Título no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ movie });
  } catch (error) {
    console.error('Error submitting review:', error);
    return NextResponse.json(
      { error: 'Error al guardar el puntaje' },
      { status: 500 }
    );
  }
}

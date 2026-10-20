'use client';

import { useState, useEffect } from 'react';
import { Movie, MovieStatus } from '@/types';
import {
  X,
  Star,
  Clock,
  CheckCircle,
  CheckCircle2,
  Eye,
  Trash2,
  Calendar,
  Film,
  Tv,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface MovieModalProps {
  movie: Movie;
  onClose: () => void;
  onStatusChange: (id: number, status: MovieStatus) => Promise<void>;
  onReviewSubmit: (id: number, rating: number, review: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

type Message = { type: 'success' | 'error'; text: string } | null;

const statusConfig = {
  para_ver: {
    label: 'Para ver',
    icon: Clock,
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  viendo: {
    label: 'Viendo',
    icon: Eye,
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  },
  ya_vista: {
    label: 'Ya vista',
    icon: CheckCircle,
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
};

// Convert 1-10 rating to 5 stars display
function RatingStars({ rating, size = 'w-5 h-5' }: { rating: number; size?: string }) {
  const stars = (rating / 10) * 5;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const fillPercentage = Math.min(1, Math.max(0, stars - (star - 1)));
        return (
          <div key={star} className="relative">
            <Star className={`${size} text-white/20`} />
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fillPercentage * 100}%` }}
            >
              <Star className={`${size} text-yellow-400 fill-yellow-400`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ActionMessage({ message }: { message: Message }) {
  if (!message) return null;

  return (
    <p
      className={`mt-3 flex items-center gap-1.5 text-sm fade-in ${
        message.type === 'success' ? 'text-green-400' : 'text-red-400'
      }`}
    >
      {message.type === 'success' ? (
        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
      ) : (
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
      )}
      {message.text}
    </p>
  );
}

export default function MovieModal({ movie, onClose, onStatusChange, onReviewSubmit, onDelete }: MovieModalProps) {
  const config = statusConfig[movie.status];
  const StatusIcon = config.icon;
  const isSeries = movie.type === 'series';
  const kindLabel = isSeries ? 'serie' : 'película';

  const [ratingInput, setRatingInput] = useState<string>(movie.rating?.toString() || '');
  const [reviewText, setReviewText] = useState(movie.review || '');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<Message>(null);
  const [reviewMessage, setReviewMessage] = useState<Message>(null);

  // Sync inputs when the movie changes (y al guardar, con la respuesta del servidor).
  useEffect(() => {
    setRatingInput(movie.rating?.toString() || '');
    setReviewText(movie.review || '');
  }, [movie.id, movie.rating, movie.review]);

  // Reinicia los mensajes al abrir otra película.
  useEffect(() => {
    setStatusMessage(null);
    setReviewMessage(null);
  }, [movie.id]);

  // Los mensajes de éxito desaparecen solos.
  useEffect(() => {
    if (!statusMessage || statusMessage.type !== 'success') return;
    const timer = setTimeout(() => setStatusMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [statusMessage]);

  useEffect(() => {
    if (!reviewMessage || reviewMessage.type !== 'success') return;
    const timer = setTimeout(() => setReviewMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [reviewMessage]);

  const handleStatusChange = async (status: MovieStatus) => {
    if (status === movie.status || isUpdatingStatus) return;

    setIsUpdatingStatus(true);
    setStatusMessage(null);

    try {
      await onStatusChange(movie.id, status);
      setStatusMessage({
        type: 'success',
        text: `Estado actualizado a "${statusConfig[status].label}"`,
      });
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'No se pudo cambiar el estado. Intentá de nuevo.',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const rating = parseFloat(ratingInput);
    if (isNaN(rating) || rating < 1 || rating > 10) {
      setReviewMessage({
        type: 'error',
        text: 'Ingresá un puntaje entre 1 y 10.',
      });
      return;
    }

    setIsSavingReview(true);
    setReviewMessage(null);

    try {
      await onReviewSubmit(movie.id, rating, reviewText.trim());
      setReviewMessage({ type: 'success', text: '¡Puntaje guardado!' });
    } catch (error) {
      setReviewMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'No se pudo guardar el puntaje.',
      });
    } finally {
      setIsSavingReview(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    if (!confirm(`¿Eliminar esta ${kindLabel}?`)) return;

    setIsDeleting(true);
    try {
      await onDelete(movie.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const numericRating = parseFloat(ratingInput) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80" onClick={onClose}>
      <div
        className="glass-strong rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto fade-in safe-area-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con póster */}
        <div className="relative">
          <div className="aspect-[2/3] w-full max-h-[40vh] overflow-hidden rounded-t-3xl">
            {movie.poster_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={movie.poster_url}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-surface-700 to-surface-800 flex items-center justify-center">
                <Film className="w-16 h-16 text-white/20" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-surface-900 via-transparent to-transparent" />
          </div>

          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Título superpuesto */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h2 className="text-2xl font-bold text-white drop-shadow-lg">{movie.title}</h2>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {movie.year && (
                <span className="flex items-center gap-1 text-sm text-white/70">
                  <Calendar className="w-4 h-4" />
                  {movie.year}
                </span>
              )}
              {movie.genre && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  {movie.genre}
                </span>
              )}
              <span
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${
                  isSeries
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                    : 'bg-white/10 text-white/60 border-white/20'
                }`}
              >
                {isSeries ? <Tv className="w-3 h-3" /> : <Film className="w-3 h-3" />}
                {isSeries ? 'Serie' : 'Película'}
              </span>
              <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
                <StatusIcon className="w-3 h-3" />
                {config.label}
              </span>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          {/* Sinopsis */}
          {movie.synopsis && (
            <div>
              <h3 className="text-sm font-medium text-white/50 mb-2">Sinopsis</h3>
              <p className="text-white/80 leading-relaxed">{movie.synopsis}</p>
            </div>
          )}

          {/* Calificación actual */}
          {movie.rating !== null && (
            <div>
              <h3 className="text-sm font-medium text-white/50 mb-2">Tu puntaje</h3>
              <div className="flex items-center gap-3">
                <RatingStars rating={movie.rating} size="w-6 h-6" />
                <span className="text-2xl font-bold text-yellow-400">{movie.rating}</span>
                <span className="text-white/40 text-lg">/10</span>
              </div>
            </div>
          )}

          {/* Reseña actual */}
          {movie.review && (
            <div>
              <h3 className="text-sm font-medium text-white/50 mb-2">Tu reseña</h3>
              <p className="text-white/80 bg-white/5 rounded-xl p-4 italic">&quot;{movie.review}&quot;</p>
            </div>
          )}

          {/* Botones de estado */}
          <div>
            <h3 className="text-sm font-medium text-white/50 mb-3">Cambiar estado</h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleStatusChange('para_ver')}
                disabled={isUpdatingStatus}
                className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-60 ${
                  movie.status === 'para_ver'
                    ? 'bg-blue-500/30 text-blue-400 border-2 border-blue-500/50'
                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20'
                }`}
              >
                <Clock className="w-4 h-4" />
                Para ver
              </button>
              <button
                onClick={() => handleStatusChange('viendo')}
                disabled={isUpdatingStatus}
                className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-60 ${
                  movie.status === 'viendo'
                    ? 'bg-yellow-500/30 text-yellow-400 border-2 border-yellow-500/50'
                    : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20'
                }`}
              >
                <Eye className="w-4 h-4" />
                Viendo
              </button>
              <button
                onClick={() => handleStatusChange('ya_vista')}
                disabled={isUpdatingStatus}
                className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-60 ${
                  movie.status === 'ya_vista'
                    ? 'bg-green-500/30 text-green-400 border-2 border-green-500/50'
                    : 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                Ya vista
              </button>
            </div>
            <ActionMessage message={statusMessage} />
          </div>

          {/* Formulario de puntaje: disponible para películas y series, en cualquier estado */}
          <form onSubmit={handleReviewSubmit} className="space-y-4 pt-4 border-t border-white/10">
            <div>
              <h3 className="text-sm font-medium text-white/50">
                {movie.rating !== null ? 'Editar puntaje y reseña' : 'Puntuar y reseñar'}
              </h3>
              <p className="text-xs text-white/30 mt-1">
                Podés guardar tu puntaje aunque todavía no la hayas terminado.
              </p>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-2 block">Tu puntaje (1-10)</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="0.1"
                    value={ratingInput}
                    onChange={(e) => setRatingInput(e.target.value)}
                    className="w-20 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-center text-lg font-bold focus:outline-none focus:border-accent/50"
                    placeholder="0"
                  />
                  <span className="text-white/40 text-lg">/10</span>
                </div>
                <div className="flex-1">
                  <RatingStars rating={numericRating} size="w-6 h-6" />
                </div>
              </div>
              <p className="text-xs text-white/30 mt-2">
                Escribe un número del 1 al 10 (puede ser decimal, ej: 9.7)
              </p>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-2 block">Tu reseña (opcional)</label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="¿Qué te pareció? (opcional)"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-accent/50 resize-none"
                rows={4}
              />
            </div>
            <button
              type="submit"
              disabled={isSavingReview}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-white font-medium hover:bg-accent-hover transition-colors disabled:opacity-60 disabled:cursor-wait"
            >
              {isSavingReview && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSavingReview
                ? 'Guardando...'
                : movie.rating !== null
                  ? 'Actualizar puntaje'
                  : 'Guardar puntaje'}
            </button>
            <ActionMessage message={reviewMessage} />
          </form>

          {/* Botón eliminar */}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-60"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {isDeleting ? 'Eliminando...' : `Eliminar ${kindLabel}`}
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Movie, MovieStatus } from '@/types';
import { X, Star, Clock, CheckCircle, Eye, Trash2, Calendar, Film } from 'lucide-react';

interface MovieModalProps {
  movie: Movie;
  onClose: () => void;
  onStatusChange: (id: number, status: MovieStatus) => void;
  onReviewSubmit: (id: number, rating: number, review: string) => void;
  onDelete: (id: number) => void;
}

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

export default function MovieModal({ movie, onClose, onStatusChange, onReviewSubmit, onDelete }: MovieModalProps) {
  const config = statusConfig[movie.status];
  const StatusIcon = config.icon;
  const [ratingInput, setRatingInput] = useState<string>(movie.rating?.toString() || '');
  const [reviewText, setReviewText] = useState(movie.review || '');

  // Sync state when movie prop changes
  useEffect(() => {
    setRatingInput(movie.rating?.toString() || '');
    setReviewText(movie.review || '');
  }, [movie.id, movie.rating, movie.review]);

  const handleReviewSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Formulario enviado');
    console.log('ratingInput:', ratingInput);
    console.log('reviewText:', reviewText);
    console.log('movie.id:', movie.id);

    const rating = parseFloat(ratingInput);
    if (isNaN(rating) || rating < 1 || rating > 10) {
      alert('Ingresa una calificación entre 1 y 10');
      return;
    }

    console.log('Enviando al servidor...');
    onReviewSubmit(movie.id, rating, reviewText);
  };

  const handleDelete = () => {
    if (confirm('¿Eliminar esta película?')) {
      onDelete(movie.id);
      onClose();
    }
  };

  const numericRating = parseFloat(ratingInput) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
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
          {movie.rating && (
            <div>
              <h3 className="text-sm font-medium text-white/50 mb-2">Tu calificación</h3>
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
                onClick={() => onStatusChange(movie.id, 'para_ver')}
                className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                  movie.status === 'para_ver'
                    ? 'bg-blue-500/30 text-blue-400 border-2 border-blue-500/50'
                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20'
                }`}
              >
                <Clock className="w-4 h-4" />
                Para ver
              </button>
              <button
                onClick={() => onStatusChange(movie.id, 'viendo')}
                className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                  movie.status === 'viendo'
                    ? 'bg-yellow-500/30 text-yellow-400 border-2 border-yellow-500/50'
                    : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20'
                }`}
              >
                <Eye className="w-4 h-4" />
                Viendo
              </button>
              <button
                onClick={() => onStatusChange(movie.id, 'ya_vista')}
                className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                  movie.status === 'ya_vista'
                    ? 'bg-green-500/30 text-green-400 border-2 border-green-500/50'
                    : 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                Ya vista
              </button>
            </div>
          </div>

          {/* Formulario de reseña para películas vistas */}
          {movie.status === 'ya_vista' && (
            <form onSubmit={handleReviewSubmit} className="space-y-4 pt-4 border-t border-white/10">
              <h3 className="text-sm font-medium text-white/50">
                {movie.review ? 'Editar reseña' : 'Agregar reseña'}
              </h3>
              <div>
                <label className="text-xs text-white/50 mb-2 block">Tu calificación (1-10)</label>
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
                <label className="text-xs text-white/50 mb-2 block">Tu reseña</label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="¿Qué te pareció? Cuéntanos..."
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-accent/50 resize-none"
                  rows={4}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-accent text-white font-medium hover:bg-accent-hover transition-colors"
              >
                {movie.review ? 'Actualizar reseña' : 'Guardar reseña'}
              </button>
            </form>
          )}

          {/* Botón eliminar */}
          <button
            onClick={handleDelete}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar película
          </button>
        </div>
      </div>
    </div>
  );
}

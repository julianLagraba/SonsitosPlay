'use client';

import { memo, useCallback } from 'react';
import { Movie, MovieStatus } from '@/types';
import { Star, Clock, CheckCircle, Eye, Trash2 } from 'lucide-react';

interface MovieCardProps {
  movie: Movie;
  onStatusChange: (id: number, status: MovieStatus) => void;
  onDelete: (id: number) => void;
  onClick: (movie: Movie) => void;
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
const RatingStars = memo(function RatingStars({ rating }: { rating: number }) {
  const stars = (rating / 10) * 5;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const fillPercentage = Math.min(1, Math.max(0, stars - (star - 1)));
        return (
          <div key={star} className="relative">
            <Star className="w-3 h-3 text-white/20" />
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fillPercentage * 100}%` }}
            >
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            </div>
          </div>
        );
      })}
    </div>
  );
});

const MovieCard = memo(function MovieCard({ movie, onStatusChange, onDelete, onClick }: MovieCardProps) {
  const config = statusConfig[movie.status];
  const StatusIcon = config.icon;

  const handleClick = useCallback(() => {
    onClick(movie);
  }, [onClick, movie]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('¿Eliminar este título?')) {
      onDelete(movie.id);
    }
  }, [onDelete, movie.id]);

  return (
    <div
      className="movie-card rounded-2xl overflow-hidden cursor-pointer"
      onClick={handleClick}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] w-full overflow-hidden">
        {movie.poster_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={movie.poster_url}
            alt={movie.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-surface-700 to-surface-800 flex items-center justify-center">
            <span className="text-4xl font-bold text-white/20">
              {movie.title.charAt(0)}
            </span>
          </div>
        )}

        {/* Status Badge */}
        <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium border ${config.color} backdrop-blur-sm`}>
          <StatusIcon className="w-3 h-3 inline mr-1" />
          {config.label}
        </div>

        {/* Delete Button */}
        <button
          onClick={handleDelete}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-red-500/80 transition-colors"
        >
          <Trash2 className="w-4 h-4 text-white" />
        </button>

        {/* Rating Badge - Estrellas + Número */}
        {movie.rating && (
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm">
              <RatingStars rating={movie.rating} />
              <span className="text-xs font-bold text-white">{movie.rating}/10</span>
            </div>
            {movie.genre && (
              <span className="px-2 py-1 rounded-full bg-purple-500/30 backdrop-blur-sm text-xs font-medium text-purple-300">
                {movie.genre}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content - Solo título y año */}
      <div className="p-3">
        <h3 className="font-semibold text-white text-sm leading-tight line-clamp-2">
          {movie.title}
        </h3>
        {movie.year && (
          <p className="text-xs text-white/50 mt-1">{movie.year}</p>
        )}
        {movie.type === 'series' && movie.current_season !== null && (
          <p className="text-xs font-medium text-accent mt-1">
            T{movie.current_season} E{movie.current_episode ?? 1}
          </p>
        )}
      </div>
    </div>
  );
});

export default MovieCard;

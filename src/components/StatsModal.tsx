'use client';

import { useMemo } from 'react';
import { Movie } from '@/types';
import {
  X,
  BarChart3,
  Film,
  Tv,
  Star,
  Clock,
  CheckCircle,
  Eye,
  TrendingUp,
} from 'lucide-react';

interface StatsModalProps {
  movies: Movie[];
  onClose: () => void;
}

export default function StatsModal({ movies, onClose }: StatsModalProps) {
  const stats = useMemo(() => {
    const isSeries = (movie: Movie) => movie.type === 'series';
    const movieList = movies.filter((movie) => !isSeries(movie));
    const seriesList = movies.filter(isSeries);
    const rated = movies.filter(
      (movie): movie is Movie & { rating: number } => movie.rating !== null
    );
    const average =
      rated.length > 0
        ? rated.reduce((total, movie) => total + movie.rating, 0) / rated.length
        : 0;

    const genreCounts = new Map<string, number>();
    for (const movie of movies) {
      if (!movie.genre) continue;
      genreCounts.set(movie.genre, (genreCounts.get(movie.genre) ?? 0) + 1);
    }

    const topGenres = Array.from(genreCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));
    const maxGenreCount = topGenres[0]?.count ?? 0;

    // Horas estimadas: películas completas + episodios vistos de series.
    let minutes = 0;
    for (const movie of movies) {
      if (!movie.runtime || movie.runtime <= 0) continue;

      if (movie.status === 'ya_vista') {
        minutes += isSeries(movie)
          ? (movie.total_episodes ?? 0) * movie.runtime
          : movie.runtime;
        continue;
      }

      if (
        movie.status === 'viendo' &&
        isSeries(movie) &&
        movie.total_seasons &&
        movie.total_episodes
      ) {
        const episodesPerSeason = movie.total_episodes / movie.total_seasons;
        const watchedEpisodes = Math.min(
          movie.total_episodes,
          Math.round(((movie.current_season ?? 1) - 1) * episodesPerSeason) +
            (movie.current_episode ?? 1)
        );
        minutes += Math.max(0, watchedEpisodes) * movie.runtime;
      }
    }

    const topRated = [...rated]
      .sort(
        (a, b) =>
          b.rating - a.rating || a.title.localeCompare(b.title, 'es')
      )
      .slice(0, 5);

    return {
      movieCount: movieList.length,
      seriesCount: seriesList.length,
      watchedMovies: movieList.filter((movie) => movie.status === 'ya_vista')
        .length,
      watchedSeries: seriesList.filter((movie) => movie.status === 'ya_vista')
        .length,
      ratedCount: rated.length,
      average,
      topGenres,
      maxGenreCount,
      minutes,
      topRated,
      watched: movies.filter((movie) => movie.status === 'ya_vista').length,
      watching: movies.filter((movie) => movie.status === 'viendo').length,
      pending: movies.filter((movie) => movie.status === 'para_ver').length,
    };
  }, [movies]);

  const totalHours = stats.minutes / 60;
  const hoursLabel =
    totalHours >= 10 ? Math.round(totalHours).toString() : totalHours.toFixed(1);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <div
        className="glass-strong rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto fade-in safe-area-bottom"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-accent" />
                Estadísticas
              </h2>
              <p className="text-sm text-white/50 mt-1">
                Tu colección en números
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              aria-label="Cerrar estadísticas"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {movies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BarChart3 className="w-12 h-12 text-white/20 mb-3" />
              <p className="text-white/50">Todavía no hay datos para mostrar.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Números principales */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <div className="flex items-center gap-2 text-accent mb-2">
                    <Film className="w-4 h-4" />
                    <span className="text-xs font-medium text-white/60">
                      Películas
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {stats.movieCount}
                  </p>
                  <p className="text-xs text-white/40 mt-1">
                    {stats.watchedMovies} vistas
                  </p>
                </div>

                <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <div className="flex items-center gap-2 text-accent mb-2">
                    <Tv className="w-4 h-4" />
                    <span className="text-xs font-medium text-white/60">
                      Series
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {stats.seriesCount}
                  </p>
                  <p className="text-xs text-white/40 mt-1">
                    {stats.watchedSeries} terminadas
                  </p>
                </div>

                <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <div className="flex items-center gap-2 text-yellow-400 mb-2">
                    <Star className="w-4 h-4" />
                    <span className="text-xs font-medium text-white/60">
                      Promedio
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {stats.average > 0 ? stats.average.toFixed(1) : '—'}
                    {stats.average > 0 && (
                      <span className="text-sm font-normal text-white/40">
                        /10
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-white/40 mt-1">
                    {stats.ratedCount} puntuadas
                  </p>
                </div>

                <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <div className="flex items-center gap-2 text-blue-400 mb-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-medium text-white/60">
                      Horas
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {hoursLabel}
                    <span className="text-sm font-normal text-white/40"> h</span>
                  </p>
                  <p className="text-xs text-white/40 mt-1">
                    tiempo estimado visto
                  </p>
                </div>
              </div>

              {/* Estado de la lista */}
              <div>
                <h3 className="text-sm font-medium text-white/60 mb-2">
                  Estado de la lista
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3 text-center">
                    <Eye className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-white">
                      {stats.pending}
                    </p>
                    <p className="text-[11px] text-white/40">Para ver</p>
                  </div>
                  <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-3 text-center">
                    <TrendingUp className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-white">
                      {stats.watching}
                    </p>
                    <p className="text-[11px] text-white/40">Viendo</p>
                  </div>
                  <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3 text-center">
                    <CheckCircle className="w-4 h-4 text-green-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-white">
                      {stats.watched}
                    </p>
                    <p className="text-[11px] text-white/40">Terminadas</p>
                  </div>
                </div>
              </div>

              {/* Géneros */}
              {stats.topGenres.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-white/60 mb-3">
                    Géneros favoritos
                  </h3>
                  <div className="space-y-2.5">
                    {stats.topGenres.map((genre) => (
                      <div key={genre.name}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-white/70">{genre.name}</span>
                          <span className="text-white/40">{genre.count}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-accent"
                            style={{
                              width: `${
                                stats.maxGenreCount > 0
                                  ? (genre.count / stats.maxGenreCount) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mejor puntuadas */}
              {stats.topRated.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    Mejor puntuadas
                  </h3>
                  <div className="space-y-2">
                    {stats.topRated.map((movie, index) => (
                      <div
                        key={movie.id}
                        className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-3 py-2"
                      >
                        <span className="w-5 text-center text-sm font-bold text-white/30">
                          {index + 1}
                        </span>
                        {movie.type === 'series' ? (
                          <Tv className="w-4 h-4 text-accent flex-shrink-0" />
                        ) : (
                          <Film className="w-4 h-4 text-accent flex-shrink-0" />
                        )}
                        <span className="flex-1 text-sm text-white/80 truncate">
                          {movie.title}
                        </span>
                        <span className="flex items-center gap-1 text-sm font-bold text-yellow-400">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          {movie.rating}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[10px] text-white/25 text-center pt-2">
                Las horas son una estimación según la duración de cada título.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

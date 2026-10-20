'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Movie, MovieStatus } from '@/types';
import MovieCard from '@/components/MovieCard';
import MovieModal from '@/components/MovieModal';
import SearchBar from '@/components/SearchBar';
import FilterButtons, { FilterType } from '@/components/FilterButtons';
import RussianRoulette from '@/components/RussianRoulette';
import AddMovieModal from '@/components/AddMovieModal';
import { Plus, Dices, Film } from 'lucide-react';

export default function Home() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [showRoulette, setShowRoulette] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Último estado conocido, para poder revertir cambios optimistas si falla la red.
  const moviesRef = useRef<Movie[]>([]);
  useEffect(() => {
    moviesRef.current = movies;
  }, [movies]);

  const fetchMovies = useCallback(async () => {
    try {
      const response = await fetch('/api/movies', { cache: 'no-store' });
      if (!response.ok) throw new Error('No se pudieron cargar las películas');
      const data = await response.json();
      setMovies(data.movies ?? []);
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  const updateMovieLocally = useCallback((id: number, patch: Partial<Movie>) => {
    setMovies((current) =>
      current.map((movie) => (movie.id === id ? { ...movie, ...patch } : movie))
    );
  }, []);

  // La película abierta se deriva del estado: el modal se actualiza solo.
  const selectedMovie = useMemo(
    () =>
      selectedMovieId === null
        ? null
        : movies.find((movie) => movie.id === selectedMovieId) ?? null,
    [movies, selectedMovieId]
  );

  const counts = useMemo(
    () => ({
      all: movies.length,
      para_ver: movies.filter((movie) => movie.status === 'para_ver').length,
      viendo: movies.filter((movie) => movie.status === 'viendo').length,
      ya_vista: movies.filter((movie) => movie.status === 'ya_vista').length,
    }),
    [movies]
  );

  const filteredMovies = useMemo(() => {
    let result = movies;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((movie) => movie.title.toLowerCase().includes(query));
    }

    if (activeFilter === 'all') {
      // Show all
    } else if (activeFilter.startsWith('rating_')) {
      const rating = parseInt(activeFilter.split('_')[1], 10);
      // La nota es de 1 a 10 y los filtros muestran 1 a 5 estrellas.
      result = result.filter(
        (movie) =>
          movie.rating !== null && Math.round(movie.rating / 2) === rating
      );
    } else {
      result = result.filter((movie) => movie.status === activeFilter);
    }

    return result;
  }, [movies, searchQuery, activeFilter]);

  const handleOpenMovie = useCallback((movie: Movie) => {
    setSelectedMovieId(movie.id);
  }, []);

  const handleStatusChange = useCallback(
    async (id: number, status: MovieStatus) => {
      const previous = moviesRef.current.find((movie) => movie.id === id);
      // Cambio optimista: se ve al instante en la tarjeta y en el modal.
      updateMovieLocally(id, { status });

      try {
        const response = await fetch(`/api/movies/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });

        if (!response.ok) {
          throw new Error('No se pudo actualizar el estado');
        }
      } catch (error) {
        if (previous) {
          updateMovieLocally(id, { status: previous.status });
        }
        throw error;
      }
    },
    [updateMovieLocally]
  );

  const handleReviewSubmit = useCallback(
    async (id: number, rating: number, review: string) => {
      const previous = moviesRef.current.find((movie) => movie.id === id);
      updateMovieLocally(id, { rating, review, status: 'ya_vista' });

      try {
        const response = await fetch(`/api/movies/${id}/review`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating, review }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || 'No se pudo guardar la reseña');
        }

        if (data.movie) {
          updateMovieLocally(id, data.movie);
        }
      } catch (error) {
        if (previous) {
          updateMovieLocally(id, {
            rating: previous.rating,
            review: previous.review,
            status: previous.status,
          });
        }
        throw error;
      }
    },
    [updateMovieLocally]
  );

  const handleAddMovie = useCallback(
    async (movieData: {
      title: string;
      year?: number | null;
      synopsis?: string | null;
      poster_url?: string | null;
      genre?: string | null;
    }) => {
      const response = await fetch('/api/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movieData),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Error al agregar película');
      }

      if (data.movie) {
        setMovies((current) => [
          data.movie,
          ...current.filter((movie) => movie.id !== data.movie.id),
        ]);
      } else {
        await fetchMovies();
      }
    },
    [fetchMovies]
  );

  const handleDeleteMovie = useCallback(async (id: number) => {
    const previous = moviesRef.current;
    setMovies((current) => current.filter((movie) => movie.id !== id));
    setSelectedMovieId((current) => (current === id ? null : current));

    try {
      const response = await fetch(`/api/movies/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Error al eliminar película');
      }
    } catch (error) {
      setMovies(previous);
      alert('No se pudo eliminar la película. Revisá tu conexión.');
    }
  }, []);

  const handleRouletteSpin = useCallback(async (): Promise<Movie | null> => {
    try {
      const response = await fetch('/api/roulette', { method: 'POST' });
      const data = await response.json();
      return data.movie ?? null;
    } catch (error) {
      console.error('Error with roulette:', error);
      return null;
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-900">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-strong safe-area-top">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/favicon.png"
                alt="SonsitosPlay"
                className="w-14 h-14 rounded-xl object-cover"
              />
              <div>
                <h1 className="text-xl font-bold text-white">SonsitosPlay</h1>
                <p className="text-xs text-white/50">{counts.all} películas en tu lista</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRoulette(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 transition-colors"
              >
                <Dices className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">Ruleta</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white hover:bg-accent-hover transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">Agregar</span>
              </button>
            </div>
          </div>

          {/* Search */}
          <SearchBar value={searchQuery} onChange={setSearchQuery} />

          {/* Filters */}
          <div className="mt-4">
            <FilterButtons
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              counts={counts}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24">
        {filteredMovies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Film className="w-8 h-8 text-white/20" />
            </div>
            <h3 className="text-lg font-medium text-white/60 mb-2">
              {searchQuery ? 'No se encontraron películas' : 'Tu lista está vacía'}
            </h3>
            <p className="text-sm text-white/40 max-w-xs">
              {searchQuery
                ? 'Intenta con otro término de búsqueda'
                : 'Agrega películas para comenzar a organizar tu lista'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onStatusChange={handleStatusChange}
                onDelete={handleDeleteMovie}
                onClick={handleOpenMovie}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Action Button (Mobile) */}
      <div className="fixed bottom-6 right-6 z-30 sm:hidden safe-area-bottom">
        <button
          onClick={() => setShowAddModal(true)}
          className="w-14 h-14 rounded-full bg-accent text-white shadow-lg shadow-accent/30 flex items-center justify-center hover:bg-accent-hover transition-colors"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Modals */}
      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          onClose={() => setSelectedMovieId(null)}
          onStatusChange={handleStatusChange}
          onReviewSubmit={handleReviewSubmit}
          onDelete={handleDeleteMovie}
        />
      )}

      {showRoulette && (
        <RussianRoulette
          onSpin={handleRouletteSpin}
          onClose={() => setShowRoulette(false)}
        />
      )}

      {showAddModal && (
        <AddMovieModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddMovie}
        />
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { TMDBMovie } from '@/types';
import {
  X,
  Search,
  Plus,
  Loader2,
  Film,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const genreMap: Record<number, string> = {
  28: 'Acción',
  12: 'Aventura',
  16: 'Animación',
  35: 'Comedia',
  80: 'Crimen',
  99: 'Documental',
  18: 'Drama',
  10751: 'Familiar',
  14: 'Fantasía',
  36: 'Historia',
  27: 'Terror',
  10402: 'Música',
  9648: 'Misterio',
  10749: 'Romance',
  878: 'Ciencia Ficción',
  10770: 'Película de TV',
  53: 'Suspenso',
  10752: 'Guerra',
  37: 'Western',
};

function getGenreName(genreId: number): string | null {
  return genreMap[genreId] || null;
}

interface AddMovieModalProps {
  onClose: () => void;
  onAdd: (movie: {
    title: string;
    year?: number | null;
    synopsis?: string | null;
    poster_url?: string | null;
    genre?: string | null;
  }) => Promise<void>;
}

export default function AddMovieModal({ onClose, onAdd }: AddMovieModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TMDBMovie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);
  const [manualTitle, setManualTitle] = useState('');
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [apiError, setApiError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Si ya hay una película elegida no hace falta seguir buscando.
    if (selectedMovie) {
      setResults([]);
      return;
    }

    if (query.length < 2) {
      setResults([]);
      setApiConnected(null);
      setApiError('');
      return;
    }

    const debounce = setTimeout(async () => {
      setIsLoading(true);
      setApiError('');

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();

        setApiConnected(data.connected);
        setApiError(data.error || '');
        setResults(data.results || []);
      } catch (error) {
        setApiConnected(false);
        setApiError('Error de conexión');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [query, selectedMovie]);

  const handleSelectTMDBMovie = (movie: TMDBMovie) => {
    setSelectedMovie(movie);
    setQuery(movie.title);
    setResults([]);
    setManualTitle('');
    setErrorMessage('');
  };

  const handleClearSelection = () => {
    setSelectedMovie(null);
    setQuery('');
    setManualTitle('');
    setResults([]);
    setErrorMessage('');
  };

  const handleManualChange = (value: string) => {
    setManualTitle(value);
    setSelectedMovie(null);
    setQuery('');
    setResults([]);
    setErrorMessage('');
  };

  const canAdd = Boolean(selectedMovie || manualTitle.trim());

  const handleAdd = async () => {
    if (isSaving || !canAdd) return;

    const payload = selectedMovie
      ? {
          title: selectedMovie.title,
          year: selectedMovie.release_date
            ? parseInt(selectedMovie.release_date.split('-')[0], 10)
            : null,
          synopsis: selectedMovie.overview || null,
          poster_url: selectedMovie.poster_path
            ? `https://image.tmdb.org/t/p/w500${selectedMovie.poster_path}`
            : null,
          genre: selectedMovie.genre_ids
            ? getGenreName(selectedMovie.genre_ids[0])
            : null,
        }
      : { title: manualTitle.trim() };

    setIsSaving(true);
    setErrorMessage('');

    try {
      await onAdd(payload);
      onClose();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'No se pudo agregar la película.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80">
      <div className="glass-strong rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto fade-in safe-area-bottom">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Agregar película</h2>
            <div className="flex items-center gap-2 mt-1">
              {apiConnected === null ? (
                <>
                  <div className="w-3 h-3 rounded-full bg-white/20 animate-pulse" />
                  <span className="text-xs text-white/40">Escribe para buscar</span>
                </>
              ) : apiConnected ? (
                <>
                  <Wifi className="w-3 h-3 text-green-400" />
                  <span className="text-xs text-green-400">TMDB conectado</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-yellow-400" />
                  <span className="text-xs text-yellow-400">Sin conexión</span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {selectedMovie ? (
          /* Película seleccionada: feedback claro antes de guardar */
          <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-3 mb-4 fade-in">
            <div className="flex items-center gap-3">
              <div className="w-12 h-16 rounded-lg bg-surface-700 flex-shrink-0 overflow-hidden">
                {selectedMovie.poster_path ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`https://image.tmdb.org/t/p/w92${selectedMovie.poster_path}`}
                    alt={selectedMovie.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20 font-bold">
                    {selectedMovie.title.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="flex items-center gap-1.5 text-xs font-medium text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  Seleccionada
                </p>
                <p className="font-medium text-white truncate">{selectedMovie.title}</p>
                <p className="text-sm text-white/50">
                  {selectedMovie.release_date?.split('-')[0] || 'Sin año'}
                </p>
              </div>
              <button
                onClick={handleClearSelection}
                disabled={isSaving}
                className="text-xs text-white/60 hover:text-white underline flex-shrink-0 disabled:opacity-50"
              >
                Cambiar
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedMovie(null);
                }}
                placeholder="Buscar cualquier película..."
                className="w-full pl-12 pr-4 py-3 rounded-2xl glass text-white placeholder:text-white/40 focus:outline-none focus:border-accent/50"
                autoFocus
              />
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-accent animate-spin" />
              </div>
            )}

            {/* No results */}
            {query.length >= 2 && !isLoading && results.length === 0 && (
              <div className="text-center py-8">
                <Film className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/50">
                  {apiConnected ? 'No se encontraron resultados' : 'No hay conexión con TMDB'}
                </p>
                <p className="text-sm text-white/30 mt-1">
                  {apiConnected
                    ? 'Intenta con otro título'
                    : apiError || 'Verifica tu API key en .env.local'}
                </p>
              </div>
            )}

            {/* Results */}
            {results.length > 0 && (
              <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                {results.map((movie) => (
                  <button
                    key={movie.id}
                    onClick={() => handleSelectTMDBMovie(movie)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl glass hover:bg-white/10 transition-colors text-left"
                  >
                    <div className="w-12 h-16 rounded-lg bg-surface-700 flex-shrink-0 overflow-hidden">
                      {movie.poster_path ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                          alt={movie.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/20 font-bold">
                          {movie.title.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{movie.title}</p>
                      <p className="text-sm text-white/50">
                        {movie.release_date?.split('-')[0] || 'Sin año'}
                      </p>
                    </div>
                    <Plus className="w-5 h-5 text-accent flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {/* Manual Input */}
            <div className="border-t border-white/10 pt-4 mt-4">
              <label className="text-sm text-white/50 mb-2 block">
                O ingresa el título manualmente:
              </label>
              <input
                type="text"
                value={manualTitle}
                onChange={(e) => handleManualChange(e.target.value)}
                placeholder="Título de la película"
                className="w-full px-4 py-3 rounded-2xl glass text-white placeholder:text-white/40 focus:outline-none focus:border-accent/50"
              />
            </div>
          </>
        )}

        {errorMessage && (
          <p className="mt-4 flex items-start gap-1.5 text-sm text-red-400 fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {errorMessage}
          </p>
        )}

        {/* Add Button */}
        <button
          onClick={handleAdd}
          disabled={!canAdd || isSaving}
          className={`w-full mt-6 py-3 rounded-2xl font-semibold text-white transition-all flex items-center justify-center gap-2 ${
            canAdd && !isSaving
              ? 'bg-accent hover:bg-accent-hover'
              : 'bg-white/10 cursor-not-allowed text-white/50'
          }`}
        >
          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSaving
            ? 'Guardando...'
            : canAdd
              ? 'Agregar a la lista'
              : 'Elegí o escribí una película'}
        </button>
      </div>
    </div>
  );
}

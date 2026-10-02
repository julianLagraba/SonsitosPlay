'use client';

import { useState } from 'react';
import { Movie } from '@/types';
import { Dices, X } from 'lucide-react';

interface RussianRouletteProps {
  onSpin: () => Promise<Movie | null>;
  onClose: () => void;
}

export default function RussianRoulette({ onSpin, onClose }: RussianRouletteProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<Movie | null>(null);

  const handleSpin = async () => {
    setIsSpinning(true);
    setResult(null);

    // Simulate spinning delay for effect
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const movie = await onSpin();
    setResult(movie);
    setIsSpinning(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-strong rounded-3xl p-8 max-w-sm w-full text-center space-y-6 fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Ruleta Rusa</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {isSpinning && (
          <div className="py-8">
            <div className="w-20 h-20 mx-auto rounded-full bg-accent/20 flex items-center justify-center roulette-spinning">
              <Dices className="w-10 h-10 text-accent" />
            </div>
            <p className="mt-4 text-white/60 animate-pulse">Girando la ruleta...</p>
          </div>
        )}

        {result && !isSpinning && (
          <div className="space-y-4 fade-in">
            <div className="w-32 h-48 mx-auto rounded-xl overflow-hidden bg-surface-700">
              {result.poster_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={result.poster_url}
                  alt={result.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white/20">
                  {result.title.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{result.title}</h3>
              {result.year && (
                <p className="text-white/50">{result.year}</p>
              )}
            </div>
            <p className="text-sm text-white/60">
              ¡Es tu película! Ahora puedes marcarla como &quot;Viendo&quot;.
            </p>
          </div>
        )}

        {!isSpinning && !result && (
          <div className="py-8">
            <div className="w-20 h-20 mx-auto rounded-full bg-accent/20 flex items-center justify-center">
              <Dices className="w-10 h-10 text-accent" />
            </div>
            <p className="mt-4 text-white/60">
              ¿No sabes qué ver? ¡Deja que la ruleta decida por ti!
            </p>
          </div>
        )}

        <button
          onClick={handleSpin}
          disabled={isSpinning}
          className={`w-full py-3 rounded-2xl font-semibold text-white transition-all ${
            isSpinning
              ? 'bg-white/10 cursor-not-allowed'
              : 'bg-accent hover:bg-accent-hover pulse-glow'
          }`}
        >
          {isSpinning ? 'Girando...' : '¡Girar la ruleta!'}
        </button>
      </div>
    </div>
  );
}

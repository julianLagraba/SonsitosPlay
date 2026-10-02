'use client';

import { memo, useCallback } from 'react';
import { MovieStatus } from '@/types';
import { LayoutGrid, Clock, Eye, CheckCircle, Star } from 'lucide-react';

export type FilterType = 'all' | MovieStatus | 'rating_1' | 'rating_2' | 'rating_3' | 'rating_4' | 'rating_5';

interface FilterButtonsProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  counts: {
    all: number;
    para_ver: number;
    viendo: number;
    ya_vista: number;
  };
}

const filters: { key: FilterType; label: string; icon: React.ElementType }[] = [
  { key: 'all', label: 'Todas', icon: LayoutGrid },
  { key: 'para_ver', label: 'Para ver', icon: Clock },
  { key: 'viendo', label: 'Viendo', icon: Eye },
  { key: 'ya_vista', label: 'Vistas', icon: CheckCircle },
  { key: 'rating_5', label: '5★', icon: Star },
  { key: 'rating_4', label: '4★', icon: Star },
  { key: 'rating_3', label: '3★', icon: Star },
  { key: 'rating_2', label: '2★', icon: Star },
  { key: 'rating_1', label: '1★', icon: Star },
];

function FilterButtons({ activeFilter, onFilterChange, counts }: FilterButtonsProps) {
  const getCount = useCallback((key: FilterType): number | null => {
    if (key === 'all') return counts.all;
    if (key === 'para_ver') return counts.para_ver;
    if (key === 'viendo') return counts.viendo;
    if (key === 'ya_vista') return counts.ya_vista;
    return null;
  }, [counts]);

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
      {filters.map((filter) => {
        const Icon = filter.icon;
        const count = getCount(filter.key);
        const isActive = activeFilter === filter.key;

        return (
          <button
            key={filter.key}
            onClick={() => onFilterChange(filter.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              isActive
                ? 'bg-accent text-white shadow-lg shadow-accent/25'
                : 'glass text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{filter.label}</span>
            {count !== null && (
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                isActive ? 'bg-white/20' : 'bg-white/10'
              }`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default memo(FilterButtons);

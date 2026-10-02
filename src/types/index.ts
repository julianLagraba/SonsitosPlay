export type MovieStatus = 'para_ver' | 'viendo' | 'ya_vista';

export interface Movie {
  id: number;
  title: string;
  year: number | null;
  synopsis: string | null;
  poster_url: string | null;
  genre: string | null;
  status: MovieStatus;
  rating: number | null; // 1-10
  review: string | null;
  created_at: string;
  updated_at: string;
}

export interface MovieInput {
  title: string;
  year?: number | null;
  synopsis?: string | null;
  poster_url?: string | null;
  genre?: string | null;
  status?: MovieStatus;
}

export interface ReviewInput {
  rating: number;
  review: string;
}

export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  genre_ids?: number[];
}

export interface TMDBResponse {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

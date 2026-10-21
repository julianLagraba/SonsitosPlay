export type MovieStatus = 'para_ver' | 'viendo' | 'ya_vista';
export type MediaType = 'movie' | 'series';

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
  type: MediaType;
  tmdb_id: number | null;
  runtime: number | null; // minutos (película) o por episodio (serie)
  total_seasons: number | null;
  total_episodes: number | null;
  current_season: number | null;
  current_episode: number | null;
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
  type?: MediaType;
  tmdb_id?: number | null;
  runtime?: number | null;
  total_seasons?: number | null;
  total_episodes?: number | null;
  current_season?: number | null;
  current_episode?: number | null;
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
  media_type?: MediaType;
  popularity?: number;
}

export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
}

export interface WatchProviders {
  link: string | null;
  flatrate: WatchProvider[];
  free: WatchProvider[];
  ads: WatchProvider[];
  rent: WatchProvider[];
  buy: WatchProvider[];
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface SeasonInfo {
  season_number: number;
  episode_count: number;
}

export interface MediaDetails {
  tmdb_id: number;
  type: MediaType;
  runtime: number | null;
  total_seasons: number | null;
  total_episodes: number | null;
  seasons: SeasonInfo[];
  trailer_key: string | null;
  cast: CastMember[];
  providers: WatchProviders | null;
}

export interface TMDBResponse {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

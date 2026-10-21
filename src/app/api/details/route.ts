import { NextResponse } from 'next/server';
import { CastMember, MediaDetails, MediaType, SeasonInfo, WatchProvider } from '@/types';

const TMDB_API_KEY = process.env.TMDB_API_KEY || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const REGION = 'AR';

interface RawProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
}

interface RawSeason {
  season_number: number;
  episode_count: number;
}

interface RawDetails {
  runtime?: number | null;
  episode_run_time?: number[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: RawSeason[];
  videos?: {
    results?: Array<{ key: string; site: string; type: string; official?: boolean }>;
  };
  credits?: {
    cast?: Array<{ id: number; name: string; character?: string; profile_path: string | null }>;
  };
  aggregate_credits?: {
    cast?: Array<{
      id: number;
      name: string;
      character?: string;
      roles?: Array<{ character?: string }>;
      profile_path: string | null;
    }>;
  };
}

interface RawProvidersResponse {
  results?: Record<
    string,
    {
      link?: string;
      flatrate?: RawProvider[];
      free?: RawProvider[];
      ads?: RawProvider[];
      rent?: RawProvider[];
      buy?: RawProvider[];
    }
  >;
}

function mapProviders(list?: RawProvider[]): WatchProvider[] {
  return (list ?? []).map((provider) => ({
    provider_id: provider.provider_id,
    provider_name: provider.provider_name,
    logo_path: provider.logo_path ?? null,
  }));
}

async function getJson<T>(url: string, retries = 1): Promise<T> {
  const response = await fetch(url, { next: { revalidate: 86400 } });
  if (!response.ok) {
    // TMDB a veces devuelve 401 transitorios; reintentamos una vez.
    if (response.status === 401 && retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      return getJson<T>(url, retries - 1);
    }
    throw new Error(`TMDB respondió ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get('type');
  const type: MediaType | null =
    typeParam === 'movie' || typeParam === 'series' ? typeParam : null;
  const id = parseInt(searchParams.get('id') || '', 10);

  if (!type || !Number.isInteger(id) || id <= 0) {
    return NextResponse.json(
      { error: 'Parámetros inválidos: se requiere type=movie|series e id' },
      { status: 400 }
    );
  }

  if (!TMDB_API_KEY) {
    return NextResponse.json(
      { error: 'TMDB_API_KEY no configurada' },
      { status: 500 }
    );
  }

  const mediaPath = type === 'series' ? 'tv' : 'movie';
  const baseParams = `api_key=${TMDB_API_KEY}&language=es-AR`;

  try {
    const [details, providersResponse] = await Promise.all([
      getJson<RawDetails>(
        `${TMDB_BASE_URL}/${mediaPath}/${id}?${baseParams}&append_to_response=videos,credits,aggregate_credits`
      ),
      getJson<RawProvidersResponse>(
        `${TMDB_BASE_URL}/${mediaPath}/${id}/watch/providers?${baseParams}`
      ),
    ]);

    const videos = details.videos?.results ?? [];
    const trailer =
      videos.find((video) => video.site === 'YouTube' && video.type === 'Trailer') ??
      videos.find((video) => video.site === 'YouTube' && video.type === 'Teaser') ??
      null;

    const rawCast: Array<{
      id: number;
      name: string;
      character?: string;
      roles?: Array<{ character?: string }>;
      profile_path: string | null;
    }> =
      type === 'series'
        ? details.aggregate_credits?.cast ?? details.credits?.cast ?? []
        : details.credits?.cast ?? [];

    const cast: CastMember[] = rawCast.slice(0, 12).map((member) => ({
      id: member.id,
      name: member.name,
      character:
        member.character ?? member.roles?.[0]?.character ?? '',
      profile_path: member.profile_path ?? null,
    }));

    const seasons: SeasonInfo[] = (details.seasons ?? [])
      .filter((season) => season.season_number > 0)
      .map((season) => ({
        season_number: season.season_number,
        episode_count: season.episode_count,
      }))
      .sort((a, b) => a.season_number - b.season_number);

    const totalEpisodes =
      type === 'series'
        ? seasons.length > 0
          ? seasons.reduce((total, season) => total + season.episode_count, 0)
          : details.number_of_episodes ?? null
        : null;

    const runtime =
      type === 'series'
        ? details.episode_run_time?.[0] ?? null
        : details.runtime ?? null;

    const region = providersResponse.results?.[REGION];
    const providers = region
      ? {
          link: region.link ?? null,
          flatrate: mapProviders(region.flatrate),
          free: mapProviders(region.free),
          ads: mapProviders(region.ads),
          rent: mapProviders(region.rent),
          buy: mapProviders(region.buy),
        }
      : null;

    const data: MediaDetails = {
      tmdb_id: id,
      type,
      runtime,
      total_seasons:
        type === 'series' ? details.number_of_seasons ?? seasons.length : null,
      total_episodes: totalEpisodes,
      seasons,
      trailer_key: trailer?.key ?? null,
      cast,
      providers,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching TMDB details:', error);
    return NextResponse.json(
      { error: 'No se pudieron obtener los detalles de TMDB' },
      { status: 502 }
    );
  }
}

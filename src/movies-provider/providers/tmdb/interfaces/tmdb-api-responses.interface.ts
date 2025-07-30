/**
 * TMDB API response for a single movie
 */
export interface TmdbMovieResponse {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
  original_title: string;
  video: boolean;
}

/**
 * TMDB API response for a list of movies
 */
export interface TmdbMoviesResponse {
  page: number;
  results: TmdbMovieResponse[];
  total_pages: number;
  total_results: number;
}

/**
 * TMDB API response for a single genre
 */
export interface TmdbGenreResponse {
  id: number;
  name: string;
}

/**
 * TMDB API response for a list of genres
 */
export interface TmdbGenresResponse {
  genres: TmdbGenreResponse[];
}
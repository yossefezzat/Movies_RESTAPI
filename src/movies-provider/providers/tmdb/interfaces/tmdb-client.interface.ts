import { Genre } from '../models/genre.model';
import { MoviesClientList } from '../models/movies-client-list.model';

/**
 * Interface for TMDB API client
 */
export interface TmdbClientInterface {
  /**
   * Fetches a list of movie genres from TMDB API
   * @returns Promise with an array of Genre objects
   */
  getGenres(): Promise<Genre[]>;

  /**
   * Fetches a list of movies from TMDB API
   * @param page The page number to fetch (default: 1)
   * @returns Promise with MoviesClientList containing movies, pagination info
   */
  getMovies(page?: number): Promise<MoviesClientList>;
}
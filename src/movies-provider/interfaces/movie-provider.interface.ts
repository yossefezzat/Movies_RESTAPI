import { Genre } from '../providers/tmdb/models/genre.model';
import { MoviesClientList } from '../providers/tmdb/models/movies-client-list.model';

/**
 * Interface for movie data providers
 */
export interface MovieProviderInterface {
  /**
   * Gets the provider name
   */
  getProviderName(): string;

  /**
   * Fetches a list of movie genres
   * @returns Promise with an array of Genre objects
   */
  getGenres(): Promise<Genre[]>;

  /**
   * Fetches a list of movies
   * @param page The page number to fetch (default: 1)
   * @returns Promise with MoviesClientList containing movies, pagination info
   */
  getMovies(page?: number): Promise<MoviesClientList>;
}
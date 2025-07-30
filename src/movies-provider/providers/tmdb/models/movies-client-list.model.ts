import { Movie } from './movie.model';

/**
 * Represents a paginated list of movies
 */
export interface MoviesClientList {
  /**
   * Array of movies in the current page
   */
  movies: Movie[];

  /**
   * Current page number
   */
  currentPage: number;

  /**
   * Total number of available pages
   */
  totalPages: number;
}
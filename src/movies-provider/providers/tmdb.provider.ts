import { Injectable, Inject } from '@nestjs/common';
import { MovieProviderInterface } from '../interfaces/movie-provider.interface';
import { TmdbClientInterface } from './tmdb/interfaces/tmdb-client.interface';
import { Genre } from './tmdb/models/genre.model';
import { MoviesClientList } from './tmdb/models/movies-client-list.model';

@Injectable()
export class TmdbProvider implements MovieProviderInterface {
  constructor(
    @Inject('TmdbClientInterface')
    private readonly tmdbClient: TmdbClientInterface,
  ) {}

  /**
   * Gets the provider name
   */
  getProviderName(): string {
    return 'tmdb';
  }

  /**
   * Fetches a list of movie genres from TMDB API
   * @returns Promise with an array of Genre objects
   */
  async getGenres(): Promise<Genre[]> {
    return this.tmdbClient.getGenres();
  }

  /**
   * Fetches a list of movies from TMDB API
   * @param page The page number to fetch (default: 1)
   * @returns Promise with MoviesClientList containing movies, pagination info
   */
  async getMovies(page: number = 1): Promise<MoviesClientList> {
    return this.tmdbClient.getMovies(page);
  }
}
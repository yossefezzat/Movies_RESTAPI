import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, retry, catchError } from 'rxjs';
import { TmdbClientInterface } from '../interfaces/tmdb-client.interface';
import { Genre } from '../models/genre.model';
import { Movie } from '../models/movie.model';
import { MoviesClientList } from '../models/movies-client-list.model';
import { TmdbGenresResponse, TmdbMovieResponse, TmdbMoviesResponse } from '../interfaces/tmdb-api-responses.interface';

@Injectable()
export class TmdbClientService implements TmdbClientInterface {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService, private readonly httpService: HttpService) {
    const baseUrl = this.configService.get<string>('TMDB_API_URL');
    if (!baseUrl) {
      throw new Error('TMDB_API_URL is not defined in configuration');
    }
    this.baseUrl = baseUrl;
    const apiKey = this.configService.get<string>('TMDB_API_KEY');
    if (!apiKey) {
      throw new Error('TMDB_API_KEY is not defined in configuration');
    }
    this.apiKey = apiKey;
  }

  /**
   * Fetches a list of movie genres from TMDB API
   * @returns Promise with an array of Genre objects
   */
  async getGenres(): Promise<Genre[]> {
    const url = `${this.baseUrl}/genre/movie/list`;

    try {
      const response = await firstValueFrom(
        this.httpService
          .get<TmdbGenresResponse>(url, {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              accept: 'application/json',
            },
          })
          .pipe(
            retry({ count: 3, delay: 1000 }),
            catchError((error) => {
              console.error('HTTP request failed for genres:', error.message);
              throw error;
            }),
          ),
      );

      return response.data.genres.map((genre) => ({
        id: genre.id,
        name: genre.name,
      }));
    } catch (error) {
      console.error('Error fetching genres:', error.message);
      throw new Error(`Failed to fetch genres: ${error.message}`);
    }
  }

  /**
   * Fetches a list of movies from TMDB API
   * @param page The page number to fetch (default: 1)
   * @returns Promise with MoviesClientList containing movies, pagination info
   */
  async getMovies(page = 1): Promise<MoviesClientList> {
    const url = `${this.baseUrl}/movie/popular?language=en-US&page=${page}`;

    try {
      const response = await firstValueFrom(
        this.httpService
          .get<TmdbMoviesResponse>(url, {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              accept: 'application/json',
            },
          })
          .pipe(
            retry({ count: 3, delay: 1000 }),
            catchError((error) => {
              console.error(`HTTP request failed for page ${page}:`, error.message);
              throw error;
            }),
          ),
      );

      return {
        movies: this.formatMovies(response.data.results),
        currentPage: response.data.page,
        totalPages: response.data.total_pages,
      };
    } catch (error) {
      console.error('Error fetching movies:', error.message);
      throw new Error(`Failed to fetch movies: ${error.message}`);
    }
  }

  /**
   * Formats TMDB movie responses into our Movie model
   * @param tmdbMovies Array of TMDB movie response objects
   * @returns Array of formatted Movie objects
   */
  private formatMovies(tmdbMovies: TmdbMovieResponse[]): Movie[] {
    return tmdbMovies.map(({ genre_ids, ...movie }) => ({
      adult: movie.adult ?? null,
      backdropPath: movie.backdrop_path ?? null,
      tmdbId: movie.id ?? null,
      originalLanguage: movie.original_language ?? null,
      originalTitle: movie.original_title ?? null,
      overview: movie.overview ?? null,
      popularity: movie.popularity ?? null,
      posterPath: movie.poster_path ?? null,
      releaseDate: movie.release_date || null,
      title: movie.title ?? null,
      video: movie.video ?? null,
      voteAverage: movie.vote_average ?? null,
      voteCount: movie.vote_count ?? null,
      genres: genre_ids ?? null,
    }));
  }
}

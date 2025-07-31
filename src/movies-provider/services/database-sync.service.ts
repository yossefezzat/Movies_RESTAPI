import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { MoviesProviderService } from './movies-provider.service';
import { Movie } from '../../movies/entities/movie.entity';
import { Genre } from '../../movies/entities/genre.entity';
import { Genre as GenreModel } from '../providers/tmdb/models/genre.model';
import { Movie as MovieModel } from '../providers/tmdb/models/movie.model';

export interface SyncResult {
  success: boolean;
  message: string;
  data?: {
    newGenres?: number;
    newMovies?: number;
    totalProcessed?: number;
  };
}

@Injectable()
export class DatabaseSyncService {
  constructor(
    private readonly configService: ConfigService,
    private readonly moviesProviderService: MoviesProviderService,
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
  ) {}

  /**
   * Synchronizes genres from the external provider to the database
   * @returns Promise with sync result
   */
  async syncGenres(): Promise<SyncResult> {
    try {
      const genres = await this.moviesProviderService.getGenres();

      if (!genres || genres.length === 0) {
        return {
          success: true,
          message: 'No genres found to sync',
          data: { newGenres: 0 },
        };
      }

      const existingGenres = await this.genreRepository.find({
        select: ['id'],
      });
      const existingGenreIds = new Set(existingGenres.map((g) => g.id));

      const newGenres = genres.filter((genre) => !existingGenreIds.has(genre.id));

      if (newGenres.length === 0) {
        return {
          success: true,
          message: 'All genres are already up to date',
          data: { newGenres: 0 },
        };
      }

      const genreEntities = newGenres.map((genre: GenreModel) =>
        this.genreRepository.create({
          id: genre.id,
          name: genre.name,
        }),
      );

      await this.genreRepository.save(genreEntities);

      return {
        success: true,
        message: `Successfully synced ${newGenres.length} new genres`,
        data: { newGenres: newGenres.length },
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to sync genres: ${error.message}`,
      };
    }
  }

  /**
   * Synchronizes movies from the external provider to the database
   * @returns Promise with sync result
   */
  async syncMovies(): Promise<SyncResult> {
    try {
      const allMovies: MovieModel[] = [];
      let currentPage = 1;
      let totalPages = 1;
      const maxPages = this.configService.get<number>('TMDB_MAX_PAGES', 10);

      do {
        try {
          const result = await this.moviesProviderService.getMovies(currentPage);
          console.log(`Successfully fetched page ${currentPage}`);

          if (!result || !result.movies) {
            console.warn(`No movies found on page ${currentPage}`);
            break;
          }

          allMovies.push(...result.movies);
          totalPages = result.totalPages;
          currentPage++;
        } catch (error) {
          console.error(`Failed to fetch page ${currentPage}:`, error.message);
          currentPage++;
          if (currentPage > maxPages) {
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } while (currentPage <= totalPages && currentPage <= maxPages);

      if (allMovies.length === 0) {
        return {
          success: false,
          message: 'No movies could be fetched from the provider. This may be due to network issues or API problems.',
          data: { newMovies: 0, totalProcessed: 0 },
        };
      }

      console.log(`Total movies fetched: ${allMovies.length}`);

      const movieTmdbIds = allMovies.map((movie) => movie.tmdbId).filter((id) => id !== null);
      const existingMovies = await this.movieRepository.find({
        where: { tmdbId: In(movieTmdbIds) },
        select: ['tmdbId'],
      });

      const existingMovieIds = new Set(existingMovies.map((movie) => movie.tmdbId));
      const newMovies = allMovies.filter((movie) => movie.tmdbId && !existingMovieIds.has(movie.tmdbId));

      if (newMovies.length === 0) {
        return {
          success: true,
          message: 'All movies are already up to date',
          data: { newMovies: 0, totalProcessed: allMovies.length },
        };
      }

      // Filter movies with required fields and remove duplicates within the batch
      const validMovies = newMovies.filter((movie: MovieModel) => movie.title && movie.tmdbId);

      // Remove duplicates within the current batch by tmdbId
      const uniqueMovies = validMovies.filter((movie, index, self) => index === self.findIndex((m) => m.tmdbId === movie.tmdbId));

      // Get all genres to map genre IDs to Genre entities
      const allGenres = await this.genreRepository.find();
      const genreMap = new Map(allGenres.map((genre) => [genre.id, genre]));

      const movieEntities = uniqueMovies.map((movie: MovieModel) => {
        const movieEntity = this.movieRepository.create({
          title: movie.title!,
          overview: movie.overview || undefined,
          releaseDate: movie.releaseDate ? new Date(movie.releaseDate) : undefined,
          posterPath: movie.posterPath || undefined,
          backdropPath: movie.backdropPath || undefined,
          voteAverage: movie.voteAverage || 0,
          voteCount: movie.voteCount || 0,
          popularity: movie.popularity || 0,
          tmdbId: movie.tmdbId!,
        });

        // Map genre IDs to Genre entities
        if (movie.genres && movie.genres.length > 0) {
          movieEntity.genres = movie.genres.map((genreId) => genreMap.get(genreId)).filter((genre) => genre !== undefined) as Genre[];
        } else {
          movieEntity.genres = [];
        }

        return movieEntity;
      });

      // Save movies with their genre relationships
      let savedCount = 0;

      for (const movieEntity of movieEntities) {
        try {
          // Check if movie already exists
          const existingMovie = await this.movieRepository.findOne({
            where: { tmdbId: movieEntity.tmdbId },
            relations: ['genres'],
          });

          if (existingMovie) {
            // Update existing movie with new genre relationships
            existingMovie.genres = movieEntity.genres;
            await this.movieRepository.save(existingMovie);
          } else {
            // Save new movie with genre relationships
            await this.movieRepository.save(movieEntity);
          }
          savedCount++;
        } catch (error) {
          console.warn(`Failed to save movie with tmdbId ${movieEntity.tmdbId}:`, error.message);
        }
      }

      return {
        success: true,
        message: `Successfully synced ${savedCount} new movies`,
        data: {
          newMovies: savedCount,
          totalProcessed: allMovies.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to sync movies: ${error.message}`,
      };
    }
  }

  /**
   * Synchronizes both genres and movies
   * @returns Promise with combined sync result
   */
  async syncAll(): Promise<SyncResult> {
    try {
      // Sync genres first
      const genresResult = await this.syncGenres();
      if (!genresResult.success) {
        return genresResult;
      }

      // Then sync movies
      const moviesResult = await this.syncMovies();
      if (!moviesResult.success) {
        return moviesResult;
      }

      return {
        success: true,
        message: `Successfully synced ${genresResult.data?.newGenres || 0} genres and ${moviesResult.data?.newMovies || 0} movies`,
        data: {
          newGenres: genresResult.data?.newGenres || 0,
          newMovies: moviesResult.data?.newMovies || 0,
          totalProcessed: moviesResult.data?.totalProcessed || 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to sync data: ${error.message}`,
      };
    }
  }
}

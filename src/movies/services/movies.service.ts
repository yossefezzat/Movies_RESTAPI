import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Movie } from '../entities/movie.entity';
import { Rating } from '../entities/rating.entity';
import { MovieView } from '../views/movie.view';
import { MoviesListDto } from '../dto/movies-list.dto';
import { MovieDto } from '../dto/movie.dto';
import { MoviesFilterDto } from '../dto/movies-filter.dto';
import { SearchMoviesDto } from '../dto/search-movies.dto';
import { RateMovieDto } from '../dto/rate-movie.dto';
import { MovieRatingStatsDto } from '../dto/rating-response.dto';
import { AppLoggerService } from '../../common/services/logger/logger.service';

@Injectable()
export class MoviesService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
    private readonly dataSource: DataSource,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext('MoviesService');
  }

  async findAllMovies(filterDto: MoviesFilterDto): Promise<MoviesListDto> {
    const { page = 1, limit = 20, genres } = filterDto;

    this.logger.log('Fetching movies from database', 'MoviesService', {
      page,
      limit,
      genres: genres || 'none',
    });

    const queryBuilder = this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.genres', 'genre')
      .orderBy('movie.popularity', 'DESC');

    if (genres && genres.length > 0) {
      queryBuilder.andWhere('genre.name IN (:...genres)', { genres });
      this.logger.debug('Applied genre filter', 'MoviesService', { genres });
    }

    const [movies, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    this.logger.log('Successfully fetched movies from database', 'MoviesService', {
      moviesCount: movies.length,
      total,
      totalPages: Math.ceil(total / limit),
    });

    return {
      movies: new MovieView(movies).render() as MovieDto[],
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async searchMovies(searchDto: SearchMoviesDto): Promise<MoviesListDto> {
    const { page = 1, limit = 20 } = searchDto;

    this.logger.log('Searching movies in database', 'MoviesService', {
      searchQuery: searchDto.query,
      page,
      limit,
    });

    const queryBuilder = this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.genres', 'genre')
      .where('(movie.title ILIKE :search OR movie.overview ILIKE :search)', {
        search: `%${searchDto.query}%`,
      })
      .orderBy('movie.popularity', 'DESC');

    const [movies, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    this.logger.log('Successfully searched movies in database', 'MoviesService', {
      searchQuery: searchDto.query,
      resultsCount: movies.length,
      total,
      totalPages: Math.ceil(total / limit),
    });

    return {
      movies: new MovieView(movies).render() as MovieDto[],
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOneMovie(id: string): Promise<MovieDto> {
    this.logger.log('Fetching single movie from database', 'MoviesService', { movieId: id });

    const movie = await this.movieRepository.findOne({
      where: { id },
      relations: ['genres'],
    });

    if (!movie) {
      this.logger.warn('Movie not found in database', 'MoviesService', { movieId: id });
      throw new NotFoundException('Movie not found');
    }

    this.logger.log('Successfully fetched movie from database', 'MoviesService', {
      movieId: id,
      movieTitle: movie.title,
    });

    return new MovieView(movie).render() as MovieDto;
  }

  async rateMovie(movieId: string, userId: string, rateMovieDto: RateMovieDto): Promise<MovieRatingStatsDto> {
    const { rating } = rateMovieDto;

    this.logger.log('Starting movie rating transaction', 'MoviesService', {
      movieId,
      userId,
      rating,
    });

    return await this.dataSource.transaction('REPEATABLE READ', async (manager) => {
      this.logger.debug('Checking if movie exists with lock', 'MoviesService', { movieId });

      // Check if movie exists with row-level lock
      const movie = await manager.findOne(Movie, {
        where: { id: movieId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!movie) {
        this.logger.warn('Movie not found for rating', 'MoviesService', { movieId });
        throw new NotFoundException('Movie not found');
      }

      this.logger.debug('Checking for existing rating', 'MoviesService', { movieId, userId });

      const existingRating = await manager.findOne(Rating, {
        where: { userId, movieId },
      });

      let isUpdate = false;

      if (existingRating) {
        this.logger.log('Updating existing rating', 'MoviesService', {
          movieId,
          userId,
          oldRating: existingRating.rating,
          newRating: rating,
        });

        existingRating.rating = rating;
        await manager.save(Rating, existingRating);
        isUpdate = true;
      } else {
        this.logger.log('Creating new rating', 'MoviesService', { movieId, userId, rating });

        const newRating = manager.create(Rating, {
          userId,
          movieId,
          rating,
        });
        await manager.save(Rating, newRating);
      }

      this.logger.debug('Recalculating movie rating statistics', 'MoviesService', { movieId });

      // Recalculate movie rating statistics within the same transaction
      const result = await manager
        .createQueryBuilder(Rating, 'rating')
        .select('AVG(rating.rating)', 'averageRating')
        .addSelect('COUNT(rating.id)', 'ratingCount')
        .where('rating.movieId = :movieId', { movieId })
        .getRawOne();

      const averageRating = result.averageRating ? Math.round(parseFloat(result.averageRating) * 10) / 10 : 0;
      const ratingCount = parseInt(result.ratingCount) || 0;

      this.logger.debug('Updating movie with new rating statistics', 'MoviesService', {
        movieId,
        averageRating,
        ratingCount,
      });

      // Update movie with new rating statistics
      await manager.update(Movie, movieId, {
        averageRating,
        ratingCount,
      });

      const responseMessage = isUpdate ? 'Movie rating updated successfully' : 'Movie rated successfully';

      this.logger.log('Movie rating transaction completed successfully', 'MoviesService', {
        movieId,
        userId,
        averageRating,
        ratingCount,
        isUpdate,
      });

      return {
        averageRating,
        ratingCount,
        message: responseMessage,
      };
    });
  }
}

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

@Injectable()
export class MoviesService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
    private readonly dataSource: DataSource,
  ) {}

  async findAllMovies(filterDto: MoviesFilterDto): Promise<MoviesListDto> {
    const { page = 1, limit = 20, genres } = filterDto;

    const queryBuilder = this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.genres', 'genre')
      .orderBy('movie.popularity', 'DESC');

    if (genres && genres.length > 0) {
      queryBuilder.andWhere('genre.name IN (:...genres)', { genres });
    }

    const [movies, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      movies: new MovieView(movies).render() as MovieDto[],
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async searchMovies(searchDto: SearchMoviesDto): Promise<MoviesListDto> {
    const { page = 1, limit = 20 } = searchDto;

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

    return {
      movies: new MovieView(movies).render() as MovieDto[],
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOneMovie(id: string): Promise<MovieDto> {
    const movie = await this.movieRepository.findOne({
      where: { id },
      relations: ['genres'],
    });

    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    return new MovieView(movie).render() as MovieDto;
  }

  async rateMovie(movieId: string, userId: string, rateMovieDto: RateMovieDto): Promise<MovieRatingStatsDto> {
    const { rating } = rateMovieDto;

    return await this.dataSource.transaction('REPEATABLE READ', async (manager) => {
      // Check if movie exists with row-level lock
      const movie = await manager.findOne(Movie, {
        where: { id: movieId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!movie) {
        throw new NotFoundException('Movie not found');
      }

      const existingRating = await manager.findOne(Rating, {
        where: { userId, movieId },
      });

      let isUpdate = false;

      if (existingRating) {
        existingRating.rating = rating;
        await manager.save(Rating, existingRating);
        isUpdate = true;
      } else {
        const newRating = manager.create(Rating, {
          userId,
          movieId,
          rating,
        });
        await manager.save(Rating, newRating);
      }

      // Recalculate movie rating statistics within the same transaction
      const result = await manager
        .createQueryBuilder(Rating, 'rating')
        .select('AVG(rating.rating)', 'averageRating')
        .addSelect('COUNT(rating.id)', 'ratingCount')
        .where('rating.movieId = :movieId', { movieId })
        .getRawOne();

      const averageRating = result.averageRating ? Math.round(parseFloat(result.averageRating) * 10) / 10 : 0;
      const ratingCount = parseInt(result.ratingCount) || 0;

      // Update movie with new rating statistics
      await manager.update(Movie, movieId, {
        averageRating,
        ratingCount,
      });

      return {
        averageRating,
        ratingCount,
        message: isUpdate ? 'Movie rating updated successfully' : 'Movie rated successfully',
      };
    });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from '../entities/movie.entity';
import { MovieView } from '../views/movie.view';
import { MoviesListDto } from '../dto/movies-list.dto';
import { MovieDto } from '../dto/movie.dto';
import { MoviesFilterDto } from '../dto/movies-filter.dto';

@Injectable()
export class MoviesService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
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
}

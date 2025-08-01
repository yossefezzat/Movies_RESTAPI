import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from '../entities/movie.entity';
import { MovieView } from '../views/movie.view';
import { MoviesListDto } from '../dto/movies-list.dto';
import { MovieDto } from '../dto/movie.dto';

@Injectable()
export class MoviesService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
  ) {}

  async findAllMovies(page = 1, limit = 20): Promise<MoviesListDto> {
    const [movies, total] = await this.movieRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { popularity: 'DESC' },
      relations: ['genres'],
    });

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

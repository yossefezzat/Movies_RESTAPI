import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from '../entities/movie.entity';

@Injectable()
export class MoviesService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
  ) {}

  async findAllMovies(page = 1, limit = 20): Promise<{ movies: Movie[]; total: number; totalPages: number }> {
    const [movies, total] = await this.movieRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { popularity: 'DESC' },
    });

    return {
      movies,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }
}

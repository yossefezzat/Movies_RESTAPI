import { Controller, Get, Query } from '@nestjs/common';
import { MoviesService } from '../services/movies.service';
import { Movie } from '../entities/movie.entity';

@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get()
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ): Promise<{ movies: Movie[]; total: number; totalPages: number; currentPage: number }> {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const result = await this.moviesService.findAllMovies(pageNum, limitNum);

    return {
      ...result,
      currentPage: pageNum,
    };
  }
}

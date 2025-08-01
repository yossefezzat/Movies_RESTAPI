import { Controller, Get, Post, Query, Body, UseGuards, Param, Req } from '@nestjs/common';
import { MoviesService } from '../services/movies.service';
import { MoviesFilterDto } from '../dto/movies-filter.dto';
import { SearchMoviesDto } from '../dto/search-movies.dto';
import { MoviesListResponseDto } from '../dto/movies-response.dto';
import { AccessTokenGuard } from '../../common/guards/access-token.guard';
import { MovieDto } from '../dto/movie.dto';
import { RateMovieDto } from '../dto/rate-movie.dto';
import { MovieRatingStatsDto } from '../dto/rating-response.dto';

@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get()
  @UseGuards(AccessTokenGuard)
  async findAll(@Query() filterDto: MoviesFilterDto): Promise<MoviesListResponseDto> {
    const result = await this.moviesService.findAllMovies(filterDto);

    return {
      ...result,
      currentPage: filterDto.page || 1,
    };
  }

  @Get('search')
  @UseGuards(AccessTokenGuard)
  async searchMovies(@Query() searchDto: SearchMoviesDto): Promise<MoviesListResponseDto> {
    const result = await this.moviesService.searchMovies(searchDto);

    return {
      ...result,
      currentPage: searchDto.page || 1,
    };
  }

  @Get(':id')
  @UseGuards(AccessTokenGuard)
  async findOne(@Param('id') id: string): Promise<MovieDto> {
    return this.moviesService.findOneMovie(id);
  }

  @Post(':id/rate')
  @UseGuards(AccessTokenGuard)
  async rateMovie(@Param('id') movieId: string, @Body() rateMovieDto: RateMovieDto, @Req() req: any): Promise<MovieRatingStatsDto> {
    const userId = req.user['id'];
    return this.moviesService.rateMovie(movieId, userId, rateMovieDto);
  }
}

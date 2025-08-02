import { Controller, Get, Post, Query, Body, UseGuards, Param, Req, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CacheInterceptor } from '../../common/interceptors/cache.interceptor';
import { MoviesService } from '../services/movies.service';
import { MoviesFilterDto } from '../dto/movies-filter.dto';
import { SearchMoviesDto } from '../dto/search-movies.dto';
import { MoviesListResponseDto } from '../dto/movies-response.dto';
import { AccessTokenGuard } from '../../common/guards/access-token.guard';
import { MovieDto } from '../dto/movie.dto';
import { RateMovieDto } from '../dto/rate-movie.dto';
import { MovieRatingStatsDto } from '../dto/rating-response.dto';
import { Movie } from '../entities/movie.entity';

@ApiTags('Movies')
@Controller('movies')
@ApiBearerAuth('Bearer')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get()
  @UseGuards(AccessTokenGuard)
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Get all movies with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Movies retrieved successfully', type: MoviesListResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Query() filterDto: MoviesFilterDto): Promise<MoviesListResponseDto> {
    const result = await this.moviesService.findAllMovies(filterDto);

    return {
      ...result,
      currentPage: filterDto.page || 1,
    };
  }

  @Get('search')
  @UseGuards(AccessTokenGuard)
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Search movies by title, genre, or other criteria' })
  @ApiResponse({ status: 200, description: 'Movies search results', type: MoviesListResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async searchMovies(@Query() searchDto: SearchMoviesDto): Promise<MoviesListResponseDto> {
    const result = await this.moviesService.searchMovies(searchDto);

    return {
      ...result,
      currentPage: searchDto.page || 1,
    };
  }

  @Get(':id')
  @UseGuards(AccessTokenGuard)
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Get a specific movie by ID' })
  @ApiParam({ name: 'id', description: 'Movie ID' })
  @ApiResponse({ status: 200, description: 'Movie retrieved successfully', type: Movie })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  async findOne(@Param('id') id: string): Promise<MovieDto> {
    return this.moviesService.findOneMovie(id);
  }

  @Post(':id/rate')
  @UseGuards(AccessTokenGuard)
  @ApiOperation({ summary: 'Rate a movie' })
  @ApiParam({ name: 'id', description: 'Movie ID' })
  @ApiResponse({ status: 201, description: 'Movie rated successfully', type: MovieRatingStatsDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  async rateMovie(@Param('id') movieId: string, @Body() rateMovieDto: RateMovieDto, @Req() req: any): Promise<MovieRatingStatsDto> {
    const userId = req.user['id'];
    return this.moviesService.rateMovie(movieId, userId, rateMovieDto);
  }
}

import { Controller, Get, Query, UseGuards, UseInterceptors, Param } from '@nestjs/common';
import { MoviesService } from '../services/movies.service';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';
import { MoviesFilterDto } from '../dto/movies-filter.dto';
import { MoviesListResponseDto } from '../dto/movies-response.dto';
import { AccessTokenGuard } from '../../common/guards/access-token.guard';
import { MovieDto } from '../dto/movie.dto';

@Controller('movies')
@UseInterceptors(ResponseInterceptor)
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

  @Get(':id')
  @UseGuards(AccessTokenGuard)
  async findOne(@Param('id') id: string): Promise<MovieDto> {
    return this.moviesService.findOneMovie(id);
  }
}

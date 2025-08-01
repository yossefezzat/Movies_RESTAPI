import { Controller, Get, Query, UseGuards, UseInterceptors, Param } from '@nestjs/common';
import { MoviesService } from '../services/movies.service';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { MoviesListResponseDto } from '../dto/movies-response.dto';
import { AccessTokenGuard } from '../../common/guards/access-token.guard';
import { MovieDto } from '../dto/movie.dto';

@Controller('movies')
@UseInterceptors(ResponseInterceptor)
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get()
  @UseGuards(AccessTokenGuard)
  async findAll(@Query() paginationDto: PaginationDto): Promise<MoviesListResponseDto> {
    const { page = 1, limit = 20 } = paginationDto;
    const result = await this.moviesService.findAllMovies(page, limit);

    return {
      ...result,
      currentPage: page,
    };
  }

  @Get(':id')
  @UseGuards(AccessTokenGuard)
  async findOne(@Param('id') id: string): Promise<MovieDto> {
    return this.moviesService.findOneMovie(id);
  }
}

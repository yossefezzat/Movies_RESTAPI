import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { MoviesService } from '../services/movies.service';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { MoviesListResponseDto } from '../dto/movies-response.dto';

@Controller('movies')
@UseInterceptors(ResponseInterceptor)
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get()
  async findAll(@Query() paginationDto: PaginationDto): Promise<MoviesListResponseDto> {
    const { page = 1, limit = 20 } = paginationDto;
    const result = await this.moviesService.findAllMovies(page, limit);

    return {
      ...result,
      currentPage: page,
    };
  }
}

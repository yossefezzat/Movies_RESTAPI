import { Controller, Get, Query } from '@nestjs/common';
import { MoviesProviderService } from '../services/movies-provider.service';
import { Genre } from '../providers/tmdb/models/genre.model';
import { MoviesClientList } from '../providers/tmdb/models/movies-client-list.model';

@Controller('sync')
export class MoviesProviderController {
  constructor(private readonly moviesProviderService: MoviesProviderService) {}
  
  @Get('genres')
  getGenres(@Query('provider') provider?: string): Promise<Genre[]> {
    return this.moviesProviderService.getGenres(provider);
  }

  @Get('movies')
  getMovies(
    @Query('page') page: number = 1,
    @Query('provider') provider?: string,
  ): Promise<MoviesClientList> {
    return this.moviesProviderService.getMovies(page, provider);
  }
}
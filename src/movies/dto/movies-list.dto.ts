import { MovieDto } from './movie.dto';

export class MoviesListDto {
  movies: MovieDto[];
  total: number;
  totalPages: number;
}

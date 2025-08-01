import { MovieDto } from './movie.dto';

export class MoviesListResponseDto {
  movies: MovieDto[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export class MoviesResponseDto {
  success: boolean;
  statusCode: number;
  message: string;
  data: MoviesListResponseDto;
  timestamp: string;
}

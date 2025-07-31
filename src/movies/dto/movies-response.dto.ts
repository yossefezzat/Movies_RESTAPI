import { Movie } from '../entities/movie.entity';

export class MoviesListResponseDto {
  movies: Movie[];
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

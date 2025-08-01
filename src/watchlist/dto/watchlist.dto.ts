import { MovieDto } from '../../movies/dto/movie.dto';

export class WatchlistDto {
  id: string;
  userId: string;
  movies: MovieDto[];
  createdAt: Date;
}

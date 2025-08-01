import { Movie } from '../entities/movie.entity';

export type MovieDto = Omit<Movie, 'genres'> & {
  genres: string[];
};

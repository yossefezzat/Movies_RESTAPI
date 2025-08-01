import * as _ from 'lodash';
import { Movie } from '../entities/movie.entity';
import { MovieDto } from '../dto/movie.dto';

export class MovieView {
  constructor(private readonly data: Movie | Movie[]) {}

  render(): MovieDto | MovieDto[] {
    if (Array.isArray(this.data)) {
      return this.data.map((movie) => this.renderMovie(movie));
    }
    return this.renderMovie(this.data);
  }

  renderMovie(movie: Movie): MovieDto {
    const movieData = _.pick(movie, [
      'id',
      'backdropPath',
      'tmdbId',
      'overview',
      'popularity',
      'posterPath',
      'releaseDate',
      'title',
      'voteAverage',
      'voteCount',
      'averageRating',
      'ratingCount',
    ]) as Omit<MovieDto, 'genres'>;

    return {
      ...movieData,
      genres: movie.genres ? movie.genres.map((genre) => genre.name) : [],
    };
  }
}

import * as _ from 'lodash';
import { Watchlist } from '../entities/watchlist.entity';
import { WatchlistDto } from '../dto/watchlist.dto';
import { MovieView } from '../../movies/views/movie.view';

export class WatchlistView {
  constructor(private readonly data: Watchlist | Watchlist[]) {}

  render(): WatchlistDto | WatchlistDto[] {
    if (Array.isArray(this.data)) {
      return this.data.map((watchlist) => this.renderWatchlist(watchlist));
    }
    return this.renderWatchlist(this.data);
  }

  renderWatchlist(watchlist: Watchlist): WatchlistDto {
    const watchlistData = _.pick(watchlist, ['id', 'createdAt']) as Omit<WatchlistDto, 'userId' | 'movies'>;

    const movieView = new MovieView(watchlist.movie);
    const movie = movieView.render();

    return {
      ...watchlistData,
      userId: watchlist.user.id,
      movies: Array.isArray(movie) ? movie : [movie],
    };
  }
}

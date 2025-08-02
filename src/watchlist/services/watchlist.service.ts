import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Watchlist } from '../entities/watchlist.entity';
import { User } from '../../users/entities/user.entity';
import { Movie } from '../../movies/entities/movie.entity';
import { AddMovieToWatchlistDto } from '../dto/add-movie-to-watchlist.dto';
import { RemoveMovieFromWatchlistDto } from '../dto/remove-movie-from-watchlist.dto';
import { AppLoggerService } from '../../common/services/logger/logger.service';

@Injectable()
export class WatchlistService {
  constructor(
    @InjectRepository(Watchlist)
    private readonly watchlistRepository: Repository<Watchlist>,
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext('WatchlistService');
  }

  async getUserWatchlist(userId: string): Promise<Watchlist[]> {
    this.logger.debug('Fetching user watchlist', 'WatchlistService', { userId });

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      this.logger.warn('User not found when fetching watchlist', 'WatchlistService', { userId });
      throw new NotFoundException('User not found');
    }

    this.logger.debug('User found, querying watchlist items', 'WatchlistService', { userId });
    const watchlistItems = await this.watchlistRepository.find({
      where: { user: { id: userId } },
      relations: ['user', 'movie'],
      order: { createdAt: 'DESC' },
    });

    this.logger.debug('User watchlist fetched successfully', 'WatchlistService', {
      userId,
      itemCount: watchlistItems.length,
      movieTitles: watchlistItems.map((item) => item.movie.title),
    });

    return watchlistItems;
  }

  async addMovieToWatchlist(userId: string, addMovieDto: AddMovieToWatchlistDto): Promise<Watchlist> {
    this.logger.debug('Adding movie to watchlist', 'WatchlistService', { userId, movieId: addMovieDto.movieId });

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      this.logger.warn('User not found when adding movie to watchlist', 'WatchlistService', { userId, movieId: addMovieDto.movieId });
      throw new NotFoundException('User not found');
    }

    this.logger.debug('User found, checking if movie exists', 'WatchlistService', { userId, movieId: addMovieDto.movieId });
    const movie = await this.movieRepository.findOne({ where: { id: addMovieDto.movieId } });
    if (!movie) {
      this.logger.warn('Movie not found when adding to watchlist', 'WatchlistService', { userId, movieId: addMovieDto.movieId });
      throw new NotFoundException('Movie not found');
    }

    this.logger.debug('Movie found, checking for existing watchlist item', 'WatchlistService', {
      userId,
      movieId: addMovieDto.movieId,
      movieTitle: movie.title,
    });
    const existingWatchlistItem = await this.watchlistRepository.findOne({
      where: {
        user: { id: userId },
        movie: { id: addMovieDto.movieId },
      },
    });

    if (existingWatchlistItem) {
      this.logger.warn('Movie already in watchlist', 'WatchlistService', {
        userId,
        movieId: addMovieDto.movieId,
        movieTitle: movie.title,
      });
      throw new BadRequestException('Movie already in watchlist');
    }

    this.logger.debug('Creating new watchlist item', 'WatchlistService', { userId, movieId: addMovieDto.movieId, movieTitle: movie.title });
    const watchlistItem = this.watchlistRepository.create({
      user,
      movie,
    });

    const savedItem = await this.watchlistRepository.save(watchlistItem);
    this.logger.debug('Watchlist item saved', 'WatchlistService', {
      userId,
      movieId: addMovieDto.movieId,
      watchlistItemId: savedItem.id,
    });

    const result = await this.watchlistRepository.findOne({
      where: { id: savedItem.id },
      relations: ['user', 'movie'],
    });

    if (!result) {
      this.logger.warn('Failed to retrieve saved watchlist item', 'WatchlistService', {
        userId,
        movieId: addMovieDto.movieId,
        watchlistItemId: savedItem.id,
      });
      throw new Error('Failed to retrieve saved watchlist item');
    }

    this.logger.debug('Movie added to watchlist successfully', 'WatchlistService', {
      userId,
      movieId: addMovieDto.movieId,
      movieTitle: movie.title,
      watchlistItemId: result.id,
    });

    return result;
  }

  async removeMovieFromWatchlist(userId: string, removeMovieDto: RemoveMovieFromWatchlistDto): Promise<void> {
    this.logger.debug('Removing movie from watchlist', 'WatchlistService', { userId, movieId: removeMovieDto.movieId });

    const watchlistItem = await this.watchlistRepository.findOne({
      where: {
        user: { id: userId },
        movie: { id: removeMovieDto.movieId },
      },
      relations: ['movie'],
    });

    if (!watchlistItem) {
      this.logger.warn('Movie not found in watchlist when attempting to remove', 'WatchlistService', {
        userId,
        movieId: removeMovieDto.movieId,
      });
      throw new NotFoundException('Movie not found in watchlist');
    }

    this.logger.debug('Watchlist item found, removing from database', 'WatchlistService', {
      userId,
      movieId: removeMovieDto.movieId,
      movieTitle: watchlistItem.movie.title,
      watchlistItemId: watchlistItem.id,
    });

    await this.watchlistRepository.remove(watchlistItem);

    this.logger.debug('Movie removed from watchlist successfully', 'WatchlistService', {
      userId,
      movieId: removeMovieDto.movieId,
      movieTitle: watchlistItem.movie.title,
    });
  }
}

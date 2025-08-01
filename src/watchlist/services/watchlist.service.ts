import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Watchlist } from '../entities/watchlist.entity';
import { User } from '../../users/entities/user.entity';
import { Movie } from '../../movies/entities/movie.entity';
import { AddMovieToWatchlistDto } from '../dto/add-movie-to-watchlist.dto';
import { RemoveMovieFromWatchlistDto } from '../dto/remove-movie-from-watchlist.dto';

@Injectable()
export class WatchlistService {
  constructor(
    @InjectRepository(Watchlist)
    private readonly watchlistRepository: Repository<Watchlist>,
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getUserWatchlist(userId: string): Promise<Watchlist[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const watchlistItems = await this.watchlistRepository.find({
      where: { user: { id: userId } },
      relations: ['user', 'movie'],
      order: { createdAt: 'DESC' },
    });

    return watchlistItems;
  }

  async addMovieToWatchlist(userId: string, addMovieDto: AddMovieToWatchlistDto): Promise<Watchlist> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const movie = await this.movieRepository.findOne({ where: { id: addMovieDto.movieId } });
    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    const existingWatchlistItem = await this.watchlistRepository.findOne({
      where: {
        user: { id: userId },
        movie: { id: addMovieDto.movieId },
      },
    });

    if (existingWatchlistItem) {
      throw new BadRequestException('Movie already in watchlist');
    }

    const watchlistItem = this.watchlistRepository.create({
      user,
      movie,
    });

    const savedItem = await this.watchlistRepository.save(watchlistItem);

    const result = await this.watchlistRepository.findOne({
      where: { id: savedItem.id },
      relations: ['user', 'movie'],
    });

    if (!result) {
      throw new Error('Failed to retrieve saved watchlist item');
    }

    return result;
  }

  async removeMovieFromWatchlist(userId: string, removeMovieDto: RemoveMovieFromWatchlistDto): Promise<void> {
    const watchlistItem = await this.watchlistRepository.findOne({
      where: {
        user: { id: userId },
        movie: { id: removeMovieDto.movieId },
      },
    });

    if (!watchlistItem) {
      throw new NotFoundException('Movie not found in watchlist');
    }

    await this.watchlistRepository.remove(watchlistItem);
  }
}

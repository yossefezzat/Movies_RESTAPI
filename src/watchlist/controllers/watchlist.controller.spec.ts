import { Test, TestingModule } from '@nestjs/testing';
import { WatchlistController } from './watchlist.controller';
import { WatchlistService } from '../services/watchlist.service';
import { AccessTokenGuard } from '../../common/guards/access-token.guard';
import { AddMovieToWatchlistDto } from '../dto/add-movie-to-watchlist.dto';
import { RemoveMovieFromWatchlistDto } from '../dto/remove-movie-from-watchlist.dto';
import { Watchlist } from '../entities/watchlist.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('WatchlistController', () => {
  let controller: WatchlistController;
  let watchlistService: jest.Mocked<WatchlistService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockMovie = {
    id: 'movie-123',
    title: 'Test Movie',
    overview: 'Test overview',
    releaseDate: new Date('2023-01-01'),
    posterPath: '/test.jpg',
    backdropPath: '/test-backdrop.jpg',
    voteAverage: 8.5,
    voteCount: 1000,
    popularity: 100.5,
    tmdbId: 12345,
    averageRating: 4.2,
    ratingCount: 50,
    genres: [],
    ratings: [],
    watchlistedByUsers: [],
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z'),
  };

  const mockWatchlistItem: Watchlist = {
    id: 'watchlist-123',
    user: mockUser as any,
    movie: mockMovie as any,
    createdAt: new Date('2023-01-01T00:00:00Z'),
  };

  const mockRequest = {
    user: mockUser,
  };

  beforeEach(async () => {
    const mockWatchlistService = {
      getUserWatchlist: jest.fn(),
      addMovieToWatchlist: jest.fn(),
      removeMovieFromWatchlist: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WatchlistController],
      providers: [
        {
          provide: WatchlistService,
          useValue: mockWatchlistService,
        },
      ],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<WatchlistController>(WatchlistController);
    watchlistService = module.get(WatchlistService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUserWatchlist', () => {
    it('should return user watchlist', async () => {
      const watchlistItems = [mockWatchlistItem];
      const expectedDto = [
        {
          id: mockWatchlistItem.id,
          userId: mockWatchlistItem.user.id,
          movies: [
            {
              id: mockMovie.id,
              backdropPath: mockMovie.backdropPath,
              tmdbId: mockMovie.tmdbId,
              overview: mockMovie.overview,
              popularity: mockMovie.popularity,
              posterPath: mockMovie.posterPath,
              releaseDate: mockMovie.releaseDate,
              title: mockMovie.title,
              voteAverage: mockMovie.voteAverage,
              voteCount: mockMovie.voteCount,
              averageRating: mockMovie.averageRating,
              ratingCount: mockMovie.ratingCount,
              genres: [],
            },
          ],
          createdAt: mockWatchlistItem.createdAt,
        },
      ];
      watchlistService.getUserWatchlist.mockResolvedValue(watchlistItems);

      const result = await controller.getUserWatchlist(mockRequest);

      expect(watchlistService.getUserWatchlist).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(expectedDto);
    });

    it('should return empty array when user has no watchlist items', async () => {
      watchlistService.getUserWatchlist.mockResolvedValue([]);

      const result = await controller.getUserWatchlist(mockRequest);

      expect(watchlistService.getUserWatchlist).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual([]);
    });

    it('should handle service errors', async () => {
      const error = new NotFoundException('User not found');
      watchlistService.getUserWatchlist.mockRejectedValue(error);

      await expect(controller.getUserWatchlist(mockRequest)).rejects.toThrow(NotFoundException);
      expect(watchlistService.getUserWatchlist).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('addMovieToWatchlist', () => {
    const addMovieDto: AddMovieToWatchlistDto = { movieId: 'movie-123' };

    it('should add movie to watchlist successfully', async () => {
      const expectedDto = {
        id: mockWatchlistItem.id,
        userId: mockWatchlistItem.user.id,
        movies: [
          {
            id: mockMovie.id,
            backdropPath: mockMovie.backdropPath,
            tmdbId: mockMovie.tmdbId,
            overview: mockMovie.overview,
            popularity: mockMovie.popularity,
            posterPath: mockMovie.posterPath,
            releaseDate: mockMovie.releaseDate,
            title: mockMovie.title,
            voteAverage: mockMovie.voteAverage,
            voteCount: mockMovie.voteCount,
            averageRating: mockMovie.averageRating,
            ratingCount: mockMovie.ratingCount,
            genres: [],
          },
        ],
        createdAt: mockWatchlistItem.createdAt,
      };
      watchlistService.addMovieToWatchlist.mockResolvedValue(mockWatchlistItem);

      const result = await controller.addMovieToWatchlist(mockRequest, addMovieDto);

      expect(watchlistService.addMovieToWatchlist).toHaveBeenCalledWith(mockUser.id, addMovieDto);
      expect(result).toEqual(expectedDto);
    });

    it('should handle user not found error', async () => {
      const error = new NotFoundException('User not found');
      watchlistService.addMovieToWatchlist.mockRejectedValue(error);

      await expect(controller.addMovieToWatchlist(mockRequest, addMovieDto)).rejects.toThrow(NotFoundException);
      expect(watchlistService.addMovieToWatchlist).toHaveBeenCalledWith(mockUser.id, addMovieDto);
    });

    it('should handle movie not found error', async () => {
      const error = new NotFoundException('Movie not found');
      watchlistService.addMovieToWatchlist.mockRejectedValue(error);

      await expect(controller.addMovieToWatchlist(mockRequest, addMovieDto)).rejects.toThrow(NotFoundException);
      expect(watchlistService.addMovieToWatchlist).toHaveBeenCalledWith(mockUser.id, addMovieDto);
    });

    it('should handle movie already in watchlist error', async () => {
      const error = new BadRequestException('Movie already in watchlist');
      watchlistService.addMovieToWatchlist.mockRejectedValue(error);

      await expect(controller.addMovieToWatchlist(mockRequest, addMovieDto)).rejects.toThrow(BadRequestException);
      expect(watchlistService.addMovieToWatchlist).toHaveBeenCalledWith(mockUser.id, addMovieDto);
    });
  });

  describe('removeMovieFromWatchlist', () => {
    const removeMovieDto: RemoveMovieFromWatchlistDto = { movieId: 'movie-123' };

    it('should remove movie from watchlist successfully', async () => {
      watchlistService.removeMovieFromWatchlist.mockResolvedValue(undefined);

      await controller.removeMovieFromWatchlist(mockRequest, removeMovieDto.movieId);

      expect(watchlistService.removeMovieFromWatchlist).toHaveBeenCalledWith(mockUser.id, removeMovieDto);
    });

    it('should handle movie not in watchlist error', async () => {
      const error = new NotFoundException('Movie not found in watchlist');
      watchlistService.removeMovieFromWatchlist.mockRejectedValue(error);

      await expect(controller.removeMovieFromWatchlist(mockRequest, removeMovieDto.movieId)).rejects.toThrow(NotFoundException);
      expect(watchlistService.removeMovieFromWatchlist).toHaveBeenCalledWith(mockUser.id, removeMovieDto);
    });
  });

  describe('Guard Integration', () => {
    it('should be protected by AccessTokenGuard', () => {
      const guards = Reflect.getMetadata('__guards__', WatchlistController);
      expect(guards).toContain(AccessTokenGuard);
    });
  });
});

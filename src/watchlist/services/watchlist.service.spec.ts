import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { WatchlistService } from './watchlist.service';
import { Watchlist } from '../entities/watchlist.entity';
import { User } from '../../users/entities/user.entity';
import { Movie } from '../../movies/entities/movie.entity';
import { AddMovieToWatchlistDto } from '../dto/add-movie-to-watchlist.dto';
import { RemoveMovieFromWatchlistDto } from '../dto/remove-movie-from-watchlist.dto';
import { AppLoggerService } from '../../common/services/logger/logger.service';

describe('WatchlistService', () => {
  let service: WatchlistService;
  let watchlistRepository: jest.Mocked<Repository<Watchlist>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let movieRepository: jest.Mocked<Repository<Movie>>;

  const mockUser: User = {
    id: 'user-123',
    username: 'test@example.com',
    password: 'hashedPassword',
    refreshToken: null,
    watchlist: [],
    fullName: 'Test User',
  };

  const mockMovie: Movie = {
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
    user: mockUser,
    movie: mockMovie,
    createdAt: new Date('2023-01-01T00:00:00Z'),
  };

  beforeEach(async () => {
    const mockWatchlistRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const mockUserRepository = {
      findOne: jest.fn(),
    };

    const mockMovieRepository = {
      findOne: jest.fn(),
    };

    const mockLoggerService = {
      setContext: jest.fn(),
      log: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WatchlistService,
        {
          provide: getRepositoryToken(Watchlist),
          useValue: mockWatchlistRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Movie),
          useValue: mockMovieRepository,
        },
        {
          provide: AppLoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<WatchlistService>(WatchlistService);
    watchlistRepository = module.get(getRepositoryToken(Watchlist));
    userRepository = module.get(getRepositoryToken(User));
    movieRepository = module.get(getRepositoryToken(Movie));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserWatchlist', () => {
    it('should return user watchlist items', async () => {
      const userId = 'user-123';
      const watchlistItems = [mockWatchlistItem];

      userRepository.findOne.mockResolvedValue(mockUser);
      watchlistRepository.find.mockResolvedValue(watchlistItems);

      const result = await service.getUserWatchlist(userId);

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(watchlistRepository.find).toHaveBeenCalledWith({
        where: { user: { id: userId } },
        relations: ['user', 'movie'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(watchlistItems);
    });

    it('should throw NotFoundException when user not found', async () => {
      const userId = 'non-existent-user';

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.getUserWatchlist(userId)).rejects.toThrow(NotFoundException);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
    });

    it('should return empty array when user has no watchlist items', async () => {
      const userId = 'user-123';

      userRepository.findOne.mockResolvedValue(mockUser);
      watchlistRepository.find.mockResolvedValue([]);

      const result = await service.getUserWatchlist(userId);

      expect(result).toEqual([]);
    });
  });

  describe('addMovieToWatchlist', () => {
    const addMovieDto: AddMovieToWatchlistDto = { movieId: 'movie-123' };

    it('should add movie to watchlist successfully', async () => {
      const userId = 'user-123';

      userRepository.findOne.mockResolvedValue(mockUser);
      movieRepository.findOne.mockResolvedValue(mockMovie);
      watchlistRepository.findOne
        .mockResolvedValueOnce(null) // First call to check if movie already in watchlist
        .mockResolvedValueOnce(mockWatchlistItem); // Second call to retrieve saved item with relations
      watchlistRepository.create.mockReturnValue(mockWatchlistItem);
      watchlistRepository.save.mockResolvedValue(mockWatchlistItem);

      const result = await service.addMovieToWatchlist(userId, addMovieDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(movieRepository.findOne).toHaveBeenCalledWith({ where: { id: addMovieDto.movieId } });
      expect(watchlistRepository.findOne).toHaveBeenCalledWith({
        where: {
          user: { id: userId },
          movie: { id: addMovieDto.movieId },
        },
      });
      expect(watchlistRepository.create).toHaveBeenCalledWith({
        user: mockUser,
        movie: mockMovie,
      });
      expect(watchlistRepository.save).toHaveBeenCalledWith(mockWatchlistItem);
      expect(result).toEqual(mockWatchlistItem);
    });

    it('should throw NotFoundException when user not found', async () => {
      const userId = 'non-existent-user';

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.addMovieToWatchlist(userId, addMovieDto)).rejects.toThrow(NotFoundException);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
    });

    it('should throw NotFoundException when movie not found', async () => {
      const userId = 'user-123';

      userRepository.findOne.mockResolvedValue(mockUser);
      movieRepository.findOne.mockResolvedValue(null);

      await expect(service.addMovieToWatchlist(userId, addMovieDto)).rejects.toThrow(NotFoundException);
      expect(movieRepository.findOne).toHaveBeenCalledWith({ where: { id: addMovieDto.movieId } });
    });

    it('should throw BadRequestException when movie already in watchlist', async () => {
      const userId = 'user-123';

      userRepository.findOne.mockResolvedValue(mockUser);
      movieRepository.findOne.mockResolvedValue(mockMovie);
      watchlistRepository.findOne.mockResolvedValue(mockWatchlistItem);

      await expect(service.addMovieToWatchlist(userId, addMovieDto)).rejects.toThrow(BadRequestException);
      expect(watchlistRepository.findOne).toHaveBeenCalledWith({
        where: {
          user: { id: userId },
          movie: { id: addMovieDto.movieId },
        },
      });
    });
  });

  describe('removeMovieFromWatchlist', () => {
    const removeMovieDto: RemoveMovieFromWatchlistDto = { movieId: 'movie-123' };

    it('should remove movie from watchlist successfully', async () => {
      const userId = 'user-123';

      watchlistRepository.findOne.mockResolvedValue(mockWatchlistItem);
      watchlistRepository.remove.mockResolvedValue(mockWatchlistItem);

      await service.removeMovieFromWatchlist(userId, removeMovieDto);

      expect(watchlistRepository.findOne).toHaveBeenCalledWith({
        where: {
          user: { id: userId },
          movie: { id: removeMovieDto.movieId },
        },
        relations: ['movie'],
      });
      expect(watchlistRepository.remove).toHaveBeenCalledWith(mockWatchlistItem);
    });

    it('should throw NotFoundException when movie not in watchlist', async () => {
      const userId = 'user-123';

      watchlistRepository.findOne.mockResolvedValue(null);

      await expect(service.removeMovieFromWatchlist(userId, removeMovieDto)).rejects.toThrow(NotFoundException);
      expect(watchlistRepository.findOne).toHaveBeenCalledWith({
        where: {
          user: { id: userId },
          movie: { id: removeMovieDto.movieId },
        },
        relations: ['movie'],
      });
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource, QueryBuilder, SelectQueryBuilder } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { Movie } from '../entities/movie.entity';
import { Rating } from '../entities/rating.entity';
import { MovieView } from '../views/movie.view';
import { MoviesFilterDto } from '../dto/movies-filter.dto';
import { SearchMoviesDto } from '../dto/search-movies.dto';
import { RateMovieDto } from '../dto/rate-movie.dto';
import { AppLoggerService } from '../../common/services/logger/logger.service';

describe('MoviesService', () => {
  let service: MoviesService;
  let movieRepository: jest.Mocked<Repository<Movie>>;
  let ratingRepository: jest.Mocked<Repository<Rating>>;
  let dataSource: jest.Mocked<DataSource>;
  let queryBuilder: jest.Mocked<SelectQueryBuilder<Movie>>;
  let manager: any;

  const mockMovieEntity = {
    id: '1',
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
    genres: [{ id: '1', name: 'Action' }],
    ratings: [],
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z'),
  };

  const mockMovieDto = {
    id: '1',
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
    genres: ['Action'],
  };

  const mockRating = {
    id: '1',
    userId: 'user1',
    movieId: '1',
    rating: 4,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    queryBuilder = {
      createQueryBuilder: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      setParameter: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[mockMovieEntity], 1]),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ averageRating: '4.2', ratingCount: '50' }),
    } as any;

    manager = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
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
        MoviesService,
        {
          provide: getRepositoryToken(Movie),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Rating),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn().mockImplementation((isolation, callback) => callback(manager)),
          },
        },
        {
          provide: AppLoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<MoviesService>(MoviesService);
    movieRepository = module.get(getRepositoryToken(Movie));
    ratingRepository = module.get(getRepositoryToken(Rating));
    dataSource = module.get(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllMovies', () => {
    it('should return paginated movies without genre filter', async () => {
      const filterDto: MoviesFilterDto = { page: 1, limit: 10, skip: 0 };

      const result = await service.findAllMovies(filterDto);

      expect(movieRepository.createQueryBuilder).toHaveBeenCalledWith('movie');
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('movie.genres', 'genre');
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('movie.popularity', 'DESC');
      expect(queryBuilder.skip).toHaveBeenCalledWith(0);
      expect(queryBuilder.take).toHaveBeenCalledWith(10);
      expect(result).toEqual({
        movies: [
          {
            id: '1',
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
            genres: ['Action'],
          },
        ],
        total: 1,
        totalPages: 1,
      });
    });

    it('should return paginated movies with genre filter', async () => {
      const filterDto: MoviesFilterDto = { page: 1, limit: 10, genres: ['Action'], skip: 0 };

      const result = await service.findAllMovies(filterDto);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('genre.name IN (:...genres)', { genres: ['Action'] });
      expect(result).toEqual({
        movies: [
          {
            id: '1',
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
            genres: ['Action'],
          },
        ],
        total: 1,
        totalPages: 1,
      });
    });
  });

  describe('searchMovies', () => {
    it('should search movies using full-text search', async () => {
      const searchDto: SearchMoviesDto = { query: 'test movie', page: 1, limit: 10, skip: 0 };

      const result = await service.searchMovies(searchDto);

      expect(queryBuilder.where).toHaveBeenCalledWith('(movie.title ILIKE :search OR movie.overview ILIKE :search)', {
        search: '%test movie%',
      });
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('movie.popularity', 'DESC');
      expect(result).toEqual({
        movies: [
          {
            id: '1',
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
            genres: ['Action'],
          },
        ],
        total: 1,
        totalPages: 1,
      });
    });
  });

  describe('findOneMovie', () => {
    it('should return a movie by id', async () => {
      movieRepository.findOne.mockResolvedValue(mockMovieEntity as unknown as Movie);

      const result = await service.findOneMovie('1');

      expect(movieRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['genres'],
      });
      expect(result).toEqual({
        id: '1',
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
        genres: ['Action'],
      });
    });

    it('should throw NotFoundException when movie not found', async () => {
      movieRepository.findOne.mockResolvedValue(null);

      await expect(service.findOneMovie('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('rateMovie', () => {
    const rateMovieDto: RateMovieDto = { rating: 4 };

    it('should create new rating when user has not rated the movie', async () => {
      manager.findOne
        .mockResolvedValueOnce(mockMovieEntity) // movie exists
        .mockResolvedValueOnce(null); // no existing rating
      manager.create.mockReturnValue(mockRating);
      manager.save.mockResolvedValue(mockRating);

      const result = await service.rateMovie('1', 'user1', rateMovieDto);

      expect(manager.findOne).toHaveBeenCalledWith(Movie, {
        where: { id: '1' },
        lock: { mode: 'pessimistic_write' },
      });
      expect(manager.findOne).toHaveBeenCalledWith(Rating, {
        where: { userId: 'user1', movieId: '1' },
      });
      expect(manager.create).toHaveBeenCalledWith(Rating, {
        userId: 'user1',
        movieId: '1',
        rating: 4,
      });
      expect(result).toEqual({
        averageRating: 4.2,
        ratingCount: 50,
        message: 'Movie rated successfully',
      });
    });

    it('should update existing rating when user has already rated the movie', async () => {
      const existingRating = { ...mockRating };
      manager.findOne
        .mockResolvedValueOnce(mockMovieEntity) // movie exists
        .mockResolvedValueOnce(existingRating); // existing rating
      manager.save.mockResolvedValue({ ...existingRating, rating: 5 });

      const result = await service.rateMovie('1', 'user1', { rating: 5 });

      expect(existingRating.rating).toBe(5);
      expect(manager.save).toHaveBeenCalledWith(Rating, existingRating);
      expect(result).toEqual({
        averageRating: 4.2,
        ratingCount: 50,
        message: 'Movie rating updated successfully',
      });
    });

    it('should throw NotFoundException when movie does not exist', async () => {
      manager.findOne.mockResolvedValueOnce(null); // movie not found

      await expect(service.rateMovie('999', 'user1', rateMovieDto)).rejects.toThrow(NotFoundException);
    });
  });
});

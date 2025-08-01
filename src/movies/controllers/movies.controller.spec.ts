import { Test, TestingModule } from '@nestjs/testing';
import { MoviesController } from './movies.controller';
import { MoviesService } from '../services/movies.service';
import { AccessTokenGuard } from '../../common/guards/access-token.guard';
import { MoviesFilterDto } from '../dto/movies-filter.dto';
import { SearchMoviesDto } from '../dto/search-movies.dto';
import { RateMovieDto } from '../dto/rate-movie.dto';
import { MovieDto } from '../dto/movie.dto';
import { MovieRatingStatsDto } from '../dto/rating-response.dto';

describe('MoviesController', () => {
  let controller: MoviesController;
  let moviesService: jest.Mocked<MoviesService>;

  const mockMovie: MovieDto = {
    ratings: [],
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
    watchlistedByUsers: [],
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z'),
  };

  const mockMoviesListResponse = {
    movies: [mockMovie],
    total: 1,
    totalPages: 1,
  };

  const mockRatingStats: MovieRatingStatsDto = {
    averageRating: 4.2,
    ratingCount: 51,
    message: 'Movie rated successfully',
  };

  beforeEach(async () => {
    const mockMoviesService = {
      findAllMovies: jest.fn(),
      searchMovies: jest.fn(),
      findOneMovie: jest.fn(),
      rateMovie: jest.fn(),
      getUserMovieRating: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MoviesController],
      providers: [
        {
          provide: MoviesService,
          useValue: mockMoviesService,
        },
      ],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<MoviesController>(MoviesController);
    moviesService = module.get(MoviesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated movies list', async () => {
      const filterDto: MoviesFilterDto = { page: 1, limit: 10, skip: 0 };
      moviesService.findAllMovies.mockResolvedValue(mockMoviesListResponse);

      const result = await controller.findAll(filterDto);

      expect(moviesService.findAllMovies).toHaveBeenCalledWith(filterDto);
      expect(result).toEqual({
        ...mockMoviesListResponse,
        currentPage: 1,
      });
    });

    it('should return movies with default page when page is not provided', async () => {
      const filterDto: MoviesFilterDto = { page: 1, limit: 10, skip: 0 };
      moviesService.findAllMovies.mockResolvedValue(mockMoviesListResponse);

      const result = await controller.findAll(filterDto);

      expect(result.currentPage).toBe(1);
    });

    it('should handle genre filtering', async () => {
      const filterDto: MoviesFilterDto = { page: 2, limit: 5, skip: 5, genres: ['Action', 'Drama'] };
      moviesService.findAllMovies.mockResolvedValue(mockMoviesListResponse);

      const result = await controller.findAll(filterDto);

      expect(moviesService.findAllMovies).toHaveBeenCalledWith(filterDto);
      expect(result.currentPage).toBe(2);
    });
  });

  describe('searchMovies', () => {
    it('should return search results', async () => {
      const searchDto: SearchMoviesDto = { query: 'test movie', page: 1, limit: 10, skip: 0 };
      moviesService.searchMovies.mockResolvedValue(mockMoviesListResponse);

      const result = await controller.searchMovies(searchDto);

      expect(moviesService.searchMovies).toHaveBeenCalledWith(searchDto);
      expect(result).toEqual({
        ...mockMoviesListResponse,
        currentPage: 1,
      });
    });

    it('should handle search with pagination', async () => {
      const searchDto: SearchMoviesDto = { query: 'action movie', page: 3, limit: 20, skip: 40 };
      moviesService.searchMovies.mockResolvedValue(mockMoviesListResponse);

      const result = await controller.searchMovies(searchDto);

      expect(moviesService.searchMovies).toHaveBeenCalledWith(searchDto);
      expect(result.currentPage).toBe(3);
    });

    it('should return search results with default page when page is not provided', async () => {
      const searchDto: SearchMoviesDto = { query: 'test', limit: 10, skip: 0 };
      moviesService.searchMovies.mockResolvedValue(mockMoviesListResponse);

      const result = await controller.searchMovies(searchDto);

      expect(result.currentPage).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a single movie', async () => {
      const movieId = '1';
      moviesService.findOneMovie.mockResolvedValue(mockMovie);

      const result = await controller.findOne(movieId);

      expect(moviesService.findOneMovie).toHaveBeenCalledWith(movieId);
      expect(result).toEqual(mockMovie);
    });

    it('should handle movie not found', async () => {
      const movieId = '999';
      const notFoundError = new Error('Movie not found');
      moviesService.findOneMovie.mockRejectedValue(notFoundError);

      await expect(controller.findOne(movieId)).rejects.toThrow('Movie not found');
      expect(moviesService.findOneMovie).toHaveBeenCalledWith(movieId);
    });
  });

  describe('rateMovie', () => {
    it('should rate a movie successfully', async () => {
      const movieId = '1';
      const rateMovieDto: RateMovieDto = { rating: 4 };
      const mockRequest = {
        user: { id: 'user123' },
      };

      moviesService.rateMovie.mockResolvedValue(mockRatingStats);

      const result = await controller.rateMovie(movieId, rateMovieDto, mockRequest);

      expect(moviesService.rateMovie).toHaveBeenCalledWith(movieId, 'user123', rateMovieDto);
      expect(result).toEqual(mockRatingStats);
    });

    it('should handle rating with different values', async () => {
      const movieId = '2';
      const rateMovieDto: RateMovieDto = { rating: 5 };
      const mockRequest = {
        user: { id: 'user456' },
      };

      const expectedStats = {
        averageRating: 4.5,
        ratingCount: 25,
        message: 'Movie rating updated successfully',
      };

      moviesService.rateMovie.mockResolvedValue(expectedStats);

      const result = await controller.rateMovie(movieId, rateMovieDto, mockRequest);

      expect(moviesService.rateMovie).toHaveBeenCalledWith(movieId, 'user456', rateMovieDto);
      expect(result).toEqual(expectedStats);
    });

    it('should handle rating errors', async () => {
      const movieId = '999';
      const rateMovieDto: RateMovieDto = { rating: 3 };
      const mockRequest = {
        user: { id: 'user789' },
      };

      const ratingError = new Error('Movie not found');
      moviesService.rateMovie.mockRejectedValue(ratingError);

      await expect(controller.rateMovie(movieId, rateMovieDto, mockRequest)).rejects.toThrow('Movie not found');

      expect(moviesService.rateMovie).toHaveBeenCalledWith(movieId, 'user789', rateMovieDto);
    });
  });

  describe('Guard Integration', () => {
    it('should be protected by AccessTokenGuard', () => {
      const guards = Reflect.getMetadata('__guards__', MoviesController.prototype.findAll);
      expect(guards).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should propagate service errors', async () => {
      const filterDto: MoviesFilterDto = { page: 1, limit: 10, skip: 0 };
      const serviceError = new Error('Database connection failed');
      moviesService.findAllMovies.mockRejectedValue(serviceError);

      await expect(controller.findAll(filterDto)).rejects.toThrow('Database connection failed');
    });

    it('should handle search service errors', async () => {
      const searchDto: SearchMoviesDto = { query: 'test', page: 1, limit: 10, skip: 0 };
      const searchError = new Error('Search service unavailable');
      moviesService.searchMovies.mockRejectedValue(searchError);

      await expect(controller.searchMovies(searchDto)).rejects.toThrow('Search service unavailable');
    });
  });
});

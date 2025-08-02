import { Test, TestingModule } from '@nestjs/testing';
import { MoviesProviderService } from './movies-provider.service';
import { MovieProviderInterface } from '../interfaces/movie-provider.interface';
import { Genre } from '../providers/tmdb/models/genre.model';
import { MoviesClientList } from '../providers/tmdb/models/movies-client-list.model';
import { Movie } from '../providers/tmdb/models/movie.model';

describe('MoviesProviderService', () => {
  let service: MoviesProviderService;
  let mockTmdbProvider: jest.Mocked<MovieProviderInterface>;
  let mockOtherProvider: jest.Mocked<MovieProviderInterface>;

  const mockGenres: Genre[] = [
    { id: 1, name: 'Action' },
    { id: 2, name: 'Comedy' },
    { id: 3, name: 'Drama' },
  ];

  const mockMovies: Movie[] = [
    {
      tmdbId: 1,
      title: 'Test Movie 1',
      overview: 'Test overview 1',
      releaseDate: '2023-01-01',
      posterPath: '/poster1.jpg',
      backdropPath: '/backdrop1.jpg',
      voteAverage: 8.5,
      voteCount: 1000,
      popularity: 100.5,
      genres: [1, 2],
      adult: false,
      originalLanguage: 'en',
      originalTitle: 'Test Movie 1',
      video: false,
    },
    {
      tmdbId: 2,
      title: 'Test Movie 2',
      overview: 'Test overview 2',
      releaseDate: '2023-02-01',
      posterPath: '/poster2.jpg',
      backdropPath: '/backdrop2.jpg',
      voteAverage: 7.2,
      voteCount: 500,
      popularity: 85.3,
      genres: [2, 3],
      adult: false,
      originalLanguage: 'en',
      originalTitle: 'Test Movie 2',
      video: false,
    },
  ];

  const mockMoviesClientList: MoviesClientList = {
    movies: mockMovies,
    currentPage: 1,
    totalPages: 10,
  };

  beforeEach(async () => {
    mockTmdbProvider = {
      getProviderName: jest.fn().mockReturnValue('tmdb'),
      getGenres: jest.fn(),
      getMovies: jest.fn(),
    };

    mockOtherProvider = {
      getProviderName: jest.fn().mockReturnValue('other'),
      getGenres: jest.fn(),
      getMovies: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesProviderService,
        {
          provide: 'MOVIE_PROVIDERS',
          useValue: [mockTmdbProvider, mockOtherProvider],
        },
      ],
    }).compile();

    service = module.get<MoviesProviderService>(MoviesProviderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should register providers correctly', () => {
    expect(mockTmdbProvider.getProviderName).toHaveBeenCalled();
    expect(mockOtherProvider.getProviderName).toHaveBeenCalled();
  });

  it('should throw error if default provider is not registered', async () => {
    const mockProviderWithoutTmdb = {
      getProviderName: jest.fn().mockReturnValue('other'),
      getGenres: jest.fn(),
      getMovies: jest.fn(),
    };

    await expect(
      Test.createTestingModule({
        providers: [
          MoviesProviderService,
          {
            provide: 'MOVIE_PROVIDERS',
            useValue: [mockProviderWithoutTmdb],
          },
        ],
      }).compile(),
    ).rejects.toThrow("Default provider 'tmdb' is not registered");
  });

  describe('getDefaultProvider', () => {
    it('should return the default provider name', () => {
      const result = service.getDefaultProvider();
      expect(result).toBe('tmdb');
    });
  });

  describe('getGenres', () => {
    it('should call default provider when no provider specified', async () => {
      mockTmdbProvider.getGenres.mockResolvedValue(mockGenres);

      const result = await service.getGenres();

      expect(mockTmdbProvider.getGenres).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockGenres);
    });

    it('should call specified provider when provider name is given', async () => {
      mockOtherProvider.getGenres.mockResolvedValue(mockGenres);

      const result = await service.getGenres('other');

      expect(mockOtherProvider.getGenres).toHaveBeenCalledTimes(1);
      expect(mockTmdbProvider.getGenres).not.toHaveBeenCalled();
      expect(result).toEqual(mockGenres);
    });

    it('should throw error for unregistered provider', async () => {
      await expect(service.getGenres('nonexistent')).rejects.toThrow("Provider 'nonexistent' is not registered");
    });
  });

  describe('getMovies', () => {
    it('should call default provider with default page when no parameters specified', async () => {
      mockTmdbProvider.getMovies.mockResolvedValue(mockMoviesClientList);

      const result = await service.getMovies();

      expect(mockTmdbProvider.getMovies).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockMoviesClientList);
    });

    it('should call default provider with specified page', async () => {
      mockTmdbProvider.getMovies.mockResolvedValue(mockMoviesClientList);

      const result = await service.getMovies(3);

      expect(mockTmdbProvider.getMovies).toHaveBeenCalledWith(3);
      expect(result).toEqual(mockMoviesClientList);
    });

    it('should call specified provider with specified page', async () => {
      mockOtherProvider.getMovies.mockResolvedValue(mockMoviesClientList);

      const result = await service.getMovies(2, 'other');

      expect(mockOtherProvider.getMovies).toHaveBeenCalledWith(2);
      expect(mockTmdbProvider.getMovies).not.toHaveBeenCalled();
      expect(result).toEqual(mockMoviesClientList);
    });

    it('should throw error for unregistered provider', async () => {
      await expect(service.getMovies(1, 'nonexistent')).rejects.toThrow("Provider 'nonexistent' is not registered");
    });
  });
});

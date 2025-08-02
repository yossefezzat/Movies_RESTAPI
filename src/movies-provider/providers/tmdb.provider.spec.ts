import { Test, TestingModule } from '@nestjs/testing';
import { TmdbProvider } from './tmdb.provider';
import { TmdbClientInterface } from './tmdb/interfaces/tmdb-client.interface';
import { Genre } from './tmdb/models/genre.model';
import { Movie } from './tmdb/models/movie.model';
import { MoviesClientList } from './tmdb/models/movies-client-list.model';

describe('TmdbProvider', () => {
  let provider: TmdbProvider;
  let mockTmdbClient: jest.Mocked<TmdbClientInterface>;

  const mockGenres: Genre[] = [{ id: 1, name: 'Action' } as Genre, { id: 2, name: 'Comedy' } as Genre, { id: 3, name: 'Drama' } as Genre];

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
    currentPage: 1,
    totalPages: 10,
    movies: mockMovies,
  };

  beforeEach(async () => {
    mockTmdbClient = {
      getGenres: jest.fn(),
      getMovies: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TmdbProvider,
        {
          provide: 'TmdbClientInterface',
          useValue: mockTmdbClient,
        },
      ],
    }).compile();

    provider = module.get<TmdbProvider>(TmdbProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('getName', () => {
    it('should return "tmdb"', () => {
      expect(provider.getProviderName()).toBe('tmdb');
    });
  });

  describe('getGenres', () => {
    it('should return genres from TMDB client', async () => {
      mockTmdbClient.getGenres.mockResolvedValue(mockGenres);

      const result = await provider.getGenres();

      expect(mockTmdbClient.getGenres).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockGenres);
    });

    it('should handle errors from TMDB client', async () => {
      const error = new Error('TMDB API error');
      mockTmdbClient.getGenres.mockRejectedValue(error);

      await expect(provider.getGenres()).rejects.toThrow('TMDB API error');
      expect(mockTmdbClient.getGenres).toHaveBeenCalledTimes(1);
    });
  });

  describe('getMovies', () => {
    it('should return movies from TMDB client with default page', async () => {
      mockTmdbClient.getMovies.mockResolvedValue(mockMoviesClientList);

      const result = await provider.getMovies();

      expect(mockTmdbClient.getMovies).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockMoviesClientList);
    });

    it('should return movies from TMDB client with specified page', async () => {
      const page = 3;
      const expectedResult = {
        ...mockMoviesClientList,
        currentPage: page,
      };
      mockTmdbClient.getMovies.mockResolvedValue(expectedResult);

      const result = await provider.getMovies(page);

      expect(mockTmdbClient.getMovies).toHaveBeenCalledWith(page);
      expect(result).toEqual(expectedResult);
    });

    it('should handle errors from TMDB client', async () => {
      const error = new Error('TMDB API error');
      mockTmdbClient.getMovies.mockRejectedValue(error);

      await expect(provider.getMovies(1)).rejects.toThrow('TMDB API error');
      expect(mockTmdbClient.getMovies).toHaveBeenCalledWith(1);
    });

    it('should handle empty movies list', async () => {
      const emptyResult: MoviesClientList = {
        currentPage: 1,
        totalPages: 0,
        movies: [],
      };
      mockTmdbClient.getMovies.mockResolvedValue(emptyResult);

      const result = await provider.getMovies();

      expect(mockTmdbClient.getMovies).toHaveBeenCalledWith(1);
      expect(result).toEqual(emptyResult);
      expect(result.movies).toHaveLength(0);
    });
  });
});

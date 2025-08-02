import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { TmdbClientService } from './tmdb-client.service';
import { TmdbGenresResponse, TmdbMoviesResponse } from '../interfaces/tmdb-api-responses.interface';

describe('TmdbClientService', () => {
  let service: TmdbClientService;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockHttpService: jest.Mocked<HttpService>;

  const mockGenresResponse: TmdbGenresResponse = {
    genres: [
      { id: 1, name: 'Action' },
      { id: 2, name: 'Comedy' },
      { id: 3, name: 'Drama' },
    ],
  };

  const mockMoviesResponse: TmdbMoviesResponse = {
    page: 1,
    results: [
      {
        id: 1,
        title: 'Test Movie 1',
        overview: 'Test overview 1',
        release_date: '2023-01-01',
        poster_path: '/poster1.jpg',
        backdrop_path: '/backdrop1.jpg',
        vote_average: 8.5,
        vote_count: 1000,
        popularity: 100.5,
        genre_ids: [1, 2],
        adult: false,
        original_language: 'en',
        original_title: 'Test Movie 1',
        video: false,
      },
      {
        id: 2,
        title: 'Test Movie 2',
        overview: 'Test overview 2',
        release_date: '2023-02-01',
        poster_path: '/poster2.jpg',
        backdrop_path: '/backdrop2.jpg',
        vote_average: 7.2,
        vote_count: 500,
        popularity: 85.3,
        genre_ids: [2, 3],
        adult: false,
        original_language: 'en',
        original_title: 'Test Movie 2',
        video: false,
      },
    ],
    total_pages: 10,
    total_results: 200,
  };

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn(),
    } as any;

    mockHttpService = {
      get: jest.fn(),
    } as any;

    // Setup default config values
    mockConfigService.get.mockImplementation((key: string) => {
      switch (key) {
        case 'TMDB_API_URL':
          return 'https://api.themoviedb.org/3';
        case 'TMDB_API_KEY':
          return 'test-api-key';
        default:
          return undefined;
      }
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TmdbClientService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<TmdbClientService>(TmdbClientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw error if TMDB_API_URL is not defined', async () => {
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'TMDB_API_URL') return undefined;
      if (key === 'TMDB_API_KEY') return 'test-api-key';
      return undefined;
    });

    await expect(
      Test.createTestingModule({
        providers: [
          TmdbClientService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
          {
            provide: HttpService,
            useValue: mockHttpService,
          },
        ],
      }).compile(),
    ).rejects.toThrow('TMDB_API_URL is not defined in configuration');
  });

  it('should throw error if TMDB_API_KEY is not defined', async () => {
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'TMDB_API_URL') return 'https://api.themoviedb.org/3';
      if (key === 'TMDB_API_KEY') return undefined;
      return undefined;
    });

    await expect(
      Test.createTestingModule({
        providers: [
          TmdbClientService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
          {
            provide: HttpService,
            useValue: mockHttpService,
          },
        ],
      }).compile(),
    ).rejects.toThrow('TMDB_API_KEY is not defined in configuration');
  });

  describe('getGenres', () => {
    it('should fetch genres successfully', async () => {
      const mockResponse: AxiosResponse<TmdbGenresResponse> = {
        data: mockGenresResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getGenres();

      expect(mockHttpService.get).toHaveBeenCalledWith('https://api.themoviedb.org/3/genre/movie/list', {
        headers: {
          Authorization: 'Bearer test-api-key',
          accept: 'application/json',
        },
      });
      expect(result).toEqual([
        { id: 1, name: 'Action' },
        { id: 2, name: 'Comedy' },
        { id: 3, name: 'Drama' },
      ]);
    });

    it('should handle HTTP errors when fetching genres', async () => {
      const error = new Error('Network error');
      mockHttpService.get.mockReturnValue(throwError(() => error));

      await expect(service.getGenres()).rejects.toThrow('Failed to fetch genres: Network error');
    });
  });

  describe('getMovies', () => {
    it('should fetch movies successfully with default page', async () => {
      const mockResponse: AxiosResponse<TmdbMoviesResponse> = {
        data: mockMoviesResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getMovies();

      expect(mockHttpService.get).toHaveBeenCalledWith('https://api.themoviedb.org/3/movie/popular?language=en-US&page=1', {
        headers: {
          Authorization: 'Bearer test-api-key',
          accept: 'application/json',
        },
      });
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(10);
      expect(result.movies).toHaveLength(2);
      expect(result.movies[0]).toEqual({
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
      });
    });

    it('should fetch movies successfully with specified page', async () => {
      const mockResponse: AxiosResponse<TmdbMoviesResponse> = {
        data: { ...mockMoviesResponse, page: 3 },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getMovies(3);

      expect(mockHttpService.get).toHaveBeenCalledWith('https://api.themoviedb.org/3/movie/popular?language=en-US&page=3', {
        headers: {
          Authorization: 'Bearer test-api-key',
          accept: 'application/json',
        },
      });
      expect(result.currentPage).toBe(3);
    });

    it('should handle HTTP errors when fetching movies', async () => {
      const error = new Error('API error');
      mockHttpService.get.mockReturnValue(throwError(() => error));

      await expect(service.getMovies(1)).rejects.toThrow('Failed to fetch movies: API error');
    });

    it('should handle null/undefined values in movie data', async () => {
      const mockResponseWithNulls: TmdbMoviesResponse = {
        page: 1,
        results: [
          {
            id: 1,
            title: 'Test Movie',
            overview: '',
            release_date: '',
            poster_path: null,
            backdrop_path: null,
            vote_average: 0,
            vote_count: 0,
            popularity: 0,
            genre_ids: [],
            adult: false,
            original_language: '',
            original_title: '',
            video: false,
          },
        ],
        total_pages: 1,
        total_results: 1,
      };

      const mockResponse: AxiosResponse<TmdbMoviesResponse> = {
        data: mockResponseWithNulls,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getMovies();

      expect(result.movies[0]).toEqual({
        tmdbId: 1,
        title: 'Test Movie',
        overview: '',
        releaseDate: null,
        posterPath: null,
        backdropPath: null,
        voteAverage: 0,
        voteCount: 0,
        popularity: 0,
        genres: [],
        adult: false,
        originalLanguage: '',
        originalTitle: '',
        video: false,
      });
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository, In } from 'typeorm';
import { DatabaseSyncService } from './database-sync.service';
import { MoviesProviderService } from './movies-provider.service';
import { Movie } from '../../movies/entities/movie.entity';
import { Genre } from '../../movies/entities/genre.entity';
import { Genre as GenreModel } from '../providers/tmdb/models/genre.model';
import { Movie as MovieModel } from '../providers/tmdb/models/movie.model';
import { MoviesClientList } from '../providers/tmdb/models/movies-client-list.model';

describe('DatabaseSyncService', () => {
  let service: DatabaseSyncService;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockMoviesProviderService: jest.Mocked<MoviesProviderService>;
  let mockMovieRepository: jest.Mocked<Repository<Movie>>;
  let mockGenreRepository: jest.Mocked<Repository<Genre>>;

  const mockGenres: GenreModel[] = [
    { id: 1, name: 'Action' },
    { id: 2, name: 'Comedy' },
    { id: 3, name: 'Drama' },
  ];

  const mockMovies: MovieModel[] = [
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
  ];

  const mockMoviesClientList: MoviesClientList = {
    movies: mockMovies,
    currentPage: 1,
    totalPages: 1,
  };

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn(),
    } as any;

    mockMoviesProviderService = {
      getGenres: jest.fn(),
      getMovies: jest.fn(),
    } as any;

    mockMovieRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as any;

    mockGenreRepository = {
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseSyncService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: MoviesProviderService,
          useValue: mockMoviesProviderService,
        },
        {
          provide: getRepositoryToken(Movie),
          useValue: mockMovieRepository,
        },
        {
          provide: getRepositoryToken(Genre),
          useValue: mockGenreRepository,
        },
      ],
    }).compile();

    service = module.get<DatabaseSyncService>(DatabaseSyncService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('syncGenres', () => {
    it('should sync new genres successfully', async () => {
      mockMoviesProviderService.getGenres.mockResolvedValue(mockGenres);
      mockGenreRepository.find.mockResolvedValue([{ id: 1 } as Genre]);
      mockGenreRepository.create.mockImplementation((data) => data as Genre);
      mockGenreRepository.save.mockResolvedValue({ id: 2, name: 'Comedy' } as Genre);

      const result = await service.syncGenres();

      expect(result.success).toBe(true);
      expect(result.message).toBe('Successfully synced 2 new genres');
      expect(result.data?.newGenres).toBe(2);
      expect(mockGenreRepository.save).toHaveBeenCalledWith([
        { id: 2, name: 'Comedy' },
        { id: 3, name: 'Drama' },
      ]);
    });

    it('should handle case when no genres found', async () => {
      mockMoviesProviderService.getGenres.mockResolvedValue([]);

      const result = await service.syncGenres();

      expect(result.success).toBe(true);
      expect(result.message).toBe('No genres found to sync');
      expect(result.data?.newGenres).toBe(0);
    });

    it('should handle case when all genres are up to date', async () => {
      mockMoviesProviderService.getGenres.mockResolvedValue(mockGenres);
      mockGenreRepository.find.mockResolvedValue([{ id: 1 } as Genre, { id: 2 } as Genre, { id: 3 } as Genre]);

      const result = await service.syncGenres();

      expect(result.success).toBe(true);
      expect(result.message).toBe('All genres are already up to date');
      expect(result.data?.newGenres).toBe(0);
    });

    it('should handle errors during sync', async () => {
      mockMoviesProviderService.getGenres.mockRejectedValue(new Error('API Error'));

      const result = await service.syncGenres();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to sync genres: API Error');
    });
  });

  describe('syncMovies', () => {
    beforeEach(() => {
      mockConfigService.get.mockReturnValue(10); // TMDB_MAX_PAGES
    });

    it('should sync new movies successfully', async () => {
      mockMoviesProviderService.getMovies.mockResolvedValue(mockMoviesClientList);
      mockMovieRepository.find.mockResolvedValue([]);
      mockGenreRepository.find.mockResolvedValue([{ id: 1, name: 'Action' } as Genre, { id: 2, name: 'Comedy' } as Genre]);
      mockMovieRepository.create.mockImplementation((data) => data as Movie);
      mockMovieRepository.findOne.mockResolvedValue(null);
      mockMovieRepository.save.mockResolvedValue({
        id: '1',
        title: 'Test',
        overview: 'Test',
        releaseDate: new Date('2023-01-01'),
        posterPath: '/test.jpg',
        backdropPath: '/test-backdrop.jpg',
        voteAverage: 0,
        voteCount: 0,
        popularity: 0,
        tmdbId: 1,
        averageRating: 0,
        ratingCount: 0,
        genres: [],
        ratings: [],
        watchlistedByUsers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Movie);

      const result = await service.syncMovies();

      expect(result.success).toBe(true);
      expect(result.message).toBe('Successfully synced 1 new movies');
      expect(result.data?.newMovies).toBe(1);
      expect(result.data?.totalProcessed).toBe(1);
      expect(mockMovieRepository.save).toHaveBeenCalled();
    });

    it('should handle case when no movies could be fetched', async () => {
      mockMoviesProviderService.getMovies.mockResolvedValue({
        movies: [],
        currentPage: 1,
        totalPages: 1,
      });

      const result = await service.syncMovies();

      expect(result.success).toBe(false);
      expect(result.message).toContain('No movies could be fetched from the provider');
      expect(result.data?.newMovies).toBe(0);
      expect(result.data?.totalProcessed).toBe(0);
    });

    it('should handle case when all movies are up to date', async () => {
      mockMoviesProviderService.getMovies.mockResolvedValue(mockMoviesClientList);
      mockMovieRepository.find.mockResolvedValue([{ tmdbId: 1 } as Movie]);

      const result = await service.syncMovies();

      expect(result.success).toBe(true);
      expect(result.message).toBe('All movies are already up to date');
      expect(result.data?.newMovies).toBe(0);
      expect(result.data?.totalProcessed).toBe(1);
    });

    it('should handle errors during movie sync', async () => {
      mockMoviesProviderService.getMovies.mockRejectedValue(new Error('Network Error'));

      const result = await service.syncMovies();

      expect(result.success).toBe(false);
      expect(result.message).toBe('No movies could be fetched from the provider. This may be due to network issues or API problems.');
    });

    it('should handle pagination correctly', async () => {
      const page1Response = {
        movies: [mockMovies[0]],
        currentPage: 1,
        totalPages: 2,
      };
      const page2Response = {
        movies: [],
        currentPage: 2,
        totalPages: 2,
      };

      mockMoviesProviderService.getMovies.mockResolvedValueOnce(page1Response).mockResolvedValueOnce(page2Response);
      mockMovieRepository.find.mockResolvedValue([]);
      mockGenreRepository.find.mockResolvedValue([]);
      mockMovieRepository.create.mockImplementation((data) => data as Movie);
      mockMovieRepository.findOne.mockResolvedValue(null);
      mockMovieRepository.save.mockResolvedValue({} as Movie);

      const result = await service.syncMovies();

      expect(mockMoviesProviderService.getMovies).toHaveBeenCalledTimes(2);
      expect(mockMoviesProviderService.getMovies).toHaveBeenCalledWith(1);
      expect(mockMoviesProviderService.getMovies).toHaveBeenCalledWith(2);
    });
  });

  describe('syncAll', () => {
    it('should sync both genres and movies successfully', async () => {
      // Mock successful genre sync
      mockMoviesProviderService.getGenres.mockResolvedValue(mockGenres);
      mockGenreRepository.find.mockResolvedValue([]);
      mockGenreRepository.create.mockImplementation((data) => data as Genre);
      mockGenreRepository.save.mockResolvedValue({} as Genre);

      // Mock successful movie sync
      mockConfigService.get.mockReturnValue(10);
      mockMoviesProviderService.getMovies.mockResolvedValue(mockMoviesClientList);
      mockMovieRepository.find.mockResolvedValue([]);
      mockMovieRepository.create.mockImplementation((data) => data as Movie);
      mockMovieRepository.findOne.mockResolvedValue(null);
      mockMovieRepository.save.mockResolvedValue({} as Movie);

      const result = await service.syncAll();

      expect(result.success).toBe(true);
      expect(result.message).toBe('Successfully synced 3 genres and 1 movies');
      expect(result.data?.newGenres).toBe(3);
      expect(result.data?.newMovies).toBe(1);
      expect(result.data?.totalProcessed).toBe(1);
    });

    it('should return error if genre sync fails', async () => {
      mockMoviesProviderService.getGenres.mockRejectedValue(new Error('Genre API Error'));

      const result = await service.syncAll();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to sync genres: Genre API Error');
    });

    it('should return error if movie sync fails after successful genre sync', async () => {
      // Mock successful genre sync
      mockMoviesProviderService.getGenres.mockResolvedValue([]);

      // Mock failed movie sync
      mockMoviesProviderService.getMovies.mockRejectedValue(new Error('Movie API Error'));

      const result = await service.syncAll();

      expect(result.success).toBe(false);
      expect(result.message).toBe('No movies could be fetched from the provider. This may be due to network issues or API problems.');
    });

    it('should handle general errors', async () => {
      // Force an error in the try-catch block
      jest.spyOn(service, 'syncGenres').mockRejectedValue(new Error('Unexpected error'));

      const result = await service.syncAll();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to sync data: Unexpected error');
    });
  });
});

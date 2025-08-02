import { Test, TestingModule } from '@nestjs/testing';
import { SyncController } from './sync.controller';
import { DatabaseSyncService, SyncResult } from '../services/database-sync.service';

describe('SyncController', () => {
  let controller: SyncController;
  let mockDatabaseSyncService: jest.Mocked<DatabaseSyncService>;

  const mockSyncResult: SyncResult = {
    success: true,
    message: 'Sync completed successfully',
    data: {
      newGenres: 5,
      newMovies: 10,
      totalProcessed: 20,
    },
  };

  beforeEach(async () => {
    mockDatabaseSyncService = {
      syncGenres: jest.fn(),
      syncMovies: jest.fn(),
      syncAll: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SyncController],
      providers: [
        {
          provide: DatabaseSyncService,
          useValue: mockDatabaseSyncService,
        },
      ],
    }).compile();

    controller = module.get<SyncController>(SyncController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('syncGenres', () => {
    it('should call databaseSyncService.syncGenres and return result', async () => {
      const expectedResult: SyncResult = {
        success: true,
        message: 'Successfully synced 5 new genres',
        data: { newGenres: 5 },
      };
      mockDatabaseSyncService.syncGenres.mockResolvedValue(expectedResult);

      const result = await controller.syncGenres();

      expect(mockDatabaseSyncService.syncGenres).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });

    it('should handle sync failure', async () => {
      const expectedResult: SyncResult = {
        success: false,
        message: 'Failed to sync genres: API error',
      };
      mockDatabaseSyncService.syncGenres.mockResolvedValue(expectedResult);

      const result = await controller.syncGenres();

      expect(mockDatabaseSyncService.syncGenres).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('syncMovies', () => {
    it('should call databaseSyncService.syncMovies and return result', async () => {
      const expectedResult: SyncResult = {
        success: true,
        message: 'Successfully synced 10 new movies',
        data: { newMovies: 10, totalProcessed: 20 },
      };
      mockDatabaseSyncService.syncMovies.mockResolvedValue(expectedResult);

      const result = await controller.syncMovies();

      expect(mockDatabaseSyncService.syncMovies).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });

    it('should handle sync failure', async () => {
      const expectedResult: SyncResult = {
        success: false,
        message: 'Failed to sync movies: Network error',
      };
      mockDatabaseSyncService.syncMovies.mockResolvedValue(expectedResult);

      const result = await controller.syncMovies();

      expect(mockDatabaseSyncService.syncMovies).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('syncAll', () => {
    it('should call databaseSyncService.syncAll and return result', async () => {
      mockDatabaseSyncService.syncAll.mockResolvedValue(mockSyncResult);

      const result = await controller.syncAll();

      expect(mockDatabaseSyncService.syncAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockSyncResult);
    });

    it('should handle sync failure', async () => {
      const expectedResult: SyncResult = {
        success: false,
        message: 'Failed to sync data: Database connection error',
      };
      mockDatabaseSyncService.syncAll.mockResolvedValue(expectedResult);

      const result = await controller.syncAll();

      expect(mockDatabaseSyncService.syncAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });
  });
});

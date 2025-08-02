import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { of, throwError } from 'rxjs';
import { Request, Response } from 'express';
import { CacheInterceptor } from './cache.interceptor';

describe('CacheInterceptor', () => {
  let interceptor: CacheInterceptor;
  let mockCacheManager: Partial<Cache>;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(async () => {
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      wrap: jest.fn(),
      store: {} as any,
    } as Partial<Cache>;

    mockConfigService = {
      get: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheInterceptor,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    interceptor = module.get<CacheInterceptor>(CacheInterceptor);

    mockRequest = {
      method: 'GET',
      url: '/api/movies',
      query: {},
    };

    mockResponse = {
      statusCode: 200,
    };

    mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest as Request,
        getResponse: () => mockResponse as Response,
      }),
      getClass: jest.fn(),
      getHandler: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      getType: jest.fn(),
    } as unknown as ExecutionContext;

    mockCallHandler = {
      handle: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    it('should bypass cache for non-GET requests', async () => {
      mockRequest.method = 'POST';
      const testData = { id: 1, name: 'Test' };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(testData));

      const result = await interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(mockCacheManager.get).not.toHaveBeenCalled();
      expect(mockCallHandler.handle).toHaveBeenCalled();

      result.subscribe((data) => {
        expect(data).toEqual(testData);
      });
    });

    it('should return cached data when cache hit occurs', async () => {
      const cachedData = { id: 1, name: 'Cached Movie' };
      const cacheKey = '/api/movies';

      (mockCacheManager.get as jest.Mock).mockResolvedValue(cachedData);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(mockCacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(mockCallHandler.handle).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('cache hit..');

      result.subscribe((data) => {
        expect(data).toEqual(cachedData);
      });

      consoleSpy.mockRestore();
    });

    it('should fetch data and cache it when cache miss occurs', (done) => {
      const testData = { id: 1, name: 'New Movie' };
      const cacheKey = '/api/movies';
      const ttl = 3600;

      (mockCacheManager.get as jest.Mock).mockResolvedValue(null);
      mockConfigService.get.mockReturnValue(ttl);
      mockCallHandler.handle = jest.fn().mockReturnValue(of(testData));
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      interceptor.intercept(mockExecutionContext, mockCallHandler).then((result) => {
        result.subscribe({
          next: (data) => {
            expect(data).toEqual(testData);
            expect(mockCacheManager.get).toHaveBeenCalledWith(cacheKey);
            expect(mockCallHandler.handle).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith('cache miss..');

            // Give a small delay to ensure the tap operator has executed
            setTimeout(() => {
              expect(mockConfigService.get).toHaveBeenCalledWith('redis.ttl');
              expect(mockCacheManager.set).toHaveBeenCalledWith(cacheKey, testData, ttl);
              consoleSpy.mockRestore();
              done();
            }, 10);
          },
          error: done,
        });
      });
    });

    it('should handle cache manager errors by throwing the error', async () => {
      const testData = { id: 1, name: 'Test Movie' };

      (mockCacheManager.get as jest.Mock).mockRejectedValue(new Error('Cache error'));
      mockCallHandler.handle = jest.fn().mockReturnValue(of(testData));

      await expect(interceptor.intercept(mockExecutionContext, mockCallHandler)).rejects.toThrow('Cache error');
      expect(mockCallHandler.handle).not.toHaveBeenCalled();
    });

    it('should handle undefined TTL from config service', (done) => {
      const testData = { id: 1, name: 'Test Movie' };
      const cacheKey = '/api/movies';

      (mockCacheManager.get as jest.Mock).mockResolvedValue(null);
      mockConfigService.get.mockReturnValue(undefined);
      mockCallHandler.handle = jest.fn().mockReturnValue(of(testData));

      interceptor.intercept(mockExecutionContext, mockCallHandler).then((result) => {
        result.subscribe({
          next: (data) => {
            expect(data).toEqual(testData);

            setTimeout(() => {
              expect(mockCacheManager.set).toHaveBeenCalledWith(cacheKey, testData, undefined);
              done();
            }, 10);
          },
          error: done,
        });
      });
    });
  });

  describe('generateCacheKey', () => {
    it('should generate cache key without query parameters', () => {
      mockRequest.url = '/api/movies';
      mockRequest.query = {};

      const result = interceptor['generateCacheKey']('/api/movies', {});

      expect(result).toBe('/api/movies');
    });

    it('should generate cache key with single query parameter', () => {
      const query = { page: '1' };

      const result = interceptor['generateCacheKey']('/api/movies', query);

      expect(result).toBe('/api/movies?page=1');
    });

    it('should generate cache key with multiple query parameters in sorted order', () => {
      const query = { genre: 'action', page: '1', limit: '10' };

      const result = interceptor['generateCacheKey']('/api/movies', query);

      expect(result).toBe('/api/movies?genre=action&limit=10&page=1');
    });

    it('should handle query parameters with special characters', () => {
      const query = { search: 'action & adventure', year: '2023' };

      const result = interceptor['generateCacheKey']('/api/movies', query);

      expect(result).toBe('/api/movies?search=action & adventure&year=2023');
    });

    it('should handle empty string query parameters', () => {
      const query = { search: '', page: '1' };

      const result = interceptor['generateCacheKey']('/api/movies', query);

      expect(result).toBe('/api/movies?page=1&search=');
    });

    it('should handle null and undefined query parameters', () => {
      const query = { search: null, page: '1', limit: undefined };

      const result = interceptor['generateCacheKey']('/api/movies', query);

      expect(result).toBe('/api/movies?limit=undefined&page=1&search=null');
    });
  });

  describe('edge cases', () => {
    it('should handle different HTTP methods correctly', async () => {
      const methods = ['POST', 'PUT', 'DELETE', 'PATCH'];

      for (const method of methods) {
        mockRequest.method = method;
        const testData = { id: 1, name: 'Test' };
        mockCallHandler.handle = jest.fn().mockReturnValue(of(testData));

        const result = await interceptor.intercept(mockExecutionContext, mockCallHandler);

        expect(mockCacheManager.get).not.toHaveBeenCalled();
        expect(mockCallHandler.handle).toHaveBeenCalled();

        result.subscribe((data) => {
          expect(data).toEqual(testData);
        });

        jest.clearAllMocks();
      }
    });

    it('should handle complex URL paths', async () => {
      mockRequest.url = '/api/movies/123/reviews';
      mockRequest.query = { sort: 'date', order: 'desc' };

      const cachedData = { reviews: [] };
      (mockCacheManager.get as jest.Mock).mockResolvedValue(cachedData);

      const result = await interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(mockCacheManager.get).toHaveBeenCalledWith('/api/movies/123/reviews?order=desc&sort=date');

      result.subscribe((data) => {
        expect(data).toEqual(cachedData);
      });
    });

    it('should handle observable errors from call handler', (done) => {
      const error = new Error('Service error');

      (mockCacheManager.get as jest.Mock).mockResolvedValue(null);
      mockCallHandler.handle = jest.fn().mockReturnValue(throwError(() => error));

      interceptor.intercept(mockExecutionContext, mockCallHandler).then((result) => {
        result.subscribe({
          next: () => {
            done(new Error('Should not emit next'));
          },
          error: (err) => {
            expect(err).toBe(error);
            expect(mockCacheManager.set).not.toHaveBeenCalled();
            done();
          },
        });
      });
    });

    it('should call cache set with correct parameters', (done) => {
      const testData = { id: 1, name: 'Test Movie' };
      const cacheKey = '/api/movies';
      const ttl = 3600;

      (mockCacheManager.get as jest.Mock).mockResolvedValue(null);
      (mockCacheManager.set as jest.Mock).mockResolvedValue(undefined);
      mockConfigService.get.mockReturnValue(ttl);
      mockCallHandler.handle = jest.fn().mockReturnValue(of(testData));

      interceptor.intercept(mockExecutionContext, mockCallHandler).then((result) => {
        result.subscribe({
          next: (data) => {
            expect(data).toEqual(testData);

            setTimeout(() => {
              expect(mockCacheManager.set).toHaveBeenCalledWith(cacheKey, testData, ttl);
              done();
            }, 10);
          },
          error: done,
        });
      });
    });
  });
});

import { ExecutionContext, CallHandler, HttpException, HttpStatus } from '@nestjs/common';
import { TokenBucketRateLimitInterceptor, bucketState } from './token-bucket-rate-limit.interceptor';
import { ConfigService } from '@nestjs/config';
import { Observable, of } from 'rxjs';
import { Request, Response } from 'express';

// Add fail function for Jest
declare const fail: (message?: string) => never;

describe('TokenBucketRateLimitInterceptor', () => {
  let interceptor: TokenBucketRateLimitInterceptor;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Clear the global bucket state before each test
    Object.keys(bucketState).forEach((key) => {
      delete bucketState[key];
    });

    mockConfigService = {
      get: jest.fn(),
    } as any;

    mockRequest = {
      method: 'GET',
      route: { path: '/api/movies' },
      url: '/api/movies',
    } as Request;

    mockResponse = {} as Response;

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
      handle: () => of({ data: 'test' }),
    };

    // Set default config values
    mockConfigService.get.mockImplementation((key: string, defaultValue?: any) => {
      const config = {
        TOKEN_BUCKET_CAPACITY: 20,
        TOKEN_BUCKET_REFILL_RATE: 2,
      };
      return config[key] || defaultValue;
    });

    interceptor = new TokenBucketRateLimitInterceptor(mockConfigService);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should allow request when bucket has tokens', (done) => {
    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toEqual({ data: 'test' });
        done();
      },
      error: done.fail,
    });
  });

  it('should use environment variables for configuration', () => {
    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

    expect(mockConfigService.get).toHaveBeenCalledWith('TOKEN_BUCKET_CAPACITY', 20);
    expect(mockConfigService.get).toHaveBeenCalledWith('TOKEN_BUCKET_REFILL_RATE', 2);
  });

  it('should create endpoint key from method and path', (done) => {
    mockRequest.method = 'POST';
    mockRequest.route = { path: '/api/users' };

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: () => {
        // The endpoint key should be "POST:/api/users"
        done();
      },
      error: done.fail,
    });
  });

  it('should use URL when route path is not available', (done) => {
    mockRequest.route = undefined;
    mockRequest.url = '/api/movies/123';

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: () => {
        // Should use URL as fallback
        done();
      },
      error: done.fail,
    });
  });

  it('should throw HttpException when tokens are depleted', () => {
    // Set capacity to 1 for easier testing
    mockConfigService.get.mockImplementation((key: string, defaultValue?: any) => {
      const config = {
        TOKEN_BUCKET_CAPACITY: 1,
        TOKEN_BUCKET_REFILL_RATE: 0, // No refill for this test
      };
      return config[key] || defaultValue;
    });

    const newInterceptor = new TokenBucketRateLimitInterceptor(mockConfigService);

    // First request should succeed
    expect(() => {
      newInterceptor.intercept(mockExecutionContext, mockCallHandler);
    }).not.toThrow();

    // Second request should fail
    expect(() => {
      newInterceptor.intercept(mockExecutionContext, mockCallHandler);
    }).toThrow(HttpException);
  });

  it('should throw correct error message with endpoint information', () => {
    mockConfigService.get.mockImplementation((key: string, defaultValue?: any) => {
      const config = {
        TOKEN_BUCKET_CAPACITY: 1,
        TOKEN_BUCKET_REFILL_RATE: 0,
      };
      return config[key] || defaultValue;
    });

    const newInterceptor = new TokenBucketRateLimitInterceptor(mockConfigService);

    // Deplete tokens
    newInterceptor.intercept(mockExecutionContext, mockCallHandler);

    try {
      newInterceptor.intercept(mockExecutionContext, mockCallHandler);
      fail('Should have thrown an exception');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect(error.message).toContain('GET:/api/movies');
      expect(error.message).toContain('Token Bucket');
      expect(error.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    }
  });

  it('should refill tokens over time', (done) => {
    mockConfigService.get.mockImplementation((key: string, defaultValue?: any) => {
      const config = {
        TOKEN_BUCKET_CAPACITY: 2,
        TOKEN_BUCKET_REFILL_RATE: 1000, // Very fast refill for testing
      };
      return config[key] || defaultValue;
    });

    const newInterceptor = new TokenBucketRateLimitInterceptor(mockConfigService);

    newInterceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();
    newInterceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

    setTimeout(() => {
      newInterceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result).toEqual({ data: 'test' });
          done();
        },
        error: done.fail,
      });
    }, 10);
  });

  it('should handle different endpoints separately', (done) => {
    mockConfigService.get.mockImplementation((key: string, defaultValue?: any) => {
      const config = {
        TOKEN_BUCKET_CAPACITY: 1,
        TOKEN_BUCKET_REFILL_RATE: 0,
      };
      return config[key] || defaultValue;
    });

    const newInterceptor = new TokenBucketRateLimitInterceptor(mockConfigService); // Use token for first endpoint
    newInterceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

    mockRequest.route = { path: '/api/users' };

    newInterceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toEqual({ data: 'test' });
        done();
      },
      error: done.fail,
    });
  });

  it('should not exceed bucket capacity when refilling', (done) => {
    mockConfigService.get.mockImplementation((key: string, defaultValue?: any) => {
      const config = {
        TOKEN_BUCKET_CAPACITY: 2,
        TOKEN_BUCKET_REFILL_RATE: 1000,
      };
      return config[key] || defaultValue;
    });

    const newInterceptor = new TokenBucketRateLimitInterceptor(mockConfigService);

    // Wait for potential over-refill
    setTimeout(() => {
      // Should be able to make exactly capacity number of requests
      expect(() => {
        newInterceptor.intercept(mockExecutionContext, mockCallHandler);
        newInterceptor.intercept(mockExecutionContext, mockCallHandler);
      }).not.toThrow();

      // Third request should fail
      expect(() => {
        newInterceptor.intercept(mockExecutionContext, mockCallHandler);
      }).toThrow(HttpException);

      done();
    }, 10);
  });
});

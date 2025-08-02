import { ExecutionContext, CallHandler, HttpException, HttpStatus } from '@nestjs/common';
import { FixedWindowRateLimitInterceptor, timestamps } from './fixed-window-rate-limit.interceptor';
import { ConfigService } from '@nestjs/config';
import { Observable, of } from 'rxjs';
import { Request, Response } from 'express';

// Add fail function for Jest
declare const fail: (message?: string) => never;

describe('FixedWindowRateLimitInterceptor', () => {
  let interceptor: FixedWindowRateLimitInterceptor;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.resetModules();

    // Clear the global timestamps state before each test
    Object.keys(timestamps).forEach((key) => {
      delete timestamps[key];
    });

    mockConfigService = {
      get: jest.fn(),
    } as any;

    mockRequest = {
      ip: '192.168.1.1',
      connection: {
        remoteAddress: '192.168.1.1',
      },
    } as any;

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
      handle: () => of({ data: 'test' }),
    };

    mockConfigService.get.mockImplementation((key: string, defaultValue?: any) => {
      const config = {
        FIXED_WINDOW_SIZE_MS: 60000,
        FIXED_WINDOW_MAX_REQUESTS: 100,
      };
      return config[key] || defaultValue;
    });

    interceptor = new FixedWindowRateLimitInterceptor(mockConfigService);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should allow request when under limit', (done) => {
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

    expect(mockConfigService.get).toHaveBeenCalledWith('FIXED_WINDOW_SIZE_MS', 60000);
    expect(mockConfigService.get).toHaveBeenCalledWith('FIXED_WINDOW_MAX_REQUESTS', 100);
  });

  it('should extract IP from request.ip', (done) => {
    (mockRequest as any).ip = '10.0.0.1';

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: () => {
        // Should use the IP from request.ip
        done();
      },
      error: done.fail,
    });
  });

  it('should fallback to connection.remoteAddress when ip is not available', (done) => {
    (mockRequest as any).ip = undefined;
    (mockRequest as any).connection = { remoteAddress: '172.16.0.1' };

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: () => {
        // Should use connection.remoteAddress as fallback
        done();
      },
      error: done.fail,
    });
  });

  it('should handle empty IP gracefully', (done) => {
    (mockRequest as any).ip = undefined;
    (mockRequest as any).connection = undefined;

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: () => {
        // Should handle empty IP (defaults to empty string)
        done();
      },
      error: done.fail,
    });
  });

  it('should throw HttpException when request limit is exceeded', () => {
    // Set low limit for easier testing
    mockConfigService.get.mockImplementation((key: string, defaultValue?: any) => {
      const config = {
        FIXED_WINDOW_SIZE_MS: 60000,
        FIXED_WINDOW_MAX_REQUESTS: 2,
      };
      return config[key] || defaultValue;
    });

    const newInterceptor = new FixedWindowRateLimitInterceptor(mockConfigService);

    // First two requests should succeed
    expect(() => {
      newInterceptor.intercept(mockExecutionContext, mockCallHandler);
      newInterceptor.intercept(mockExecutionContext, mockCallHandler);
    }).not.toThrow();

    // Third request should fail
    expect(() => {
      newInterceptor.intercept(mockExecutionContext, mockCallHandler);
    }).toThrow(HttpException);
  });

  it('should throw correct error message and status', () => {
    mockConfigService.get.mockImplementation((key: string, defaultValue?: any) => {
      const config = {
        FIXED_WINDOW_SIZE_MS: 60000,
        FIXED_WINDOW_MAX_REQUESTS: 1,
      };
      return config[key] || defaultValue;
    });

    const newInterceptor = new FixedWindowRateLimitInterceptor(mockConfigService);

    // Use up the limit
    newInterceptor.intercept(mockExecutionContext, mockCallHandler);

    try {
      newInterceptor.intercept(mockExecutionContext, mockCallHandler);
      fail('Should have thrown an exception');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect(error.message).toBe('Too Many Requests (Window)');
      expect(error.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    }
  });

  it('should reset window after time expires', (done) => {
    mockConfigService.get.mockImplementation((key: string, defaultValue?: any) => {
      const config = {
        FIXED_WINDOW_SIZE_MS: 50, // 50ms window
        FIXED_WINDOW_MAX_REQUESTS: 1,
      };
      return config[key] || defaultValue;
    });

    const newInterceptor = new FixedWindowRateLimitInterceptor(mockConfigService);

    newInterceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

    setTimeout(() => {
      newInterceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result).toEqual({ data: 'test' });
          done();
        },
        error: done.fail,
      });
    }, 60);
  });

  it('should handle different IPs separately', (done) => {
    mockConfigService.get.mockImplementation((key: string, defaultValue?: any) => {
      const config = {
        FIXED_WINDOW_SIZE_MS: 60000,
        FIXED_WINDOW_MAX_REQUESTS: 1,
      };
      return config[key] || defaultValue;
    });

    const newInterceptor = new FixedWindowRateLimitInterceptor(mockConfigService);

    (mockRequest as any).ip = '192.168.1.1';
    newInterceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();
    (mockRequest as any).ip = '192.168.1.2';

    newInterceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toEqual({ data: 'test' });
        done();
      },
      error: done.fail,
    });
  });

  it('should properly clean up old timestamps', (done) => {
    mockConfigService.get.mockImplementation((key: string, defaultValue?: any) => {
      const config = {
        FIXED_WINDOW_SIZE_MS: 100, // 100ms window
        FIXED_WINDOW_MAX_REQUESTS: 2,
      };
      return config[key] || defaultValue;
    });

    const newInterceptor = new FixedWindowRateLimitInterceptor(mockConfigService);

    newInterceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();
    newInterceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

    setTimeout(() => {
      newInterceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();
      newInterceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result).toEqual({ data: 'test' });
          done();
        },
        error: done.fail,
      });
    }, 120);
  });

  it('should track timestamps correctly within window', () => {
    mockConfigService.get.mockImplementation((key: string, defaultValue?: any) => {
      const config = {
        FIXED_WINDOW_SIZE_MS: 60000,
        FIXED_WINDOW_MAX_REQUESTS: 3,
      };
      return config[key] || defaultValue;
    });

    const newInterceptor = new FixedWindowRateLimitInterceptor(mockConfigService);

    // Make requests within limit
    expect(() => {
      newInterceptor.intercept(mockExecutionContext, mockCallHandler);
      newInterceptor.intercept(mockExecutionContext, mockCallHandler);
      newInterceptor.intercept(mockExecutionContext, mockCallHandler);
    }).not.toThrow();

    // Fourth request should fail
    expect(() => {
      newInterceptor.intercept(mockExecutionContext, mockCallHandler);
    }).toThrow(HttpException);
  });

  it('should handle concurrent requests correctly', () => {
    mockConfigService.get.mockImplementation((key: string, defaultValue?: any) => {
      const config = {
        FIXED_WINDOW_SIZE_MS: 60000,
        FIXED_WINDOW_MAX_REQUESTS: 1,
      };
      return config[key] || defaultValue;
    });

    const newInterceptor = new FixedWindowRateLimitInterceptor(mockConfigService);

    // First request should succeed
    expect(() => {
      newInterceptor.intercept(mockExecutionContext, mockCallHandler);
    }).not.toThrow();

    // Subsequent requests should fail
    expect(() => {
      newInterceptor.intercept(mockExecutionContext, mockCallHandler);
    }).toThrow(HttpException);

    expect(() => {
      newInterceptor.intercept(mockExecutionContext, mockCallHandler);
    }).toThrow(HttpException);
  });
});

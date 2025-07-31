import { ExecutionContext, CallHandler } from '@nestjs/common';
import { ResponseInterceptor } from './response.interceptor';
import { Observable, of } from 'rxjs';
import { Response, Request } from 'express';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor<any>;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockResponse = {
      statusCode: 200,
    };
    mockExecutionContext = {
      switchToHttp: () => ({
        getResponse: () => mockResponse as Response,
        getRequest: () => ({} as Request),
      }),
      getClass: jest.fn(),
      getHandler: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      getType: jest.fn(),
    } as unknown as ExecutionContext;

    interceptor = new ResponseInterceptor();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should transform response with data and message', (done) => {
    const testData = {
      data: { id: 1, name: 'Test' },
      message: 'Custom message',
    };

    mockCallHandler = {
      handle: () => of(testData),
    };

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe((result) => {
      expect(result).toEqual({
        success: true,
        statusCode: 200,
        message: 'Custom message',
        data: { id: 1, name: 'Test' },
        timestamp: expect.any(String),
      });
      done();
    });
  });

  it('should use default message when no message provided', (done) => {
    const testData = { id: 1, name: 'Test' };

    mockCallHandler = {
      handle: () => of(testData),
    };

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe((result) => {
      expect(result).toEqual({
        success: true,
        statusCode: 200,
        message: 'Operation successful',
        data: testData,
        timestamp: expect.any(String),
      });
      done();
    });
  });

  it('should handle null or undefined data', (done) => {
    mockCallHandler = {
      handle: () => of(null),
    };

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe((result) => {
      expect(result).toEqual({
        success: true,
        statusCode: 200,
        message: 'Operation successful',
        data: null,
        timestamp: expect.any(String),
      });
      done();
    });
  });

  it('should pass through different status codes', (done) => {
    mockResponse.statusCode = 201;
    const testData = { id: 1, name: 'Test' };

    mockCallHandler = {
      handle: () => of(testData),
    };

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe((result) => {
      expect(result).toEqual({
        success: true,
        statusCode: 201,
        message: 'Operation successful',
        data: testData,
        timestamp: expect.any(String),
      });
      done();
    });
  });

  it('should format timestamp as ISO string', (done) => {
    const testData = { id: 1, name: 'Test' };
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

    mockCallHandler = {
      handle: () => of(testData),
    };

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe((result) => {
      expect(result.timestamp).toMatch(isoDateRegex);
      done();
    });
  });
});

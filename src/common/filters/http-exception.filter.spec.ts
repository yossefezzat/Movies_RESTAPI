import { Test, TestingModule } from '@nestjs/testing';
import { ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: Partial<Response>;
  let mockRequest: Partial<Request>;
  let mockArgumentsHost: Partial<ArgumentsHost>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HttpExceptionFilter],
    }).compile();

    filter = module.get<HttpExceptionFilter>(HttpExceptionFilter);

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockRequest = {
      method: 'GET',
      url: '/test',
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    };

    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('catch', () => {
    it('should handle HttpException with string message', () => {
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost as ArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Test error',
        errors: ['Test error'],
        timestamp: expect.any(String),
        path: '/test',
      });
    });

    it('should handle HttpException with object response', () => {
      const errorResponse = {
        message: ['Field is required', 'Invalid format'],
        error: 'Bad Request',
      };
      const exception = new HttpException(errorResponse, HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost as ArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Field is required',
        errors: ['Field is required', 'Invalid format'],
        timestamp: expect.any(String),
        path: '/test',
      });
    });

    it('should handle HttpException with single message in array', () => {
      const errorResponse = {
        message: ['Single error message'],
        error: 'Bad Request',
      };
      const exception = new HttpException(errorResponse, HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost as ArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Single error message',
        errors: ['Single error message'],
        timestamp: expect.any(String),
        path: '/test',
      });
    });

    it('should handle non-HttpException as internal server error', () => {
      const exception = new Error('Unexpected error');

      filter.catch(exception, mockArgumentsHost as ArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        errors: ['Internal server error'],
        timestamp: expect.any(String),
        path: '/test',
      });
      expect(Logger.prototype.error).toHaveBeenCalledWith('Internal Server Error: Unexpected error', exception.stack, 'GET /test');
    });

    it('should handle exception without message', () => {
      const exception = {};

      filter.catch(exception, mockArgumentsHost as ArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        errors: ['Internal server error'],
        timestamp: expect.any(String),
        path: '/test',
      });
    });

    it('should handle HttpException with object response without message', () => {
      const errorResponse = {
        error: 'Bad Request',
      };
      const exception = new HttpException(errorResponse, HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost as ArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Http Exception',
        errors: ['Http Exception'],
        timestamp: expect.any(String),
        path: '/test',
      });
    });

    it('should not log non-500 errors', () => {
      const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);

      filter.catch(exception, mockArgumentsHost as ArgumentsHost);

      expect(Logger.prototype.error).not.toHaveBeenCalled();
    });
  });
});

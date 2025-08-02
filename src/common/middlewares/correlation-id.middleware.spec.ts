import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response, NextFunction } from 'express';
import { CorrelationIdMiddleware } from './correlation-id.middleware';
import { CorrelationIdService } from '../services/logger/correlation-id.service';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-1234'),
}));

describe('CorrelationIdMiddleware', () => {
  let middleware: CorrelationIdMiddleware;
  let correlationIdService: jest.Mocked<CorrelationIdService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  const mockCorrelationIdService = {
    setCorrelationId: jest.fn(),
    getCorrelationId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CorrelationIdMiddleware,
        {
          provide: CorrelationIdService,
          useValue: mockCorrelationIdService,
        },
      ],
    }).compile();

    middleware = module.get<CorrelationIdMiddleware>(CorrelationIdMiddleware);
    correlationIdService = module.get(CorrelationIdService);

    mockRequest = {
      headers: {},
    };

    mockResponse = {
      setHeader: jest.fn(),
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  describe('use', () => {
    it('should use existing correlation ID from request headers', () => {
      const existingCorrelationId = 'existing-correlation-id';
      mockRequest.headers = {
        'x-correlation-id': existingCorrelationId,
      };

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(correlationIdService.setCorrelationId).toHaveBeenCalledWith(existingCorrelationId);
      expect(mockRequest.headers['x-correlation-id']).toBe(existingCorrelationId);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('x-correlation-id', existingCorrelationId);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should generate new correlation ID when not present in headers', () => {
      mockRequest.headers = {};

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(correlationIdService.setCorrelationId).toHaveBeenCalledWith('mocked-uuid-1234');
      expect(mockRequest.headers['x-correlation-id']).toBe('mocked-uuid-1234');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('x-correlation-id', 'mocked-uuid-1234');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle empty correlation ID header', () => {
      mockRequest.headers = {
        'x-correlation-id': '',
      };

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(correlationIdService.setCorrelationId).toHaveBeenCalledWith('mocked-uuid-1234');
      expect(mockRequest.headers['x-correlation-id']).toBe('mocked-uuid-1234');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('x-correlation-id', 'mocked-uuid-1234');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle correlation ID as array', () => {
      mockRequest.headers = {
        'x-correlation-id': ['first-id', 'second-id'] as any,
      };

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(correlationIdService.setCorrelationId).toHaveBeenCalledWith(['first-id', 'second-id']);
      expect(mockRequest.headers['x-correlation-id']).toEqual(['first-id', 'second-id']);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('x-correlation-id', ['first-id', 'second-id']);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should not find correlation ID with different case header name', () => {
      mockRequest.headers = {
        'X-Correlation-ID': 'case-insensitive-id',
      };

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(correlationIdService.setCorrelationId).toHaveBeenCalledWith('mocked-uuid-1234');
      expect(mockRequest.headers['x-correlation-id']).toBe('mocked-uuid-1234');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('x-correlation-id', 'mocked-uuid-1234');
      expect(mockNext).toHaveBeenCalled();
    });
  });
});

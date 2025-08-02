import { Test, TestingModule } from '@nestjs/testing';
import { AppLoggerService } from './logger.service';
import { CorrelationIdService } from './correlation-id.service';
import * as winston from 'winston';

jest.mock('winston', () => {
  const mockLogger = {
    log: jest.fn(),
    add: jest.fn(),
  };

  return {
    createLogger: jest.fn(() => mockLogger),
    format: {
      combine: jest.fn(),
      timestamp: jest.fn(),
      ms: jest.fn(),
      json: jest.fn(),
      colorize: jest.fn(),
      printf: jest.fn(),
      simple: jest.fn(),
      prettyPrint: jest.fn(),
    },
    transports: {
      Console: jest.fn(),
    },
  };
});

describe('AppLoggerService', () => {
  let service: AppLoggerService;
  let correlationIdService: jest.Mocked<CorrelationIdService>;
  let mockWinstonLogger: jest.Mocked<winston.Logger>;

  const mockCorrelationIdService = {
    getCorrelationId: jest.fn(),
    setCorrelationId: jest.fn(),
  };

  beforeEach(async () => {
    // Reset winston mocks
    mockWinstonLogger = {
      log: jest.fn(),
      add: jest.fn(),
    } as any;

    (winston.createLogger as jest.Mock).mockReturnValue(mockWinstonLogger);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppLoggerService,
        {
          provide: CorrelationIdService,
          useValue: mockCorrelationIdService,
        },
      ],
    }).compile();

    // Use resolve() for scoped providers (transient and request scoped)
    service = await module.resolve<AppLoggerService>(AppLoggerService);
    correlationIdService = await module.resolve(CorrelationIdService);

    // Reset only the correlation service mocks, not winston mocks
    mockCorrelationIdService.getCorrelationId.mockClear();
    mockCorrelationIdService.setCorrelationId.mockClear();
    mockWinstonLogger.log.mockClear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create winston logger on instantiation', () => {
    expect(winston.createLogger).toHaveBeenCalled();
  });

  describe('setContext', () => {
    it('should set the context', () => {
      const context = 'TestService';
      service.setContext(context);

      // Test that context is used in subsequent log calls
      correlationIdService.getCorrelationId.mockReturnValue('test-correlation-id');
      service.log('test message');

      expect(mockWinstonLogger.log).toHaveBeenCalledWith({
        level: 'info',
        message: 'test message',
        context: 'TestService',
        correlationId: 'test-correlation-id',
      });
    });
  });

  describe('log', () => {
    it('should log info message with correlation ID', () => {
      correlationIdService.getCorrelationId.mockReturnValue('test-correlation-id');

      service.log('Test message');

      expect(mockWinstonLogger.log).toHaveBeenCalledWith({
        level: 'info',
        message: 'Test message',
        context: undefined,
        correlationId: 'test-correlation-id',
      });
    });

    it('should log with context parameter', () => {
      correlationIdService.getCorrelationId.mockReturnValue('test-correlation-id');

      service.log('Test message', 'TestContext');

      expect(mockWinstonLogger.log).toHaveBeenCalledWith({
        level: 'info',
        message: 'Test message',
        context: 'TestContext',
        correlationId: 'test-correlation-id',
      });
    });

    it('should log with context and metadata', () => {
      correlationIdService.getCorrelationId.mockReturnValue('test-correlation-id');
      const metadata = { userId: '123', action: 'create' };

      service.log('Test message', 'TestContext', metadata);

      expect(mockWinstonLogger.log).toHaveBeenCalledWith({
        level: 'info',
        message: 'Test message',
        context: 'TestContext',
        correlationId: 'test-correlation-id',
        userId: '123',
        action: 'create',
      });
    });

    it('should use fallback correlation ID when none exists', () => {
      correlationIdService.getCorrelationId.mockReturnValue('');

      service.log('Test message');

      expect(mockWinstonLogger.log).toHaveBeenCalledWith({
        level: 'info',
        message: 'Test message',
        context: undefined,
        correlationId: 'no-correlation-id',
      });
    });
  });

  describe('error', () => {
    it('should log error message with trace', () => {
      correlationIdService.getCorrelationId.mockReturnValue('test-correlation-id');

      service.error('Error message', 'Stack trace', 'ErrorContext');

      expect(mockWinstonLogger.log).toHaveBeenCalledWith({
        level: 'error',
        message: 'Error message',
        context: 'ErrorContext',
        correlationId: 'test-correlation-id',
        trace: 'Stack trace',
      });
    });

    it('should handle Error object', () => {
      correlationIdService.getCorrelationId.mockReturnValue('test-correlation-id');
      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      service.error(error, undefined, 'ErrorContext');

      expect(mockWinstonLogger.log).toHaveBeenCalledWith({
        level: 'error',
        message: 'Test error',
        context: 'ErrorContext',
        correlationId: 'test-correlation-id',
        error: {
          name: 'Error',
          stack: 'Error stack trace',
        },
      });
    });

    it('should log error without trace', () => {
      correlationIdService.getCorrelationId.mockReturnValue('test-correlation-id');

      service.error('Error message', undefined, 'ErrorContext');

      expect(mockWinstonLogger.log).toHaveBeenCalledWith({
        level: 'error',
        message: 'Error message',
        context: 'ErrorContext',
        correlationId: 'test-correlation-id',
      });
    });
  });

  describe('warn', () => {
    it('should log warning message', () => {
      correlationIdService.getCorrelationId.mockReturnValue('test-correlation-id');

      service.warn('Warning message', 'WarnContext');

      expect(mockWinstonLogger.log).toHaveBeenCalledWith({
        level: 'warn',
        message: 'Warning message',
        context: 'WarnContext',
        correlationId: 'test-correlation-id',
      });
    });

    it('should log warning with metadata', () => {
      correlationIdService.getCorrelationId.mockReturnValue('test-correlation-id');
      const metadata = { component: 'auth' };

      service.warn('Warning message', 'WarnContext', metadata);

      expect(mockWinstonLogger.log).toHaveBeenCalledWith({
        level: 'warn',
        message: 'Warning message',
        context: 'WarnContext',
        correlationId: 'test-correlation-id',
        component: 'auth',
      });
    });
  });

  describe('debug', () => {
    it('should log debug message', () => {
      correlationIdService.getCorrelationId.mockReturnValue('test-correlation-id');

      service.debug('Debug message', 'DebugContext');

      expect(mockWinstonLogger.log).toHaveBeenCalledWith({
        level: 'debug',
        message: 'Debug message',
        context: 'DebugContext',
        correlationId: 'test-correlation-id',
      });
    });
  });

  describe('context inheritance', () => {
    it('should use set context when no context parameter provided', () => {
      correlationIdService.getCorrelationId.mockReturnValue('test-correlation-id');
      service.setContext('GlobalContext');

      service.log('Test message');

      expect(mockWinstonLogger.log).toHaveBeenCalledWith({
        level: 'info',
        message: 'Test message',
        context: 'GlobalContext',
        correlationId: 'test-correlation-id',
      });
    });

    it('should override set context with parameter context', () => {
      correlationIdService.getCorrelationId.mockReturnValue('test-correlation-id');
      service.setContext('GlobalContext');

      service.log('Test message', 'OverrideContext');

      expect(mockWinstonLogger.log).toHaveBeenCalledWith({
        level: 'info',
        message: 'Test message',
        context: 'OverrideContext',
        correlationId: 'test-correlation-id',
      });
    });
  });
});

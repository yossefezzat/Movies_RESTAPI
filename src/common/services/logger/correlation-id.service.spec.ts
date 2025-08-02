import { Test, TestingModule } from '@nestjs/testing';
import { CorrelationIdService } from './correlation-id.service';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-1234'),
}));

describe('CorrelationIdService', () => {
  let service: CorrelationIdService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CorrelationIdService],
    }).compile();

    service = await module.resolve<CorrelationIdService>(CorrelationIdService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCorrelationId', () => {
    it('should generate a new correlation ID if none exists', () => {
      const correlationId = service.getCorrelationId();

      expect(correlationId).toBe('mocked-uuid-1234');
    });

    it('should return the same correlation ID on subsequent calls', () => {
      const firstCall = service.getCorrelationId();
      const secondCall = service.getCorrelationId();

      expect(firstCall).toBe('mocked-uuid-1234');
      expect(secondCall).toBe('mocked-uuid-1234');
      expect(firstCall).toBe(secondCall);
    });

    it('should return existing correlation ID after it has been set', () => {
      service.setCorrelationId('custom-correlation-id');
      const correlationId = service.getCorrelationId();

      expect(correlationId).toBe('custom-correlation-id');
    });
  });

  describe('setCorrelationId', () => {
    it('should set the correlation ID', () => {
      const customId = 'custom-correlation-id-123';
      service.setCorrelationId(customId);

      const retrievedId = service.getCorrelationId();
      expect(retrievedId).toBe(customId);
    });

    it('should overwrite existing correlation ID', () => {
      service.setCorrelationId('first-id');
      service.setCorrelationId('second-id');

      const retrievedId = service.getCorrelationId();
      expect(retrievedId).toBe('second-id');
    });

    it('should generate new ID when correlation ID is set to empty string', () => {
      service.setCorrelationId('');

      const retrievedId = service.getCorrelationId();
      expect(retrievedId).toBe('mocked-uuid-1234');
    });

    it('should generate new ID when correlation ID is set to null', () => {
      service.setCorrelationId(null as any);

      const retrievedId = service.getCorrelationId();
      expect(retrievedId).toBe('mocked-uuid-1234');
    });

    it('should generate new ID when correlation ID is set to undefined', () => {
      service.setCorrelationId(undefined as any);

      const retrievedId = service.getCorrelationId();
      expect(retrievedId).toBe('mocked-uuid-1234');
    });
  });

  describe('integration scenarios', () => {
    it('should maintain correlation ID throughout request lifecycle', () => {
      // Simulate middleware setting correlation ID
      const requestCorrelationId = 'request-123';
      service.setCorrelationId(requestCorrelationId);

      // Simulate multiple service calls during request
      const id1 = service.getCorrelationId();
      const id2 = service.getCorrelationId();
      const id3 = service.getCorrelationId();

      expect(id1).toBe(requestCorrelationId);
      expect(id2).toBe(requestCorrelationId);
      expect(id3).toBe(requestCorrelationId);
    });

    it('should generate new ID when no ID is set initially', () => {
      // Simulate service being called without middleware setting ID
      const generatedId = service.getCorrelationId();

      expect(generatedId).toBe('mocked-uuid-1234');

      // Subsequent calls should return the same generated ID
      const sameId = service.getCorrelationId();
      expect(sameId).toBe(generatedId);
    });
  });
});

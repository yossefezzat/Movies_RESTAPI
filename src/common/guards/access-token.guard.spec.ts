import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AccessTokenGuard } from './access-token.guard';

describe('AccessTokenGuard', () => {
  let guard: AccessTokenGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AccessTokenGuard],
    }).compile();

    guard = module.get<AccessTokenGuard>(AccessTokenGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('handleRequest', () => {
    it('should return user when valid user is provided', () => {
      const mockUser = {
        sub: '123e4567-e89b-12d3-a456-426614174000',
        username: 'testuser',
      };

      const result = guard.handleRequest(null, mockUser);

      expect(result).toBe(mockUser);
    });

    it('should throw UnauthorizedException when error is provided', () => {
      const error = new Error('Authentication failed');
      const mockUser = {
        sub: '123e4567-e89b-12d3-a456-426614174000',
        username: 'testuser',
      };

      expect(() => guard.handleRequest(error, mockUser)).toThrow(UnauthorizedException);
      expect(() => guard.handleRequest(error, mockUser)).toThrow('Invalid access token');
    });

    it('should throw UnauthorizedException when user is null', () => {
      expect(() => guard.handleRequest(null, null)).toThrow(UnauthorizedException);
      expect(() => guard.handleRequest(null, null)).toThrow('Invalid access token');
    });

    it('should throw UnauthorizedException when user is undefined', () => {
      expect(() => guard.handleRequest(null, undefined)).toThrow(UnauthorizedException);
      expect(() => guard.handleRequest(null, undefined)).toThrow('Invalid access token');
    });

    it('should throw UnauthorizedException when both error and no user', () => {
      const error = new Error('Authentication failed');

      expect(() => guard.handleRequest(error, null)).toThrow(UnauthorizedException);
      expect(() => guard.handleRequest(error, null)).toThrow('Invalid access token');
    });
  });
});

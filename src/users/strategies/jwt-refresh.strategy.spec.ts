import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtRefreshStrategy } from './jwt-refresh.strategy';
import { UsersService } from '../services/users.service';

describe('JwtRefreshStrategy', () => {
  let strategy: JwtRefreshStrategy;
  let usersService: UsersService;
  let configService: ConfigService;
  let module: TestingModule;

  const mockUsersService = {
    findById: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Set default mock implementation
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'jwt.refreshSecret') return 'test-refresh-secret';
      if (key === 'JWT_REFRESH_SECRET') return 'fallback-refresh-secret';
      return null;
    });

    module = await Test.createTestingModule({
      providers: [
        JwtRefreshStrategy,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtRefreshStrategy>(JwtRefreshStrategy);
    usersService = module.get<UsersService>(UsersService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('constructor', () => {
    it('should throw error when JWT_REFRESH_SECRET is not configured', async () => {
      const mockConfigServiceFail = {
        get: jest.fn().mockReturnValue(null),
      };

      await expect(
        Test.createTestingModule({
          providers: [
            JwtRefreshStrategy,
            {
              provide: UsersService,
              useValue: mockUsersService,
            },
            {
              provide: ConfigService,
              useValue: mockConfigServiceFail,
            },
          ],
        }).compile(),
      ).rejects.toThrow('JWT_REFRESH_SECRET is not configured');
    });

    it('should initialize with jwt.refreshSecret from config', async () => {
      const mockConfigServicePrimary = {
        get: jest.fn((key: string) => {
          if (key === 'jwt.refreshSecret') return 'primary-refresh-secret';
          return null;
        }),
      };

      await expect(
        Test.createTestingModule({
          providers: [
            JwtRefreshStrategy,
            {
              provide: UsersService,
              useValue: mockUsersService,
            },
            {
              provide: ConfigService,
              useValue: mockConfigServicePrimary,
            },
          ],
        }).compile(),
      ).resolves.toBeDefined();
    });

    it('should fallback to JWT_REFRESH_SECRET when jwt.refreshSecret is not available', async () => {
      const mockConfigServiceFallback = {
        get: jest.fn((key: string) => {
          if (key === 'jwt.refreshSecret') return null;
          if (key === 'JWT_REFRESH_SECRET') return 'fallback-secret';
          return null;
        }),
      };

      await expect(
        Test.createTestingModule({
          providers: [
            JwtRefreshStrategy,
            {
              provide: UsersService,
              useValue: mockUsersService,
            },
            {
              provide: ConfigService,
              useValue: mockConfigServiceFallback,
            },
          ],
        }).compile(),
      ).resolves.toBeDefined();
    });

    it('should use first available secret when both are configured', async () => {
      const mockConfigServiceBoth = {
        get: jest.fn((key: string) => {
          if (key === 'jwt.refreshSecret') return 'primary-secret';
          if (key === 'JWT_REFRESH_SECRET') return 'fallback-secret';
          return null;
        }),
      };

      await expect(
        Test.createTestingModule({
          providers: [
            JwtRefreshStrategy,
            {
              provide: UsersService,
              useValue: mockUsersService,
            },
            {
              provide: ConfigService,
              useValue: mockConfigServiceBoth,
            },
          ],
        }).compile(),
      ).resolves.toBeDefined();
    });
  });

  describe('validate', () => {
    const mockPayload = {
      sub: 'user-id-123',
      username: 'testuser',
      iat: 1234567890,
      exp: 1234567890,
    };

    const mockUser = {
      id: 'user-id-123',
      username: 'testuser',
      email: 'test@example.com',
    };

    it('should return user when valid payload is provided', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await strategy.validate(mockPayload);

      expect(usersService.findById).toHaveBeenCalledWith('user-id-123');
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      mockUsersService.findById.mockResolvedValue(null);

      await expect(strategy.validate(mockPayload)).rejects.toThrow(new UnauthorizedException('User not found'));
      expect(usersService.findById).toHaveBeenCalledWith('user-id-123');
    });

    it('should throw UnauthorizedException when user is undefined', async () => {
      mockUsersService.findById.mockResolvedValue(undefined);

      await expect(strategy.validate(mockPayload)).rejects.toThrow(new UnauthorizedException('User not found'));
      expect(usersService.findById).toHaveBeenCalledWith('user-id-123');
    });

    it('should handle payload with different structure', async () => {
      const customPayload = {
        sub: 'user-id-456',
        email: 'test@example.com',
        role: 'user',
      };

      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await strategy.validate(customPayload);

      expect(usersService.findById).toHaveBeenCalledWith('user-id-456');
      expect(result).toEqual(mockUser);
    });

    it('should handle service errors gracefully', async () => {
      mockUsersService.findById.mockRejectedValue(new Error('Database error'));

      await expect(strategy.validate(mockPayload)).rejects.toThrow('Database error');
      expect(usersService.findById).toHaveBeenCalledWith('user-id-123');
    });
  });
});

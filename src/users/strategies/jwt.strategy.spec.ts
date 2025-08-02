import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../services/users.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: UsersService;
  let configService: ConfigService;

  const mockUsersService = {
    findById: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'jwt.secret') {
        return 'test-secret';
      }
      return null;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
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

    strategy = module.get<JwtStrategy>(JwtStrategy);
    usersService = module.get<UsersService>(UsersService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('constructor', () => {
    it('should throw error when JWT_SECRET is not configured', async () => {
      const mockConfigServiceWithoutSecret = {
        get: jest.fn().mockReturnValue(null),
      };

      await expect(
        Test.createTestingModule({
          providers: [
            JwtStrategy,
            {
              provide: UsersService,
              useValue: mockUsersService,
            },
            {
              provide: ConfigService,
              useValue: mockConfigServiceWithoutSecret,
            },
          ],
        }).compile(),
      ).rejects.toThrow('JWT_SECRET is not configured');
    });

    it('should initialize with valid JWT secret', () => {
      expect(strategy).toBeDefined();
      expect(configService.get).toHaveBeenCalledWith('jwt.secret');
    });
  });

  describe('validate', () => {
    it('should return user when valid payload is provided', async () => {
      const payload: JwtPayload = {
        sub: '1',
        username: 'testuser',
        iat: 1234567890,
        exp: 1234567890,
      };
      const user = { id: '1', username: 'testuser', email: 'test@example.com' };

      mockUsersService.findById.mockResolvedValue(user);

      const result = await strategy.validate(payload);

      expect(result).toEqual(user);
      expect(usersService.findById).toHaveBeenCalledWith('1');
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      const payload: JwtPayload = {
        sub: '1',
        username: 'testuser',
        iat: 1234567890,
        exp: 1234567890,
      };

      mockUsersService.findById.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
      expect(usersService.findById).toHaveBeenCalledWith('1');
    });

    it('should handle service errors gracefully', async () => {
      const payload: JwtPayload = {
        sub: '1',
        username: 'testuser',
        iat: 1234567890,
        exp: 1234567890,
      };

      mockUsersService.findById.mockRejectedValue(new Error('Database error'));

      await expect(strategy.validate(payload)).rejects.toThrow('Database error');
      expect(usersService.findById).toHaveBeenCalledWith('1');
    });
  });
});

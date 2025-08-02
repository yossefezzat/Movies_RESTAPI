import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { LoginDto } from '../dto/login.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { AccessTokenGuard } from '../../common/guards/access-token.guard';
import { RefreshTokenGuard } from '../../common/guards/refresh-token.guard';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  const mockUserResponse = new UserResponseDto({
    id: '123e4567-e89b-12d3-a456-426614174000',
    username: 'testuser',
    fullName: 'Test User',
  });

  const mockUsersService = {
    signUp: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    refreshTokens: jest.fn(),
  };

  const mockAccessTokenGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockRefreshTokenGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue(mockAccessTokenGuard)
      .overrideGuard(RefreshTokenGuard)
      .useValue(mockRefreshTokenGuard)
      .compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signup', () => {
    const createUserDto: CreateUserDto = {
      username: 'newuser',
      password: 'password123',
      fullName: 'New User',
    };

    it('should create a new user successfully', async () => {
      usersService.signUp.mockResolvedValue(mockUserResponse);

      const result = await controller.signup(createUserDto);

      expect(usersService.signUp).toHaveBeenCalledWith(createUserDto);
      expect(result).toBe(mockUserResponse);
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      usersService.signUp.mockRejectedValue(error);

      await expect(controller.signup(createUserDto)).rejects.toThrow('Service error');
      expect(usersService.signUp).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      username: 'testuser',
      password: 'password123',
    };

    const mockLoginResponse = {
      access_token: 'access_token',
      refresh_token: 'refresh_token',
      user: mockUserResponse,
    };

    it('should login user successfully', async () => {
      usersService.login.mockResolvedValue(mockLoginResponse);

      const result = await controller.login(loginDto);

      expect(usersService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toBe(mockLoginResponse);
    });

    it('should handle login errors', async () => {
      const error = new Error('Invalid credentials');
      usersService.login.mockRejectedValue(error);

      await expect(controller.login(loginDto)).rejects.toThrow('Invalid credentials');
      expect(usersService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('logout', () => {
    const mockRequest = {
      user: {
        sub: '123e4567-e89b-12d3-a456-426614174000',
      },
    };

    it('should logout user successfully', async () => {
      usersService.logout.mockResolvedValue(undefined);

      const result = await controller.logout(mockRequest);

      expect(usersService.logout).toHaveBeenCalledWith(mockRequest.user.sub);
      expect(result).toEqual({ message: 'successfully logged out' });
    });

    it('should handle logout errors', async () => {
      const error = new Error('Logout error');
      usersService.logout.mockRejectedValue(error);

      await expect(controller.logout(mockRequest)).rejects.toThrow('Logout error');
      expect(usersService.logout).toHaveBeenCalledWith(mockRequest.user.sub);
    });
  });

  describe('refreshTokens', () => {
    const mockRequest = {
      user: {
        sub: '123e4567-e89b-12d3-a456-426614174000',
        refreshToken: 'valid_refresh_token',
      },
    };

    const mockRefreshResponse = {
      access_token: 'new_access_token',
      refresh_token: 'new_refresh_token',
    };

    it('should refresh tokens successfully', async () => {
      usersService.refreshTokens.mockResolvedValue(mockRefreshResponse);

      const result = await controller.refreshTokens(mockRequest);

      expect(usersService.refreshTokens).toHaveBeenCalledWith(mockRequest.user.sub, mockRequest.user.refreshToken);
      expect(result).toBe(mockRefreshResponse);
    });

    it('should handle refresh token errors', async () => {
      const error = new Error('Invalid refresh token');
      usersService.refreshTokens.mockRejectedValue(error);

      await expect(controller.refreshTokens(mockRequest)).rejects.toThrow('Invalid refresh token');
      expect(usersService.refreshTokens).toHaveBeenCalledWith(mockRequest.user.sub, mockRequest.user.refreshToken);
    });
  });
});

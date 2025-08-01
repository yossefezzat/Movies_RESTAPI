import { Controller, Post, Body, Get, Req, UseGuards } from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenGuard } from '../../common/guards/refresh-token.guard';
import { AccessTokenGuard } from '../../common/guards/access-token.guard';
import { CreateUserDto } from '../dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('signup')
  async signup(@Body() createUserData: CreateUserDto) {
    return this.usersService.signUp(createUserData);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.usersService.login(loginDto);
  }
  @UseGuards(AccessTokenGuard)
  @Post('logout')
  async logout(@Req() req) {
    const userId = req.user['sub'];
    await this.usersService.logout(userId);
    return { message: 'successfully logged out' };
  }

  @Get('refresh')
  @UseGuards(RefreshTokenGuard)
  async refreshTokens(@Req() req) {
    const userId = req.user['sub'];
    const refreshToken = req.user['refreshToken'];
    return this.usersService.refreshTokens(userId, refreshToken);
  }
}

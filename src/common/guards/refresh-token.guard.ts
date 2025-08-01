import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class RefreshTokenGuard extends AuthGuard('jwt-refresh') {
  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return user;
  }
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { UsersService } from './services/users.service';
import { UsersController } from './controllers/users.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.accessTokenExpiration'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    JwtStrategy,
    JwtRefreshStrategy,
    {
      provide: 'ACCESS_TOKEN_JWT_SERVICE',
      useFactory: (configService: ConfigService) => {
        return new JwtService({
          secret: configService.get<string>('jwt.secret'),
          signOptions: {
            expiresIn: configService.get<string>('jwt.accessTokenExpiration'),
          },
        });
      },
      inject: [ConfigService],
    },
    {
      provide: 'REFRESH_TOKEN_JWT_SERVICE',
      useFactory: (configService: ConfigService) => {
        return new JwtService({
          secret: configService.get<string>('jwt.refreshSecret'),
          signOptions: {
            expiresIn: configService.get<string>('jwt.refreshTokenExpiration'),
          },
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}

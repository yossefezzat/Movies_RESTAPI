import { MiddlewareConsumer, Module } from '@nestjs/common';
import AppDataSource from './config/typeorm.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { MoviesProviderModule } from './movies-provider/movies-provider.module';
import { MoviesModule } from './movies/movies.module';
import { UsersModule } from './users/users.module';
import { WatchlistModule } from './watchlist/watchlist.module';
import appConfig from './config/app.config';
import { envValidationSchema } from './config/env.validation';
import { redisStore } from 'cache-manager-redis-yet';
import { CorrelationIdMiddleware } from './common/middlewares/correlation-id.middleware';
import { LoggerModule } from './common/services/logger/logger.module';

@Module({
  imports: [
    LoggerModule,
    ConfigModule.forRoot({
      load: [appConfig],
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async (configService: ConfigService) => {
        const store = await redisStore({
          socket: {
            host: configService.get<string>('redis.host'),
            port: configService.get<number>('redis.port'),
          },
          password: configService.get<string>('redis.password'),
        });
        return {
          store: store,
          ttl: (configService.get<number>('redis.ttl') ?? 60) * 60000,
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forRoot(AppDataSource.options),
    MoviesProviderModule,
    MoviesModule,
    UsersModule,
    WatchlistModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('/*path');
  }
}

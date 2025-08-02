import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import AppDataSource from './config/typeorm.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { MoviesProviderModule } from './movies-provider/movies-provider.module';
import { MoviesModule } from './movies/movies.module';
import { UsersModule } from './users/users.module';
import { WatchlistModule } from './watchlist/watchlist.module';
import appConfig from './config/app.config';
import { envValidationSchema } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfig],
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
    TypeOrmModule.forRoot(AppDataSource.options),
    MoviesProviderModule,
    MoviesModule,
    UsersModule,
    WatchlistModule,
  ],
  providers: [AppService],
})
export class AppModule {}

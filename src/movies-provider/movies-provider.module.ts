import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MoviesProviderController } from './controllers/movies-provider.controller';
import { MoviesProviderService } from './services/movies-provider.service';
import { TmdbProvider } from './providers/tmdb.provider';
import { TmdbClientService } from './providers/tmdb/services/tmdb-client.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  controllers: [MoviesProviderController],
  providers: [
    MoviesProviderService,
    TmdbProvider,
    {
      provide: 'TmdbClientInterface',
      useClass: TmdbClientService,
    },
    {
      provide: 'MOVIE_PROVIDERS',
      useFactory: (tmdbProvider: TmdbProvider) => [tmdbProvider],
      inject: [TmdbProvider],
    },
  ],
  exports: [MoviesProviderService],
})
export class MoviesProviderModule {}

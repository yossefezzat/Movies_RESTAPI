import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncController } from './controllers/sync.controller';
import { MoviesProviderService } from './services/movies-provider.service';
import { DatabaseSyncService } from './services/database-sync.service';
import { TmdbProvider } from './providers/tmdb.provider';
import { TmdbClientService } from './providers/tmdb/services/tmdb-client.service';
import { Movie } from '../movies/entities/movie.entity';
import { Genre } from '../movies/entities/genre.entity';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    ConfigModule,
    TypeOrmModule.forFeature([Movie, Genre]),
  ],
  controllers: [SyncController],
  providers: [
    MoviesProviderService,
    DatabaseSyncService,
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
  exports: [MoviesProviderService, DatabaseSyncService],
})
export class MoviesProviderModule {}

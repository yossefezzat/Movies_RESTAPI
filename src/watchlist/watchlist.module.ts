import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WatchlistController } from './controllers/watchlist.controller';
import { WatchlistService } from './services/watchlist.service';
import { Watchlist } from './entities/watchlist.entity';
import { Movie } from '../movies/entities/movie.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Watchlist, Movie, User])],
  controllers: [WatchlistController],
  providers: [WatchlistService],
  exports: [WatchlistService],
})
export class WatchlistModule {}

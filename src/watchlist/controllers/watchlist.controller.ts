import { Controller, Get, Post, Delete, Body, UseGuards, Req, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { WatchlistService } from '../services/watchlist.service';
import { AddMovieToWatchlistDto } from '../dto/add-movie-to-watchlist.dto';
import { RemoveMovieFromWatchlistDto } from '../dto/remove-movie-from-watchlist.dto';
import { WatchlistDto } from '../dto/watchlist.dto';
import { WatchlistView } from '../views/watchlist.view';
import { AccessTokenGuard } from '../../common/guards/access-token.guard';

@Controller('watchlist')
@UseGuards(AccessTokenGuard)
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Get()
  async getUserWatchlist(@Req() req): Promise<WatchlistDto[]> {
    const userId = req.user.id;
    const watchlist = await this.watchlistService.getUserWatchlist(userId);
    return new WatchlistView(watchlist).render() as WatchlistDto[];
  }

  @Post('movies')
  async addMovieToWatchlist(@Req() req, @Body() addMovieDto: AddMovieToWatchlistDto): Promise<WatchlistDto> {
    const userId = req.user.id;
    const watchlistItem = await this.watchlistService.addMovieToWatchlist(userId, addMovieDto);
    return new WatchlistView(watchlistItem).render() as WatchlistDto;
  }

  @Delete('movies/:movieId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMovieFromWatchlist(@Req() req, @Param('movieId') movieId: string): Promise<void> {
    const userId = req.user.id;
    const removeMovieDto: RemoveMovieFromWatchlistDto = { movieId };
    return this.watchlistService.removeMovieFromWatchlist(userId, removeMovieDto);
  }
}

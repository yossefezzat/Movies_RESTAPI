import { Controller, Get, Post, Delete, Body, UseGuards, Req, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { WatchlistService } from '../services/watchlist.service';
import { AddMovieToWatchlistDto } from '../dto/add-movie-to-watchlist.dto';
import { RemoveMovieFromWatchlistDto } from '../dto/remove-movie-from-watchlist.dto';
import { WatchlistDto } from '../dto/watchlist.dto';
import { WatchlistView } from '../views/watchlist.view';
import { AccessTokenGuard } from '../../common/guards/access-token.guard';

@ApiTags('Watchlist')
@Controller('watchlist')
@UseGuards(AccessTokenGuard)
@ApiBearerAuth('Bearer')
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Get()
  @ApiOperation({ summary: 'Get user watchlist' })
  @ApiResponse({ status: 200, description: 'Watchlist retrieved successfully', type: [WatchlistDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserWatchlist(@Req() req): Promise<WatchlistDto[]> {
    const userId = req.user.id;
    const watchlist = await this.watchlistService.getUserWatchlist(userId);
    return new WatchlistView(watchlist).render() as WatchlistDto[];
  }

  @Post('movies')
  @ApiOperation({ summary: 'Add movie to watchlist' })
  @ApiResponse({ status: 201, description: 'Movie added to watchlist successfully', type: WatchlistDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  @ApiResponse({ status: 409, description: 'Movie already in watchlist' })
  async addMovieToWatchlist(@Req() req, @Body() addMovieDto: AddMovieToWatchlistDto): Promise<WatchlistDto> {
    const userId = req.user.id;
    const watchlistItem = await this.watchlistService.addMovieToWatchlist(userId, addMovieDto);
    return new WatchlistView(watchlistItem).render() as WatchlistDto;
  }

  @Delete('movies/:movieId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove movie from watchlist' })
  @ApiParam({ name: 'movieId', description: 'Movie ID to remove from watchlist' })
  @ApiResponse({ status: 204, description: 'Movie removed from watchlist successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Movie not found in watchlist' })
  async removeMovieFromWatchlist(@Req() req, @Param('movieId') movieId: string): Promise<void> {
    const userId = req.user.id;
    const removeMovieDto: RemoveMovieFromWatchlistDto = { movieId };
    return this.watchlistService.removeMovieFromWatchlist(userId, removeMovieDto);
  }
}

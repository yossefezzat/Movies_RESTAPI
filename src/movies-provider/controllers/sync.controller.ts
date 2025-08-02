import { Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DatabaseSyncService, SyncResult } from '../services/database-sync.service';

export class SyncResponseDto {
  success: boolean;
  message: string;
  data?: {
    newGenres?: number;
    newMovies?: number;
    totalProcessed?: number;
  };
}

@ApiTags('Sync')
@Controller('sync')
export class SyncController {
  constructor(private readonly databaseSyncService: DatabaseSyncService) {}

  @Post('genres')
  @ApiOperation({ summary: 'Sync genres from external movie database' })
  @ApiResponse({ status: 201, description: 'Genres synced successfully', type: SyncResponseDto })
  @ApiResponse({ status: 500, description: 'Internal server error during sync' })
  async syncGenres(): Promise<SyncResult> {
    return await this.databaseSyncService.syncGenres();
  }

  @Post('movies')
  @ApiOperation({ summary: 'Sync movies from external movie database' })
  @ApiResponse({ status: 201, description: 'Movies synced successfully', type: SyncResponseDto })
  @ApiResponse({ status: 500, description: 'Internal server error during sync' })
  async syncMovies(): Promise<SyncResult> {
    return await this.databaseSyncService.syncMovies();
  }

  @Post('all')
  @ApiOperation({ summary: 'Sync all data (genres and movies) from external movie database' })
  @ApiResponse({ status: 201, description: 'All data synced successfully', type: SyncResponseDto })
  @ApiResponse({ status: 500, description: 'Internal server error during sync' })
  async syncAll(): Promise<SyncResult> {
    return await this.databaseSyncService.syncAll();
  }
}

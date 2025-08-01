import { Controller, Post } from '@nestjs/common';
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

@Controller('sync')
export class SyncController {
  constructor(private readonly databaseSyncService: DatabaseSyncService) {}

  @Post('genres')
  async syncGenres(): Promise<SyncResult> {
    return await this.databaseSyncService.syncGenres();
  }

  @Post('movies')
  async syncMovies(): Promise<SyncResult> {
    return await this.databaseSyncService.syncMovies();
  }

  @Post('all')
  async syncAll(): Promise<SyncResult> {
    return await this.databaseSyncService.syncAll();
  }
}

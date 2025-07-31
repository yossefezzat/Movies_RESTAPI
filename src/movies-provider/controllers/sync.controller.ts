import { Controller, Post, UseInterceptors } from '@nestjs/common';
import { DatabaseSyncService, SyncResult } from '../services/database-sync.service';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';

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
@UseInterceptors(ResponseInterceptor)
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

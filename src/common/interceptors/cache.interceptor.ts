import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache, private configService: ConfigService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const { method, url, query } = request;

    if (method !== 'GET') {
      return next.handle();
    }
    const cacheKey = this.generateCacheKey(url, query);
    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) {
      console.log('cache hit..');
      return of(cachedData);
    }

    return next.handle().pipe(
      tap(async (data) => {
        console.log('cache miss..');
        const ttl = this.configService.get<number>('redis.ttl');
        await this.cacheManager.set(cacheKey, data, ttl);
      }),
    );
  }

  private generateCacheKey(url: string, query: any): string {
    const queryString = Object.keys(query)
      .sort()
      .map((key) => `${key}=${query[key]}`)
      .join('&');

    return `${url}${queryString ? '?' + queryString : ''}`;
  }
}

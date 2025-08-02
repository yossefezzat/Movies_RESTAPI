import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException, HttpStatus } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ConfigService } from '@nestjs/config';

export const bucketState: Record<string, { tokens: number; lastRefill: number }> = {};

function getEndpointKey(ctx: ExecutionContext): string {
  const req = ctx.switchToHttp().getRequest();
  const method = req.method;
  const path = req.route?.path || req.url;
  return `${method}:${path}`;
}

@Injectable()
export class TokenBucketRateLimitInterceptor implements NestInterceptor {
  constructor(private readonly configService: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const TOKEN_BUCKET_CAPACITY = this.configService.get<number>('TOKEN_BUCKET_CAPACITY', 20);
    const TOKEN_REFILL_RATE = this.configService.get<number>('TOKEN_BUCKET_REFILL_RATE', 2);

    const endpointKey = getEndpointKey(context);
    const now = Date.now() / 1000;
    if (!bucketState[endpointKey]) {
      bucketState[endpointKey] = { tokens: TOKEN_BUCKET_CAPACITY, lastRefill: now };
    }
    const state = bucketState[endpointKey];
    const elapsed = now - state.lastRefill;
    const refill = Math.floor(elapsed * TOKEN_REFILL_RATE);
    if (refill > 0) {
      state.tokens = Math.min(TOKEN_BUCKET_CAPACITY, state.tokens + refill);
      state.lastRefill = now;
    }
    if (state.tokens > 0) {
      state.tokens -= 1;
      return next.handle();
    }
    throw new HttpException(`Too Many Requests for endpoint ${endpointKey} (Token Bucket)`, HttpStatus.TOO_MANY_REQUESTS);
  }
}

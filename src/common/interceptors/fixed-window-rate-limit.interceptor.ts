import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException, HttpStatus } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ConfigService } from '@nestjs/config';

export const timestamps: Record<string, number[]> = {};

function getClientIp(ctx: ExecutionContext): string {
  const req = ctx.switchToHttp().getRequest();
  return req.ip || req.connection?.remoteAddress || '';
}

@Injectable()
export class FixedWindowRateLimitInterceptor implements NestInterceptor {
  constructor(private readonly configService: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const WINDOW_SIZE = this.configService.get<number>('FIXED_WINDOW_SIZE_MS', 60000);
    const MAX_REQUESTS = this.configService.get<number>('FIXED_WINDOW_MAX_REQUESTS', 100);

    const ip = getClientIp(context);
    const now = Date.now();
    if (!timestamps[ip]) {
      timestamps[ip] = [];
    }
    // Remove timestamps outside the window
    timestamps[ip] = timestamps[ip].filter((ts) => ts > now - WINDOW_SIZE);
    if (timestamps[ip].length >= MAX_REQUESTS) {
      throw new HttpException('Too Many Requests (Window)', HttpStatus.TOO_MANY_REQUESTS);
    }
    timestamps[ip].push(now);
    return next.handle();
  }
}

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { CorrelationIdService } from '../services/logger/correlation-id.service';

/**
 * Middleware to handle correlation IDs for request tracing
 * - Extracts correlation ID from request headers if present
 * - Generates a new correlation ID if not present
 * - Adds correlation ID to response headers
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  private readonly CORRELATION_ID_HEADER = 'x-correlation-id';

  constructor(private correlationIdService: CorrelationIdService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const correlationId = (req.headers[this.CORRELATION_ID_HEADER] as string) || uuidv4();
    this.correlationIdService.setCorrelationId(correlationId);
    req.headers[this.CORRELATION_ID_HEADER] = correlationId;
    res.setHeader(this.CORRELATION_ID_HEADER, correlationId);
    next();
  }
}

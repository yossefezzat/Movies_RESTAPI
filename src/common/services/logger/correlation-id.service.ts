import { Injectable, Scope } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service to manage correlation IDs for request tracing
 * Scoped to the request level to maintain unique correlation ID per request
 */
@Injectable({ scope: Scope.REQUEST })
export class CorrelationIdService {
  private correlationId: string;

  /**
   * Get the current correlation ID
   * If no correlation ID exists, a new one is generated
   * @returns The correlation ID for the current request
   */
  getCorrelationId(): string {
    if (!this.correlationId) {
      this.correlationId = uuidv4();
    }
    return this.correlationId;
  }

  /**
   * Set the correlation ID
   * @param correlationId The correlation ID to set
   */
  setCorrelationId(correlationId: string): void {
    this.correlationId = correlationId;
  }
}

import { Global, Module } from '@nestjs/common';
import { AppLoggerService } from './logger.service';
import { CorrelationIdService } from './correlation-id.service';

/**
 * Global module for logging services
 * Makes logger and correlation ID services available throughout the application
 */
@Global()
@Module({
  providers: [AppLoggerService, CorrelationIdService],
  exports: [AppLoggerService, CorrelationIdService],
})
export class LoggerModule {}

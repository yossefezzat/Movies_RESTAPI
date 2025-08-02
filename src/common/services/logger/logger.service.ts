import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { CorrelationIdService } from './correlation-id.service';
import * as winston from 'winston';

@Injectable({ scope: Scope.TRANSIENT })
export class AppLoggerService implements LoggerService {
  private context?: string;
  private logger: winston.Logger;
  private metadata: Record<string, any> = {};

  constructor(private correlationIdService: CorrelationIdService) {
    const isDevelopment = process.env.NODE_ENV === 'development';

    this.logger = winston.createLogger({
      level: isDevelopment ? 'debug' : 'info',
      format: winston.format.combine(winston.format.timestamp(), winston.format.ms(), winston.format.json()),
      defaultMeta: { service: 'movies-app' },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp(),
            winston.format.printf(({ timestamp, level, message, context, correlationId, ...meta }) => {
              if (isDevelopment) {
                // More readable format for development
                return `${timestamp} ${level} [${correlationId}] ${context ? `[${context}]` : ''} - ${message} ${
                  Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
                }`;
              }
              // Production format
              return `${timestamp} [${correlationId}] [${level}] ${context ? `[${context}]` : ''}: ${message} ${
                Object.keys(meta).length ? JSON.stringify(meta) : ''
              }`;
            }),
          ),
        }),
      ],
    });

    if (isDevelopment) {
      // Add pretty console logging for development
      this.logger.add(
        new winston.transports.Console({
          format: winston.format.combine(winston.format.colorize(), winston.format.simple(), winston.format.prettyPrint()),
        }),
      );
    }
  }

  /**
   * Set the context for the logger
   * @param context The context to set (typically the class name)
   */
  setContext(context: string) {
    this.context = context;
  }

  /**
   * Log a message at the 'error' level
   * @param message The message to log
   * @param trace Optional stack trace
   * @param context Optional context override
   */
  error(message: any, trace?: string, context?: string, metadata?: any): void {
    const meta: Record<string, any> = {};
    if (trace) {
      meta.trace = trace;
    }
    this.writeLog('error', message, context, meta);
  }

  /**
   * Log a message at the 'warn' level
   * @param message The message to log
   * @param context Optional context override
   */
  warn(message: any, context?: string, metadata?: any): void {
    this.writeLog('warn', message, context, metadata);
  }

  /**
   * Log a message at the 'debug' level
   * @param message The message to log
   * @param context Optional context override
   */
  debug(message: any, context?: string, metadata?: any): void {
    this.writeLog('debug', message, context, metadata);
  }

  /**
   * Log a message at the 'info' level (implements LoggerService interface)
   * @param message The message to log
   * @param optionalParams Optional parameters including context and metadata
   */
  log(message: any, ...optionalParams: any[]): void {
    const context = typeof optionalParams[0] === 'string' ? optionalParams[0] : undefined;
    const metadata = optionalParams.length > 1 ? optionalParams[1] : undefined;
    this.writeLog('info', message, context, metadata);
  }

  /**
   * Write a log message with the specified level
   * @param level The log level
   * @param message The message to log
   * @param context Optional context override
   * @param meta Optional metadata
   */
  private writeLog(level: string, message: any, context?: string, meta: Record<string, any> = {}) {
    const correlationId = this.correlationIdService.getCorrelationId() || 'no-correlation-id';
    const contextToUse = context || this.context;

    // Combine constant metadata with request-specific metadata
    const combinedMeta = { ...this.metadata, ...meta };

    // Handle Error objects
    if (message instanceof Error) {
      const { message: msg, name, stack, ...rest } = message;
      this.logger.log({
        level,
        message: msg,
        context: contextToUse,
        correlationId,
        error: { name, stack },
        ...rest,
        ...combinedMeta,
      });
      return;
    }

    // Handle other message types
    this.logger.log({
      level,
      message,
      context: contextToUse,
      correlationId,
      ...combinedMeta,
    });
  }
}

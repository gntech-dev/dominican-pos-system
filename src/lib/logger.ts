/**
 * Production-ready logging system for POS system
 * Replaces console.log with structured logging and monitoring
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  metadata?: Record<string, any>;
  correlationId?: string;
  userId?: string;
  action?: string;
}

class Logger {
  private level: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.level = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.level;
  }

  private formatLog(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const levelName = LogLevel[entry.level];
    
    const logObject = {
      timestamp,
      level: levelName,
      message: entry.message,
      ...(entry.correlationId && { correlationId: entry.correlationId }),
      ...(entry.userId && { userId: entry.userId }),
      ...(entry.action && { action: entry.action }),
      ...(entry.metadata && { metadata: entry.metadata }),
    };

    return this.isDevelopment 
      ? JSON.stringify(logObject, null, 2)
      : JSON.stringify(logObject);
  }

  private writeLog(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    const formattedLog = this.formatLog(entry);

    // In production, use structured logging
    if (!this.isDevelopment) {
      console.log(formattedLog);
    } else {
      // In development, use colored console output
      const colors = {
        [LogLevel.ERROR]: '\x1b[31m', // Red
        [LogLevel.WARN]: '\x1b[33m',  // Yellow
        [LogLevel.INFO]: '\x1b[36m',  // Cyan
        [LogLevel.DEBUG]: '\x1b[37m', // White
      };
      
      const reset = '\x1b[0m';
      const color = colors[entry.level];
      
      console.log(`${color}[${LogLevel[entry.level]}]${reset} ${entry.message}`, 
        entry.metadata ? entry.metadata : '');
    }
  }

  error(message: string, metadata?: Record<string, any>, correlationId?: string, userId?: string): void {
    this.writeLog({
      timestamp: new Date(),
      level: LogLevel.ERROR,
      message,
      metadata,
      correlationId,
      userId,
    });
  }

  warn(message: string, metadata?: Record<string, any>, correlationId?: string, userId?: string): void {
    this.writeLog({
      timestamp: new Date(),
      level: LogLevel.WARN,
      message,
      metadata,
      correlationId,
      userId,
    });
  }

  info(message: string, metadata?: Record<string, any>, correlationId?: string, userId?: string): void {
    this.writeLog({
      timestamp: new Date(),
      level: LogLevel.INFO,
      message,
      metadata,
      correlationId,
      userId,
    });
  }

  debug(message: string, metadata?: Record<string, any>, correlationId?: string, userId?: string): void {
    this.writeLog({
      timestamp: new Date(),
      level: LogLevel.DEBUG,
      message,
      metadata,
      correlationId,
      userId,
    });
  }

  // Business operation specific logging
  auditLog(action: string, userId: string, metadata: Record<string, any>, correlationId?: string): void {
    this.info(`AUDIT: ${action}`, {
      ...metadata,
      auditAction: action,
      isAudit: true,
    }, correlationId, userId);
  }

  // Transaction logging for Dominican Republic compliance
  transactionLog(type: 'SALE' | 'REFUND' | 'VOID', transactionId: string, amount: number, ncf: string, userId: string, metadata?: Record<string, any>): void {
    this.info(`TRANSACTION: ${type}`, {
      transactionId,
      amount,
      ncf,
      type,
      isTransaction: true,
      ...metadata,
    }, transactionId, userId);
  }

  // DGII compliance logging
  dgiiLog(action: string, ncf: string, rnc?: string, metadata?: Record<string, any>, userId?: string): void {
    this.info(`DGII: ${action}`, {
      ncf,
      rnc,
      isDGII: true,
      dgiiAction: action,
      ...metadata,
    }, undefined, userId);
  }

  // Performance monitoring
  performanceLog(operation: string, duration: number, metadata?: Record<string, any>): void {
    if (duration > 1000) { // Log slow operations (>1s)
      this.warn(`SLOW OPERATION: ${operation} took ${duration}ms`, {
        operation,
        duration,
        isPerformance: true,
        ...metadata,
      });
    } else {
      this.debug(`PERFORMANCE: ${operation} took ${duration}ms`, {
        operation,
        duration,
        isPerformance: true,
        ...metadata,
      });
    }
  }
}

// Singleton instance
export const logger = new Logger();

// Convenience functions for global use
export const log = {
  error: (message: string, metadata?: Record<string, any>) => logger.error(message, metadata),
  warn: (message: string, metadata?: Record<string, any>) => logger.warn(message, metadata),
  info: (message: string, metadata?: Record<string, any>) => logger.info(message, metadata),
  debug: (message: string, metadata?: Record<string, any>) => logger.debug(message, metadata),
  audit: (action: string, userId: string, metadata: Record<string, any>) => logger.auditLog(action, userId, metadata),
  transaction: (type: 'SALE' | 'REFUND' | 'VOID', transactionId: string, amount: number, ncf: string, userId: string, metadata?: Record<string, any>) => logger.transactionLog(type, transactionId, amount, ncf, userId, metadata),
  dgii: (action: string, ncf: string, rnc?: string, metadata?: Record<string, any>, userId?: string) => logger.dgiiLog(action, ncf, rnc, metadata, userId),
  performance: (operation: string, duration: number, metadata?: Record<string, any>) => logger.performanceLog(operation, duration, metadata),
};

export default logger;

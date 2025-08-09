/**
 * Database connection pool configuration for production
 * Optimizes PostgreSQL connections for high-volume POS operations
 */

import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

// Connection pool configuration
const connectionPoolConfig = {
  // Maximum number of connections in the pool
  // Calculated based on: (CPU cores * 2) + effective spindle count
  // For typical production server: 4-8 cores = 10-20 connections
  maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '15'),
  
  // Minimum number of connections to maintain
  minConnections: parseInt(process.env.DATABASE_MIN_CONNECTIONS || '2'),
  
  // Connection idle timeout (30 seconds)
  idleTimeout: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '30000'),
  
  // Maximum time to wait for connection (5 seconds)
  acquireTimeout: parseInt(process.env.DATABASE_ACQUIRE_TIMEOUT || '5000'),
  
  // Connection validation timeout
  validationTimeout: parseInt(process.env.DATABASE_VALIDATION_TIMEOUT || '1000'),
};

// Prisma configuration for production
const prismaConfig = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: [
    {
      emit: 'event' as const,
      level: 'query' as const,
    },
    {
      emit: 'event' as const,
      level: 'error' as const,
    },
    {
      emit: 'event' as const,
      level: 'info' as const,
    },
    {
      emit: 'event' as const,
      level: 'warn' as const,
    },
  ],
};

// Global Prisma instance with connection pooling
declare global {
  var __prisma: PrismaClient | undefined;
}

// Create Prisma client with optimized configuration
export const createPrismaClient = (): PrismaClient => {
  const client = new PrismaClient(prismaConfig);

  // Set up event listeners for monitoring
  client.$on('query', (e) => {
    if (e.duration > 1000) { // Log slow queries (>1s)
      logger.warn('Slow database query detected', {
        query: e.query,
        duration: e.duration,
        params: e.params,
      });
    } else if (process.env.NODE_ENV === 'development') {
      logger.debug('Database query executed', {
        query: e.query,
        duration: e.duration,
      });
    }
  });

  client.$on('error', (e) => {
    logger.error('Database error occurred', {
      target: e.target,
      message: e.message,
    });
  });

  client.$on('info', (e) => {
    logger.info('Database info', {
      target: e.target,
      message: e.message,
    });
  });

  client.$on('warn', (e) => {
    logger.warn('Database warning', {
      target: e.target,
      message: e.message,
    });
  });

  return client;
};

// Singleton pattern for Prisma client
const prisma = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Connection health check
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const duration = Date.now() - start;
    
    logger.debug('Database health check completed', { duration });
    
    if (duration > 5000) {
      logger.warn('Database health check slow', { duration });
    }
    
    return true;
  } catch (error) {
    logger.error('Database health check failed', { error });
    return false;
  }
};

// Get connection pool statistics
export const getConnectionPoolStats = async () => {
  try {
    const result = await prisma.$queryRaw`
      SELECT 
        state,
        count(*) as count
      FROM pg_stat_activity 
      WHERE datname = current_database()
      GROUP BY state
    ` as Array<{ state: string; count: bigint }>;

    const stats = {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      idleInTransactionConnections: 0,
    };

    result.forEach((row) => {
      const count = Number(row.count);
      stats.totalConnections += count;
      
      switch (row.state) {
        case 'active':
          stats.activeConnections = count;
          break;
        case 'idle':
          stats.idleConnections = count;
          break;
        case 'idle in transaction':
          stats.idleInTransactionConnections = count;
          break;
      }
    });

    return stats;
  } catch (error) {
    logger.error('Failed to get connection pool stats', { error });
    return null;
  }
};

// Optimize connection for specific operations
export const withOptimizedConnection = async <T>(
  operation: (client: PrismaClient) => Promise<T>,
  timeout: number = 30000
): Promise<T> => {
  const start = Date.now();
  
  try {
    const result = await Promise.race([
      operation(prisma),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Database operation timeout')), timeout)
      ),
    ]);
    
    const duration = Date.now() - start;
    logger.info('Database operation completed', { duration });
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error('Database operation failed', { 
      error, 
      duration,
      timeout 
    });
    throw error;
  }
};

// Transaction wrapper with automatic retry
export const withTransaction = async <T>(
  operation: (tx: PrismaClient) => Promise<T>,
  maxRetries: number = 3
): Promise<T> => {
  let lastError: Error = new Error('Unknown transaction error');
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        return await operation(tx as any);
      }, {
        maxWait: 5000,
        timeout: 30000,
      });
    } catch (error) {
      lastError = error as Error;
      
      logger.warn('Transaction attempt failed', {
        attempt,
        maxRetries,
        error: lastError.message,
      });
      
      // Only retry on connection or deadlock errors
      if (attempt < maxRetries && 
          (lastError.message.includes('connection') || 
           lastError.message.includes('deadlock'))) {
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        continue;
      }
      
      break;
    }
  }
  
  logger.error('Transaction failed after all retries', {
    maxRetries,
    error: lastError.message,
  });
  
  throw lastError;
};

// Graceful shutdown
export const closeDatabaseConnection = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('Database connection closed gracefully');
  } catch (error) {
    logger.error('Error closing database connection', { error });
  }
};

// Export configured client
export { prisma };
export default prisma;

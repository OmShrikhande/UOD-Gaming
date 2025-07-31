import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Advanced Logging System
 * Implements structured logging with rotation, filtering, and monitoring
 */

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define colors for console output
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

winston.addColors(logColors);

/**
 * Custom log format
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Add stack trace for errors
    if (stack) {
      log += `\nStack: ${stack}`;
    }
    
    // Add metadata
    if (Object.keys(meta).length > 0) {
      log += `\nMeta: ${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

/**
 * Console format for development
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} ${level}: ${message}`;
    
    if (stack && process.env.NODE_ENV === 'development') {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

/**
 * Create daily rotate file transport
 */
const createRotateTransport = (filename, level = 'info') => {
  return new DailyRotateFile({
    filename: path.join(__dirname, '../logs', `${filename}-%DATE%.log`),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    level,
    format: logFormat
  });
};

/**
 * Create logger instance
 */
const logger = winston.createLogger({
  levels: logLevels,
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: logFormat,
  defaultMeta: {
    service: 'uod-gaming-server',
    version: process.env.API_VERSION || '2.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Console transport for development
    ...(process.env.NODE_ENV !== 'production' ? [
      new winston.transports.Console({
        format: consoleFormat
      })
    ] : []),
    
    // File transports
    createRotateTransport('combined', 'info'),
    createRotateTransport('error', 'error'),
    createRotateTransport('debug', 'debug'),
    
    // Separate transport for HTTP requests
    new DailyRotateFile({
      filename: path.join(__dirname, '../logs', 'http-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      level: 'http',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ],
  
  // Handle exceptions and rejections
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(__dirname, '../logs', 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d'
    })
  ],
  
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(__dirname, '../logs', 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d'
    })
  ]
});

/**
 * HTTP request logger middleware
 */
export const httpLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  logger.http('HTTP Request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?._id,
    timestamp: new Date().toISOString()
  });
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const responseTime = Date.now() - startTime;
    
    logger.http('HTTP Response', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: res.get('content-length'),
      userId: req.user?._id,
      timestamp: new Date().toISOString()
    });
    
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

/**
 * Error logger middleware
 */
export const errorLogger = (err, req, res, next) => {
  logger.error('Application Error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.user?._id,
    body: req.body,
    query: req.query,
    params: req.params,
    timestamp: new Date().toISOString()
  });
  
  next(err);
};

/**
 * Security event logger
 */
export const securityLogger = {
  logFailedLogin: (email, ip, userAgent) => {
    logger.warn('Failed Login Attempt', {
      event: 'failed_login',
      email,
      ip,
      userAgent,
      timestamp: new Date().toISOString()
    });
  },
  
  logSuspiciousActivity: (userId, activity, details) => {
    logger.warn('Suspicious Activity', {
      event: 'suspicious_activity',
      userId,
      activity,
      details,
      timestamp: new Date().toISOString()
    });
  },
  
  logRateLimitExceeded: (ip, endpoint, limit) => {
    logger.warn('Rate Limit Exceeded', {
      event: 'rate_limit_exceeded',
      ip,
      endpoint,
      limit,
      timestamp: new Date().toISOString()
    });
  },
  
  logPaymentAttempt: (userId, transactionId, amount, status) => {
    logger.info('Payment Attempt', {
      event: 'payment_attempt',
      userId,
      transactionId,
      amount,
      status,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Performance logger
 */
export const performanceLogger = {
  logDatabaseQuery: (query, duration, collection) => {
    logger.debug('Database Query', {
      event: 'db_query',
      query: typeof query === 'object' ? JSON.stringify(query) : query,
      duration: `${duration}ms`,
      collection,
      timestamp: new Date().toISOString()
    });
  },
  
  logCacheOperation: (operation, key, hit, duration) => {
    logger.debug('Cache Operation', {
      event: 'cache_operation',
      operation,
      key,
      hit,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  },
  
  logFileOperation: (operation, filename, size, duration) => {
    logger.debug('File Operation', {
      event: 'file_operation',
      operation,
      filename,
      size,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Business logic logger
 */
export const businessLogger = {
  logUserRegistration: (userId, email, role) => {
    logger.info('User Registration', {
      event: 'user_registration',
      userId,
      email,
      role,
      timestamp: new Date().toISOString()
    });
  },
  
  logGameUpload: (userId, gameId, title) => {
    logger.info('Game Upload', {
      event: 'game_upload',
      userId,
      gameId,
      title,
      timestamp: new Date().toISOString()
    });
  },
  
  logPaymentVerification: (paymentId, userId, amount, status) => {
    logger.info('Payment Verification', {
      event: 'payment_verification',
      paymentId,
      userId,
      amount,
      status,
      timestamp: new Date().toISOString()
    });
  },
  
  logGroupCreation: (groupId, creatorId, name) => {
    logger.info('Group Creation', {
      event: 'group_creation',
      groupId,
      creatorId,
      name,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Create child logger with additional context
 */
export const createChildLogger = (context) => {
  return logger.child(context);
};

/**
 * Log system startup
 */
export const logStartup = () => {
  logger.info('🚀 UOD Gaming Server Starting', {
    event: 'server_startup',
    nodeVersion: process.version,
    platform: process.platform,
    environment: process.env.NODE_ENV,
    port: process.env.PORT,
    timestamp: new Date().toISOString()
  });
};

/**
 * Log system shutdown
 */
export const logShutdown = (signal) => {
  logger.info('🛑 UOD Gaming Server Shutting Down', {
    event: 'server_shutdown',
    signal,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
};

export default logger;
export {
  logger,
  httpLogger,
  errorLogger,
  securityLogger,
  performanceLogger,
  businessLogger,
  createChildLogger,
  logStartup,
  logShutdown
};
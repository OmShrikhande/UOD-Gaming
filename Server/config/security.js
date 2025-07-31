import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';

/**
 * Enhanced Security Configuration
 * Implements comprehensive security measures for production deployment
 */

/**
 * Helmet configuration for security headers
 */
export const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      connectSrc: ["'self'", "wss:", "ws:"],
      workerSrc: ["'self'"],
      manifestSrc: ["'self'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  
  // Cross-Origin Embedder Policy
  crossOriginEmbedderPolicy: false,
  
  // Cross-Origin Resource Policy
  crossOriginResourcePolicy: { policy: "cross-origin" },
  
  // DNS Prefetch Control
  dnsPrefetchControl: { allow: false },
  
  // Frameguard
  frameguard: { action: 'deny' },
  
  // Hide Powered-By header
  hidePoweredBy: true,
  
  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  // IE No Open
  ieNoOpen: true,
  
  // No Sniff
  noSniff: true,
  
  // Origin Agent Cluster
  originAgentCluster: true,
  
  // Permitted Cross-Domain Policies
  permittedCrossDomainPolicies: false,
  
  // Referrer Policy
  referrerPolicy: { policy: "no-referrer" },
  
  // X-XSS-Protection
  xssFilter: true
});

/**
 * Advanced Rate Limiting Configuration
 */
export const createAdvancedRateLimit = (windowMs, max, message, options = {}) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    
    // Advanced options
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false, // Disable X-RateLimit-* headers
    
    // Skip successful requests
    skipSuccessfulRequests: options.skipSuccessful || false,
    
    // Skip failed requests
    skipFailedRequests: options.skipFailed || false,
    
    // Custom key generator for more granular control
    keyGenerator: (req) => {
      // Use combination of IP and user ID if authenticated
      const baseKey = req.ip;
      const userKey = req.user ? req.user._id : '';
      return `${baseKey}:${userKey}`;
    },
    
    // Custom handler for rate limit exceeded
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil(windowMs / 1000),
        timestamp: new Date().toISOString()
      });
    },
    
    // Store for distributed systems (Redis recommended for production)
    ...(process.env.REDIS_URL && {
      store: new (require('rate-limit-redis'))({
        client: require('redis').createClient({
          url: process.env.REDIS_URL
        })
      })
    }),
    
    ...options
  });
};

/**
 * Specific rate limiters for different endpoints
 */
export const rateLimiters = {
  // Authentication endpoints - strict limits
  auth: createAdvancedRateLimit(
    15 * 60 * 1000, // 15 minutes
    5, // 5 attempts
    "Too many authentication attempts. Please try again later.",
    { skipSuccessfulRequests: true }
  ),
  
  // Password reset - very strict
  passwordReset: createAdvancedRateLimit(
    60 * 60 * 1000, // 1 hour
    3, // 3 attempts
    "Too many password reset attempts. Please try again later."
  ),
  
  // File upload - moderate limits
  upload: createAdvancedRateLimit(
    60 * 1000, // 1 minute
    10, // 10 uploads
    "Too many file uploads. Please wait before uploading again."
  ),
  
  // Payment endpoints - strict limits
  payment: createAdvancedRateLimit(
    60 * 60 * 1000, // 1 hour
    5, // 5 payment attempts
    "Too many payment attempts. Please try again later."
  ),
  
  // General API - generous limits
  general: createAdvancedRateLimit(
    60 * 1000, // 1 minute
    100, // 100 requests
    "Too many requests. Please slow down."
  ),
  
  // Chat/messaging - moderate limits
  chat: createAdvancedRateLimit(
    60 * 1000, // 1 minute
    30, // 30 messages
    "Too many messages. Please slow down."
  )
};

/**
 * Input Validation Schemas
 */
export const validationSchemas = {
  // User registration validation
  register: [
    body('username')
      .isLength({ min: 3, max: 30 })
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username must be 3-30 characters and contain only letters, numbers, and underscores'),
    
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    
    body('password')
      .isLength({ min: 8, max: 128 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must be 8-128 characters with at least one uppercase, lowercase, number, and special character'),
    
    body('displayName')
      .optional()
      .isLength({ min: 2, max: 50 })
      .trim()
      .escape()
      .withMessage('Display name must be 2-50 characters')
  ],
  
  // User login validation
  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  
  // Game upload validation
  gameUpload: [
    body('title')
      .isLength({ min: 3, max: 100 })
      .trim()
      .escape()
      .withMessage('Game title must be 3-100 characters'),
    
    body('description')
      .isLength({ min: 10, max: 1000 })
      .trim()
      .escape()
      .withMessage('Game description must be 10-1000 characters'),
    
    body('category')
      .isIn(['action', 'puzzle', 'strategy', 'arcade', 'adventure', 'simulation', 'sports', 'racing'])
      .withMessage('Invalid game category'),
    
    body('tags')
      .optional()
      .isArray({ max: 10 })
      .withMessage('Maximum 10 tags allowed')
  ],
  
  // Payment validation
  payment: [
    body('transactionId')
      .isLength({ min: 10, max: 100 })
      .matches(/^[a-zA-Z0-9]+$/)
      .withMessage('Invalid transaction ID format'),
    
    body('amount')
      .isFloat({ min: 1, max: 10000 })
      .withMessage('Amount must be between 1 and 10000'),
    
    body('upiReference')
      .optional()
      .isLength({ min: 5, max: 50 })
      .withMessage('UPI reference must be 5-50 characters')
  ]
};

/**
 * Validation error handler
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

/**
 * CSRF Protection
 */
export const csrfProtection = (req, res, next) => {
  // Skip CSRF for API endpoints in development
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  
  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = req.session?.csrfToken;
  
  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token'
    });
  }
  
  next();
};

/**
 * Generate CSRF token
 */
export const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Security headers middleware
 */
export const securityHeaders = (req, res, next) => {
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // Add custom security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Add custom application headers
  res.setHeader('X-API-Version', process.env.API_VERSION || '2.0.0');
  res.setHeader('X-Response-Time', Date.now() - req.startTime);
  
  next();
};

/**
 * Request sanitization
 */
export const sanitizeRequest = (req, res, next) => {
  // Remove potentially dangerous characters from query parameters
  for (const key in req.query) {
    if (typeof req.query[key] === 'string') {
      req.query[key] = req.query[key].replace(/[<>]/g, '');
    }
  }
  
  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  
  next();
};

/**
 * Recursively sanitize object properties
 */
const sanitizeObject = (obj) => {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      // Remove script tags and other dangerous content
      obj[key] = obj[key]
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
};

export default {
  helmetConfig,
  createAdvancedRateLimit,
  rateLimiters,
  validationSchemas,
  handleValidationErrors,
  csrfProtection,
  generateCSRFToken,
  securityHeaders,
  sanitizeRequest
};
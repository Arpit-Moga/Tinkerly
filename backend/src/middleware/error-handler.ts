/**
 * Enhanced Error Handler Middleware
 * 
 * This middleware provides comprehensive error handling for the Express application.
 * It integrates with the standardized error system and provides:
 * - Consistent error response formatting
 * - Proper error logging with context
 * - Security-conscious error messages in production
 * - Request context tracking for debugging
 * - Integration with monitoring systems
 */

import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorLogger, errorUtils } from '../errors/index.js';
import { config } from '../config/index.js';

/**
 * Main error handling middleware
 * Processes all errors thrown in the application and formats them consistently
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Normalize error to AppError format
  const normalizedError = errorUtils.normalizeError(err);
  
  // Log error with request context
  ErrorLogger.logWithRequest(normalizedError, req);
  
  // Create standardized error response
  const errorResponse = errorUtils.createErrorResponse(
    normalizedError,
    config.nodeEnv === 'development'
  );
  
  // Add request context for debugging (development only)
  if (config.nodeEnv === 'development') {
    errorResponse.error = {
      ...errorResponse.error,
      path: req.path,
      method: req.method,
      requestId: (req as any).id,
    };
  }
  
  // Send error response
  res.status(normalizedError.statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 * Handles requests to non-existent routes
 */
export const notFoundHandler = (req: Request, res: Response) => {
  const error = new AppError(
    `Route ${req.originalUrl} not found`,
    404,
    'not_found',
    true,
    {
      path: req.path,
      method: req.method,
    },
    'ROUTE_NOT_FOUND'
  );
  
  ErrorLogger.logWithRequest(error, req);
  
  const errorResponse = errorUtils.createErrorResponse(error);
  res.status(404).json(errorResponse);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch and forward errors
 */
export const asyncErrorHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validation error handler
 * Specifically handles Zod validation errors
 */
export const validationErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.name === 'ZodError') {
    const validationError = new AppError(
      'Validation failed',
      400,
      'validation',
      true,
      {
        details: err.errors.map((error: any) => ({
          field: error.path.join('.'),
          message: error.message,
          code: error.code,
        })),
      },
      'VALIDATION_ERROR'
    );
    
    return errorHandler(validationError, req, res, next);
  }
  
  next(err);
};

/**
 * Rate limit error handler
 * Handles rate limiting errors with proper headers
 */
export const rateLimitErrorHandler = (req: Request, res: Response) => {
  const error = new AppError(
    'Too many requests, please try again later',
    429,
    'rate_limit',
    true,
    {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    },
    'RATE_LIMIT_EXCEEDED'
  );
  
  // Set rate limit headers
  res.set({
    'Retry-After': '60',
    'X-RateLimit-Limit': '100',
    'X-RateLimit-Remaining': '0',
    'X-RateLimit-Reset': new Date(Date.now() + 60000).toISOString(),
  });
  
  ErrorLogger.logWithRequest(error, req);
  
  const errorResponse = errorUtils.createErrorResponse(error);
  res.status(429).json(errorResponse);
};

/**
 * Graceful shutdown error handler
 * Handles errors during application shutdown
 */
export const shutdownErrorHandler = (error: Error) => {
  console.error('🚨 Fatal error during shutdown:', error);
  
  // Log to external service if configured
  ErrorLogger.log(error, { context: 'shutdown' });
  
  // Exit with error code
  process.exit(1);
};

/**
 * Unhandled promise rejection handler
 * Catches unhandled promise rejections
 */
export const unhandledRejectionHandler = (reason: any, promise: Promise<any>) => {
  console.error('🚨 Unhandled Promise Rejection:', reason);
  
  const error = errorUtils.normalizeError(reason);
  ErrorLogger.log(error, { 
    context: 'unhandled_rejection',
    promise: promise.toString(),
  });
  
  // In production, you might want to restart the process
  if (config.nodeEnv === 'production') {
    console.error('🔄 Restarting process due to unhandled rejection...');
    process.exit(1);
  }
};

/**
 * Uncaught exception handler
 * Catches uncaught exceptions
 */
export const uncaughtExceptionHandler = (error: Error) => {
  console.error('🚨 Uncaught Exception:', error);
  
  ErrorLogger.log(error, { context: 'uncaught_exception' });
  
  // Always exit on uncaught exceptions
  console.error('🔄 Exiting process due to uncaught exception...');
  process.exit(1);
};
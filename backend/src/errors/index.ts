/**
 * Standardized Error Handling System
 * 
 * This module provides a comprehensive error handling system that:
 * - Defines custom error classes for different scenarios
 * - Provides consistent error formatting
 * - Includes proper error logging and tracking
 * - Supports error recovery strategies
 * - Maintains error context for debugging
 * 
 * Usage:
 * ```typescript
 * import { ValidationError, handleError } from './errors';
 * throw new ValidationError('Invalid input', { field: 'email' });
 * ```
 */

import { ErrorCategory, AppError as IAppError } from '../types/index.js';

/**
 * ============================================================================
 * BASE ERROR CLASSES
 * ============================================================================
 */

/**
 * Base application error class
 * All custom errors should extend this class
 */
export class AppError extends Error implements IAppError {
  public readonly statusCode: number;
  public readonly category: ErrorCategory;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, any>;
  public readonly code?: string;
  public readonly timestamp: Date;

  constructor(
    message: string,
    statusCode: number = 500,
    category: ErrorCategory = 'internal_server',
    isOperational: boolean = true,
    context?: Record<string, any>,
    code?: string
  ) {
    super(message);
    
    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.category = category;
    this.isOperational = isOperational;
    this.context = context;
    this.code = code;
    this.timestamp = new Date();
  }

  /**
   * Convert error to JSON for API responses
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      category: this.category,
      code: this.code,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      ...(process.env.NODE_ENV !== 'production' && { stack: this.stack }),
    };
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    // Return sanitized message for production
    if (process.env.NODE_ENV === 'production' && !this.isOperational) {
      return 'An unexpected error occurred. Please try again later.';
    }
    return this.message;
  }
}

/**
 * ============================================================================
 * SPECIFIC ERROR CLASSES
 * ============================================================================
 */

/**
 * Validation error for invalid input data
 */
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 400, 'validation', true, context, 'VALIDATION_ERROR');
  }
}

/**
 * Authentication error for invalid credentials
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', context?: Record<string, any>) {
    super(message, 401, 'authentication', true, context, 'AUTH_ERROR');
  }
}

/**
 * Authorization error for insufficient permissions
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', context?: Record<string, any>) {
    super(message, 403, 'authorization', true, context, 'AUTHZ_ERROR');
  }
}

/**
 * Not found error for missing resources
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', context?: Record<string, any>) {
    super(`${resource} not found`, 404, 'not_found', true, context, 'NOT_FOUND');
  }
}

/**
 * Rate limiting error
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', context?: Record<string, any>) {
    super(message, 429, 'rate_limit', true, context, 'RATE_LIMIT');
  }
}

/**
 * External API error for third-party service failures
 */
export class ExternalApiError extends AppError {
  constructor(
    service: string,
    message: string = 'External service error',
    context?: Record<string, any>
  ) {
    super(`${service}: ${message}`, 502, 'external_api', true, {
      service,
      ...context,
    }, 'EXTERNAL_API_ERROR');
  }
}

/**
 * Configuration error for invalid setup
 */
export class ConfigurationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 500, 'configuration', false, context, 'CONFIG_ERROR');
  }
}

/**
 * LLM service specific errors
 */
export class LLMServiceError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(`LLM Service: ${message}`, 500, 'external_api', true, context, 'LLM_ERROR');
  }
}

/**
 * WebContainer service specific errors
 */
export class WebContainerError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(`WebContainer: ${message}`, 500, 'internal_server', true, context, 'WEBCONTAINER_ERROR');
  }
}

/**
 * ============================================================================
 * ERROR UTILITIES
 * ============================================================================
 */

/**
 * Error logging utility
 */
export class ErrorLogger {
  /**
   * Log error with appropriate level based on severity
   */
  static log(error: Error | AppError, additionalContext?: Record<string, any>) {
    const isAppError = error instanceof AppError;
    const logLevel = isAppError && error.isOperational ? 'warn' : 'error';
    
    const logData = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      ...(isAppError && {
        statusCode: error.statusCode,
        category: error.category,
        code: error.code,
        context: error.context,
        isOperational: error.isOperational,
      }),
      ...additionalContext,
    };

    // In production, you might want to send this to a logging service
    if (logLevel === 'error') {
      console.error('🚨 ERROR:', logData);
    } else {
      console.warn('⚠️  WARNING:', logData);
    }
  }

  /**
   * Log error with request context
   */
  static logWithRequest(error: Error | AppError, req: any) {
    this.log(error, {
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      requestId: req.id,
    });
  }
}

/**
 * Error handler utility functions
 */
export const errorUtils = {
  /**
   * Check if error is operational (expected)
   */
  isOperationalError: (error: Error): boolean => {
    if (error instanceof AppError) {
      return error.isOperational;
    }
    return false;
  },

  /**
   * Convert unknown error to AppError
   */
  normalizeError: (error: unknown): AppError => {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      return new AppError(
        error.message,
        500,
        'internal_server',
        false,
        { originalError: error.name }
      );
    }

    return new AppError(
      'An unknown error occurred',
      500,
      'internal_server',
      false,
      { originalError: String(error) }
    );
  },

  /**
   * Create error response object
   */
  createErrorResponse: (error: AppError, includeStack: boolean = false) => ({
    success: false,
    error: {
      message: error.getUserMessage(),
      code: error.code,
      category: error.category,
      timestamp: error.timestamp.toISOString(),
      ...(includeStack && { stack: error.stack }),
      ...(error.context && { context: error.context }),
    },
  }),

  /**
   * Handle async errors in Express routes
   */
  asyncHandler: (fn: Function) => {
    return (req: any, res: any, next: any) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  },

  /**
   * Retry utility for external API calls
   */
  withRetry: async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> => {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }

        // Don't retry on client errors (4xx)
        if (error instanceof AppError && error.statusCode >= 400 && error.statusCode < 500) {
          throw error;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }

    throw lastError!;
  },
};

/**
 * ============================================================================
 * ERROR FACTORY FUNCTIONS
 * ============================================================================
 */

/**
 * Factory functions for creating common errors
 */
export const createError = {
  /**
   * Create validation error from Zod error
   */
  fromZodError: (zodError: any): ValidationError => {
    const details = zodError.errors.map((err: any) => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }));

    return new ValidationError('Validation failed', { details });
  },

  /**
   * Create external API error
   */
  externalApi: (service: string, statusCode: number, message: string): ExternalApiError => {
    return new ExternalApiError(service, message, { statusCode });
  },

  /**
   * Create LLM service error
   */
  llmService: (operation: string, message: string, context?: Record<string, any>): LLMServiceError => {
    return new LLMServiceError(`${operation}: ${message}`, { operation, ...context });
  },

  /**
   * Create rate limit error with details
   */
  rateLimit: (limit: number, windowMs: number): RateLimitError => {
    return new RateLimitError(
      `Rate limit exceeded: ${limit} requests per ${windowMs / 1000} seconds`,
      { limit, windowMs }
    );
  },
};

// Note: All exports are already declared above with their class definitions
// No need for additional export statements
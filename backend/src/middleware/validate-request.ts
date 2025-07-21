/**
 * Enhanced Request Validation Middleware
 * 
 * This middleware provides comprehensive request validation using Zod schemas.
 * It integrates with the standardized error system and provides:
 * - Type-safe request validation
 * - Detailed validation error messages
 * - Request sanitization and transformation
 * - Performance monitoring for validation
 * - Integration with logging system
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';
import { ValidationError, ErrorLogger } from '../errors/index.js';
import { config } from '../config/index.js';

/**
 * Validation options for request validation
 */
interface ValidationOptions {
  /** Whether to strip unknown properties */
  stripUnknown?: boolean;
  /** Whether to allow empty body for GET requests */
  allowEmptyBody?: boolean;
  /** Custom error message prefix */
  errorPrefix?: string;
  /** Whether to log validation errors */
  logErrors?: boolean;
}

/**
 * Enhanced request validation middleware
 * Validates request data against Zod schema with comprehensive error handling
 */
export const validateRequest = (
  schema: ZodSchema,
  options: ValidationOptions = {}
) => {
  const {
    stripUnknown = true,
    allowEmptyBody = true,
    errorPrefix = 'Request validation failed',
    logErrors = config.features.enableDebugMode,
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    try {
      // Prepare request data for validation
      const requestData = {
        body: req.body,
        query: req.query,
        params: req.params,
      };

      // Handle empty body for GET requests
      if (allowEmptyBody && req.method === 'GET' && !req.body) {
        requestData.body = {};
      }

      // Validate request data
      const validatedData = schema.parse(requestData);
      
      // Update request with validated data (strips unknown properties if enabled)
      if (stripUnknown) {
        req.body = validatedData.body || req.body;
        req.query = validatedData.query || req.query;
        req.params = validatedData.params || req.params;
      }

      // Add validation metadata to request
      (req as any).validationTime = Date.now() - startTime;
      (req as any).isValidated = true;

      // Log successful validation in debug mode
      if (config.features.enableDebugMode) {
        console.log(`✅ Request validation passed for ${req.method} ${req.path} (${Date.now() - startTime}ms)`);
      }

      next();
    } catch (error) {
      const validationTime = Date.now() - startTime;
      
      if (error instanceof ZodError) {
        // Create detailed validation error
        const validationError = new ValidationError(
          errorPrefix,
          {
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
              code: err.code,
              received: err.received,
              expected: err.expected,
            })),
            validationTime,
            requestMethod: req.method,
            requestPath: req.path,
          }
        );

        // Log validation error if enabled
        if (logErrors) {
          ErrorLogger.logWithRequest(validationError, req);
        }

        // Send validation error response
        return res.status(400).json({
          success: false,
          error: {
            message: validationError.message,
            code: validationError.code,
            details: validationError.context?.details,
            timestamp: new Date().toISOString(),
            validationTime,
          },
        });
      }

      // Handle unexpected validation errors
      const unexpectedError = new ValidationError(
        'Unexpected validation error',
        {
          originalError: error instanceof Error ? error.message : String(error),
          validationTime,
        }
      );

      if (logErrors) {
        ErrorLogger.logWithRequest(unexpectedError, req);
      }

      next(unexpectedError);
    }
  };
};

/**
 * Validate specific request parts
 */
export const validateBody = (schema: ZodSchema, options?: ValidationOptions) => {
  return validateRequest(z.object({ body: schema }), options);
};

export const validateQuery = (schema: ZodSchema, options?: ValidationOptions) => {
  return validateRequest(z.object({ query: schema }), options);
};

export const validateParams = (schema: ZodSchema, options?: ValidationOptions) => {
  return validateRequest(z.object({ params: schema }), options);
};

/**
 * Validation middleware for file uploads
 */
export const validateFileUpload = (
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/gif'],
  maxSize: number = 5 * 1024 * 1024 // 5MB
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const files = req.files as any;
    
    if (!files || Object.keys(files).length === 0) {
      return next();
    }

    try {
      Object.values(files).forEach((file: any) => {
        // Check file type
        if (!allowedTypes.includes(file.mimetype)) {
          throw new ValidationError(
            `Invalid file type: ${file.mimetype}. Allowed types: ${allowedTypes.join(', ')}`,
            { fileName: file.name, fileType: file.mimetype }
          );
        }

        // Check file size
        if (file.size > maxSize) {
          throw new ValidationError(
            `File too large: ${file.size} bytes. Maximum size: ${maxSize} bytes`,
            { fileName: file.name, fileSize: file.size, maxSize }
          );
        }
      });

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Rate limiting validation middleware
 */
export const validateRateLimit = (
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  maxRequests: number = 100
) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean up old entries
    for (const [id, data] of requests.entries()) {
      if (data.resetTime < now) {
        requests.delete(id);
      }
    }

    // Get or create client data
    let clientData = requests.get(clientId);
    if (!clientData || clientData.resetTime < now) {
      clientData = { count: 0, resetTime: now + windowMs };
      requests.set(clientId, clientData);
    }

    // Check rate limit
    if (clientData.count >= maxRequests) {
      const resetTime = new Date(clientData.resetTime);
      
      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': resetTime.toISOString(),
        'Retry-After': Math.ceil((clientData.resetTime - now) / 1000).toString(),
      });

      const rateLimitError = new ValidationError(
        'Rate limit exceeded',
        {
          clientId,
          limit: maxRequests,
          windowMs,
          resetTime: resetTime.toISOString(),
        }
      );

      return res.status(429).json({
        success: false,
        error: {
          message: rateLimitError.message,
          code: 'RATE_LIMIT_EXCEEDED',
          resetTime: resetTime.toISOString(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Increment request count
    clientData.count++;

    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': (maxRequests - clientData.count).toString(),
      'X-RateLimit-Reset': new Date(clientData.resetTime).toISOString(),
    });

    next();
  };
};

/**
 * Content type validation middleware
 */
export const validateContentType = (allowedTypes: string[] = ['application/json']) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip validation for GET, HEAD, and OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    const contentType = req.get('Content-Type');
    
    if (!contentType) {
      const error = new ValidationError(
        'Content-Type header is required',
        { allowedTypes }
      );
      return next(error);
    }

    const isAllowed = allowedTypes.some(type => 
      contentType.toLowerCase().includes(type.toLowerCase())
    );

    if (!isAllowed) {
      const error = new ValidationError(
        `Invalid Content-Type: ${contentType}. Allowed types: ${allowedTypes.join(', ')}`,
        { contentType, allowedTypes }
      );
      return next(error);
    }

    next();
  };
};
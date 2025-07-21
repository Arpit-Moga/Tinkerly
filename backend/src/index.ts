/**
 * LLM Code Generator Backend Server
 * 
 * This is the main entry point for the backend application.
 * It sets up the Express server with comprehensive middleware,
 * error handling, and monitoring capabilities.
 * 
 * Features:
 * - Type-safe configuration management
 * - Comprehensive error handling
 * - Request validation and sanitization
 * - Security middleware
 * - Logging and monitoring
 * - Graceful shutdown handling
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config, configUtils } from './config/index.js';
import { codeGenerationRouter } from './routes/code-generation.js';
import { streamingRouter } from './routes/streaming.js';
import { healthRouter } from './routes/health.js';
import { 
  errorHandler, 
  notFoundHandler,
  validationErrorHandler,
  unhandledRejectionHandler,
  uncaughtExceptionHandler,
  shutdownErrorHandler
} from './middleware/error-handler.js';
import { validateContentType, validateRateLimit } from './middleware/validate-request.js';

/**
 * Initialize Express application with comprehensive middleware setup
 */
const createApp = (): express.Application => {
  const app = express();

  // Trust proxy for accurate IP addresses (important for rate limiting)
  app.set('trust proxy', 1);

  // Security middleware with configuration
  if (config.security.enableHelmet) {
    app.use(helmet({
      crossOriginEmbedderPolicy: false, // Required for WebContainers
      contentSecurityPolicy: configUtils.isProduction() ? undefined : false, // Disable CSP in development
      hsts: configUtils.isProduction(), // Only enable HSTS in production
    }));
  }

  // CORS configuration from config
  app.use(cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
    methods: config.cors.methods,
    allowedHeaders: config.cors.allowedHeaders,
  }));

  // Request parsing middleware
  app.use(express.json({ 
    limit: config.security.requestSizeLimit,
    type: ['application/json', 'text/plain']
  }));
  app.use(express.urlencoded({ 
    extended: true, 
    limit: config.security.requestSizeLimit 
  }));

  // Content type validation for POST/PUT requests
  app.use(validateContentType(['application/json', 'text/plain']));

  // Rate limiting middleware
  app.use(validateRateLimit(
    config.security.rateLimitWindowMs,
    config.security.rateLimitMaxRequests
  ));

  // Logging middleware with configuration
  if (config.logging.enableConsole) {
    app.use(morgan(config.logging.format));
  }

  // Request ID middleware for tracking
  app.use((req, res, next) => {
    (req as any).id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    res.set('X-Request-ID', (req as any).id);
    next();
  });

  // Health check routes (no rate limiting)
  app.use('/api/health', healthRouter);

  // API routes with validation
  app.use('/api/generate', codeGenerationRouter);
  
  // Streaming routes (if feature is enabled)
  if (config.features.enableStreaming) {
    app.use('/api/generate/stream', streamingRouter);
  }

  // Validation error handler (must be before general error handler)
  app.use(validationErrorHandler);

  // General error handling middleware
  app.use(errorHandler);

  // 404 handler for unmatched routes
  app.use('*', notFoundHandler);

  return app;
};

/**
 * Setup process event handlers for graceful shutdown
 */
const setupProcessHandlers = (server: any) => {
  // Handle unhandled promise rejections
  process.on('unhandledRejection', unhandledRejectionHandler);

  // Handle uncaught exceptions
  process.on('uncaughtException', uncaughtExceptionHandler);

  // Graceful shutdown on SIGTERM
  process.on('SIGTERM', () => {
    console.log('📡 SIGTERM received, starting graceful shutdown...');
    
    server.close((err: Error) => {
      if (err) {
        shutdownErrorHandler(err);
      }
      
      console.log('✅ Server closed successfully');
      process.exit(0);
    });
  });

  // Graceful shutdown on SIGINT (Ctrl+C)
  process.on('SIGINT', () => {
    console.log('📡 SIGINT received, starting graceful shutdown...');
    
    server.close((err: Error) => {
      if (err) {
        shutdownErrorHandler(err);
      }
      
      console.log('✅ Server closed successfully');
      process.exit(0);
    });
  });
};

/**
 * Start the server with proper error handling
 */
const startServer = async (): Promise<void> => {
  try {
    // Validate configuration before starting
    if (!configUtils.validateConfig()) {
      throw new Error('Invalid configuration detected');
    }

    // Create Express application
    const app = createApp();

    // Start server
    const server = app.listen(config.port, () => {
      console.log('🚀 LLM Code Generator Backend Started');
      console.log('=====================================');
      console.log(`🌍 Environment: ${config.nodeEnv}`);
      console.log(`🚀 Server: http://localhost:${config.port}`);
      console.log(`📱 Frontend: ${config.cors.origin}`);
      console.log(`🔑 Gemini API: ${config.gemini.apiKey ? '✅ Configured' : '❌ Missing'}`);
      console.log(`🎯 Features: ${configUtils.getConfigSummary().enabledFeatures.join(', ')}`);
      console.log('=====================================');
      
      // Log additional info in development
      if (configUtils.isDevelopment()) {
        console.log('📋 Development Info:');
        console.log(`   - Request size limit: ${config.security.requestSizeLimit}`);
        console.log(`   - Rate limit: ${config.security.rateLimitMaxRequests} requests per ${config.security.rateLimitWindowMs / 1000}s`);
        console.log(`   - Logging level: ${config.logging.level}`);
        console.log('=====================================');
      }
    });

    // Setup graceful shutdown handlers
    setupProcessHandlers(server);

    // Handle server errors
    server.on('error', (error: Error) => {
      console.error('🚨 Server error:', error);
      shutdownErrorHandler(error);
    });

  } catch (error) {
    console.error('🚨 Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer().catch((error) => {
  console.error('🚨 Startup error:', error);
  process.exit(1);
});
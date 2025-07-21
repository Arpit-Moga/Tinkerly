/**
 * Centralized Configuration Management System
 * 
 * This module provides a type-safe, validated configuration system that:
 * - Validates all environment variables at startup
 * - Provides default values where appropriate
 * - Throws descriptive errors for missing required config
 * - Supports different environments (development, production, test)
 * - Enables feature flags for conditional functionality
 * 
 * Usage:
 * ```typescript
 * import { config } from './config';
 * console.log(config.gemini.apiKey); // Type-safe access
 * ```
 */

import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Environment validation schema
 * Defines the structure and validation rules for all configuration
 */
const configSchema = z.object({
  // Application Environment
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.coerce.number().min(1).max(65535).default(3001),
  
  // API Configuration
  gemini: z.object({
    apiKey: z.string().min(1, 'Gemini API key is required'),
    model: z.string().default('gemini-2.5-flash'),
    maxTokens: z.coerce.number().min(1).max(100000).default(8192),
    temperature: z.coerce.number().min(0).max(2).default(0.7),
    timeout: z.coerce.number().min(1000).max(300000).default(30000), // 30 seconds
  }),
  
  // CORS Configuration
  cors: z.object({
    origin: z.string().url().default('http://localhost:3000'),
    credentials: z.boolean().default(true),
    methods: z.array(z.string()).default(['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']),
    allowedHeaders: z.array(z.string()).default(['Content-Type', 'Authorization']),
  }),
  
  // Security Configuration
  security: z.object({
    requestSizeLimit: z.string().default('10mb'),
    rateLimitWindowMs: z.coerce.number().default(15 * 60 * 1000), // 15 minutes
    rateLimitMaxRequests: z.coerce.number().default(100),
    enableHelmet: z.boolean().default(true),
  }),
  
  // Logging Configuration
  logging: z.object({
    level: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    format: z.enum(['combined', 'common', 'dev', 'short', 'tiny']).default('combined'),
    enableConsole: z.boolean().default(true),
    enableFile: z.boolean().default(false),
    filePath: z.string().optional(),
  }),
  
  // Feature Flags
  features: z.object({
    enableStreaming: z.boolean().default(true),
    enableCodeValidation: z.boolean().default(true),
    enableTemplates: z.boolean().default(true),
    enableMetrics: z.boolean().default(false),
    enableDebugMode: z.boolean().default(false),
  }),
});

/**
 * Raw environment variable mapping
 * Maps environment variables to configuration structure
 */
const rawConfig = {
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT,
  
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL,
    maxTokens: process.env.GEMINI_MAX_TOKENS,
    temperature: process.env.GEMINI_TEMPERATURE,
    timeout: process.env.GEMINI_TIMEOUT,
  },
  
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: process.env.CORS_CREDENTIALS === 'true',
    methods: process.env.CORS_METHODS?.split(','),
    allowedHeaders: process.env.CORS_ALLOWED_HEADERS?.split(','),
  },
  
  security: {
    requestSizeLimit: process.env.REQUEST_SIZE_LIMIT,
    rateLimitWindowMs: process.env.RATE_LIMIT_WINDOW_MS,
    rateLimitMaxRequests: process.env.RATE_LIMIT_MAX_REQUESTS,
    enableHelmet: process.env.ENABLE_HELMET !== 'false',
  },
  
  logging: {
    level: process.env.LOG_LEVEL,
    format: process.env.LOG_FORMAT,
    enableConsole: process.env.LOG_ENABLE_CONSOLE !== 'false',
    enableFile: process.env.LOG_ENABLE_FILE === 'true',
    filePath: process.env.LOG_FILE_PATH,
  },
  
  features: {
    enableStreaming: process.env.FEATURE_STREAMING !== 'false',
    enableCodeValidation: process.env.FEATURE_CODE_VALIDATION !== 'false',
    enableTemplates: process.env.FEATURE_TEMPLATES !== 'false',
    enableMetrics: process.env.FEATURE_METRICS === 'true',
    enableDebugMode: process.env.FEATURE_DEBUG_MODE === 'true',
  },
};

/**
 * Validated and typed configuration object
 * This is the main export that should be used throughout the application
 */
export const config = (() => {
  try {
    const validatedConfig = configSchema.parse(rawConfig);
    
    // Log successful configuration load (only in development)
    if (validatedConfig.nodeEnv === 'development') {
      console.log('✅ Configuration loaded successfully');
      console.log(`🌍 Environment: ${validatedConfig.nodeEnv}`);
      console.log(`🚀 Port: ${validatedConfig.port}`);
      console.log(`🔑 Gemini API: ${validatedConfig.gemini.apiKey ? 'Configured' : 'Missing'}`);
      console.log(`🎯 Features: ${Object.entries(validatedConfig.features)
        .filter(([, enabled]) => enabled)
        .map(([feature]) => feature)
        .join(', ')}`);
    }
    
    return validatedConfig;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Configuration validation failed:');
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      console.error('\n💡 Please check your environment variables and .env file');
    } else {
      console.error('❌ Unexpected configuration error:', error);
    }
    
    process.exit(1);
  }
})();

/**
 * Type definitions for configuration
 * These can be imported separately for type checking
 */
export type Config = z.infer<typeof configSchema>;
export type GeminiConfig = Config['gemini'];
export type CorsConfig = Config['cors'];
export type SecurityConfig = Config['security'];
export type LoggingConfig = Config['logging'];
export type FeatureFlags = Config['features'];

/**
 * Utility functions for configuration management
 */
export const configUtils = {
  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled: (feature: keyof FeatureFlags): boolean => {
    return config.features[feature];
  },
  
  /**
   * Get environment-specific configuration
   */
  isDevelopment: (): boolean => config.nodeEnv === 'development',
  isProduction: (): boolean => config.nodeEnv === 'production',
  isTest: (): boolean => config.nodeEnv === 'test',
  
  /**
   * Validate configuration at runtime
   */
  validateConfig: (): boolean => {
    try {
      configSchema.parse(rawConfig);
      return true;
    } catch {
      return false;
    }
  },
  
  /**
   * Get configuration summary for debugging
   */
  getConfigSummary: () => ({
    environment: config.nodeEnv,
    port: config.port,
    geminiConfigured: !!config.gemini.apiKey,
    enabledFeatures: Object.entries(config.features)
      .filter(([, enabled]) => enabled)
      .map(([feature]) => feature),
    corsOrigin: config.cors.origin,
  }),
};

/**
 * Configuration validation middleware
 * Can be used to ensure configuration is valid before starting services
 */
export const validateConfigurationMiddleware = () => {
  if (!configUtils.validateConfig()) {
    throw new Error('Invalid configuration detected');
  }
};
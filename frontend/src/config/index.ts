/**
 * Frontend Configuration Management
 * 
 * This module provides type-safe configuration management for the frontend.
 * It handles environment variables, feature flags, and application settings.
 * 
 * Features:
 * - Type-safe environment variable access
 * - Feature flag management
 * - Default value handling
 * - Runtime configuration validation
 * - Development vs production settings
 */

import { z } from 'zod';

/**
 * Environment validation schema
 * Defines the structure and validation rules for frontend configuration
 */
const configSchema = z.object({
  // Application Configuration
  app: z.object({
    title: z.string().default('LLM Code Generator'),
    version: z.string().default('1.0.0'),
    environment: z.enum(['development', 'production', 'test']).default('development'),
  }),
  
  // API Configuration
  api: z.object({
    geminiApiKey: z.string().optional(),
    backendUrl: z.string().url().default('http://localhost:3001'),
    timeout: z.coerce.number().min(1000).max(300000).default(30000),
  }),
  
  // Feature Flags
  features: z.object({
    streaming: z.boolean().default(true),
    codeValidation: z.boolean().default(true),
    fileExport: z.boolean().default(true),
    templates: z.boolean().default(true),
    darkMode: z.boolean().default(true),
    debugMode: z.boolean().default(false),
    analytics: z.boolean().default(false),
  }),
  
  // UI Configuration
  ui: z.object({
    defaultTheme: z.enum(['light', 'dark', 'auto']).default('dark'),
    defaultEditorTheme: z.string().default('vs-dark'),
    defaultFontSize: z.coerce.number().min(8).max(32).default(14),
    editorMinimap: z.boolean().default(true),
    editorWordWrap: z.boolean().default(false),
  }),
  
  // WebContainer Configuration
  webContainer: z.object({
    timeout: z.coerce.number().min(5000).max(120000).default(30000),
    autoStart: z.boolean().default(true),
    memoryLimit: z.coerce.number().min(128).max(2048).default(512),
  }),
  
  // Performance Configuration
  performance: z.object({
    enableServiceWorker: z.boolean().default(true),
    enableCodeSplitting: z.boolean().default(true),
    maxHighlightFileSize: z.coerce.number().min(10).max(1000).default(100),
    fileChangeDebounce: z.coerce.number().min(100).max(2000).default(300),
  }),
  
  // Logging Configuration
  logging: z.object({
    level: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    enableConsole: z.boolean().default(true),
    maxLogs: z.coerce.number().min(100).max(10000).default(1000),
  }),
  
  // Analytics Configuration
  analytics: z.object({
    gaTrackingId: z.string().optional(),
    mixpanelToken: z.string().optional(),
    posthogKey: z.string().optional(),
  }),
});

/**
 * Raw environment variable mapping
 * Maps Vite environment variables to configuration structure
 */
const rawConfig = {
  app: {
    title: import.meta.env.VITE_APP_TITLE,
    version: import.meta.env.VITE_APP_VERSION,
    environment: import.meta.env.VITE_NODE_ENV || import.meta.env.MODE,
  },
  
  api: {
    geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY,
    backendUrl: import.meta.env.VITE_BACKEND_URL,
    timeout: import.meta.env.VITE_API_TIMEOUT,
  },
  
  features: {
    streaming: import.meta.env.VITE_FEATURE_STREAMING !== 'false',
    codeValidation: import.meta.env.VITE_FEATURE_CODE_VALIDATION !== 'false',
    fileExport: import.meta.env.VITE_FEATURE_FILE_EXPORT !== 'false',
    templates: import.meta.env.VITE_FEATURE_TEMPLATES !== 'false',
    darkMode: import.meta.env.VITE_FEATURE_DARK_MODE !== 'false',
    debugMode: import.meta.env.VITE_FEATURE_DEBUG_MODE === 'true',
    analytics: import.meta.env.VITE_FEATURE_ANALYTICS === 'true',
  },
  
  ui: {
    defaultTheme: import.meta.env.VITE_DEFAULT_THEME,
    defaultEditorTheme: import.meta.env.VITE_DEFAULT_EDITOR_THEME,
    defaultFontSize: import.meta.env.VITE_DEFAULT_FONT_SIZE,
    editorMinimap: import.meta.env.VITE_EDITOR_MINIMAP !== 'false',
    editorWordWrap: import.meta.env.VITE_EDITOR_WORD_WRAP === 'true',
  },
  
  webContainer: {
    timeout: import.meta.env.VITE_WEBCONTAINER_TIMEOUT,
    autoStart: import.meta.env.VITE_WEBCONTAINER_AUTO_START !== 'false',
    memoryLimit: import.meta.env.VITE_WEBCONTAINER_MEMORY_LIMIT,
  },
  
  performance: {
    enableServiceWorker: import.meta.env.VITE_ENABLE_SERVICE_WORKER !== 'false',
    enableCodeSplitting: import.meta.env.VITE_ENABLE_CODE_SPLITTING !== 'false',
    maxHighlightFileSize: import.meta.env.VITE_MAX_HIGHLIGHT_FILE_SIZE,
    fileChangeDebounce: import.meta.env.VITE_FILE_CHANGE_DEBOUNCE,
  },
  
  logging: {
    level: import.meta.env.VITE_LOG_LEVEL,
    enableConsole: import.meta.env.VITE_ENABLE_CONSOLE_LOGGING !== 'false',
    maxLogs: import.meta.env.VITE_MAX_CONSOLE_LOGS,
  },
  
  analytics: {
    gaTrackingId: import.meta.env.VITE_GA_TRACKING_ID,
    mixpanelToken: import.meta.env.VITE_MIXPANEL_TOKEN,
    posthogKey: import.meta.env.VITE_POSTHOG_KEY,
  },
};

/**
 * Validated and typed configuration object
 * This is the main export that should be used throughout the application
 */
export const config = (() => {
  try {
    const validatedConfig = configSchema.parse(rawConfig);
    
    // Log configuration in development
    if (validatedConfig.app.environment === 'development' && validatedConfig.features.debugMode) {
      console.log('🔧 Frontend Configuration:', {
        environment: validatedConfig.app.environment,
        backendUrl: validatedConfig.api.backendUrl,
        geminiConfigured: !!validatedConfig.api.geminiApiKey,
        enabledFeatures: Object.entries(validatedConfig.features)
          .filter(([, enabled]) => enabled)
          .map(([feature]) => feature),
      });
    }
    
    return validatedConfig;
  } catch (error) {
    console.error('❌ Frontend configuration validation failed:', error);
    
    // Return minimal safe configuration
    return configSchema.parse({});
  }
})();

/**
 * Type definitions for configuration
 */
export type Config = z.infer<typeof configSchema>;
export type AppConfig = Config['app'];
export type ApiConfig = Config['api'];
export type FeatureFlags = Config['features'];
export type UIConfig = Config['ui'];
export type WebContainerConfig = Config['webContainer'];
export type PerformanceConfig = Config['performance'];
export type LoggingConfig = Config['logging'];
export type AnalyticsConfig = Config['analytics'];

/**
 * Configuration utility functions
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
  isDevelopment: (): boolean => config.app.environment === 'development',
  isProduction: (): boolean => config.app.environment === 'production',
  isTest: (): boolean => config.app.environment === 'test',
  
  /**
   * Get API endpoint URL
   */
  getApiUrl: (endpoint: string): string => {
    const baseUrl = config.api.backendUrl.replace(/\/$/, '');
    const cleanEndpoint = endpoint.replace(/^\//, '');
    return `${baseUrl}/${cleanEndpoint}`;
  },
  
  /**
   * Check if analytics should be enabled
   */
  shouldEnableAnalytics: (): boolean => {
    return config.features.analytics && 
           configUtils.isProduction() && 
           !!(config.analytics.gaTrackingId || config.analytics.mixpanelToken || config.analytics.posthogKey);
  },
  
  /**
   * Get theme configuration
   */
  getThemeConfig: () => ({
    defaultTheme: config.ui.defaultTheme,
    darkModeEnabled: config.features.darkMode,
    editorTheme: config.ui.defaultEditorTheme,
  }),
  
  /**
   * Get performance settings
   */
  getPerformanceConfig: () => ({
    serviceWorkerEnabled: config.performance.enableServiceWorker && configUtils.isProduction(),
    codeSplittingEnabled: config.performance.enableCodeSplitting,
    maxFileSize: config.performance.maxHighlightFileSize * 1024, // Convert KB to bytes
    debounceDelay: config.performance.fileChangeDebounce,
  }),
  
  /**
   * Get logging configuration
   */
  getLoggingConfig: () => ({
    level: config.logging.level,
    enabled: config.logging.enableConsole || configUtils.isDevelopment(),
    maxLogs: config.logging.maxLogs,
  }),
  
  /**
   * Validate required configuration
   */
  validateRequiredConfig: (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!config.api.backendUrl) {
      errors.push('Backend URL is required (VITE_BACKEND_URL)');
    }
    
    if (config.features.analytics && !configUtils.shouldEnableAnalytics()) {
      errors.push('Analytics is enabled but no tracking service is configured');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  },
};

/**
 * Runtime configuration validation
 */
export const validateRuntimeConfig = (): boolean => {
  const validation = configUtils.validateRequiredConfig();
  
  if (!validation.valid) {
    console.error('❌ Configuration validation failed:', validation.errors);
    return false;
  }
  
  return true;
};

// Validate configuration on module load
if (configUtils.isDevelopment()) {
  validateRuntimeConfig();
}
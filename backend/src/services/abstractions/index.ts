/**
 * Service Abstractions - Phase 2: Service Layer Refactoring
 * 
 * This module defines abstract interfaces and contracts for all services,
 * enabling dependency injection, testability, and loose coupling.
 * 
 * @fileoverview Service abstraction layer for dependency injection and testing
 * @version 2.0.0
 * @since Phase 2
 */

import { GenerateCodeRequest, GenerateCodeResponse, ValidateCodeRequest, ValidateCodeResponse } from '../../types/index.js';

/**
 * Abstract interface for LLM providers
 * Enables switching between different AI providers (Gemini, OpenAI, etc.)
 */
export interface ILLMProvider {
  /**
   * Generate content using the LLM
   * @param prompt - The input prompt for generation
   * @param config - Provider-specific configuration
   * @returns Promise resolving to generated content
   */
  generateContent(prompt: string, config?: any): Promise<string>;
  
  /**
   * Generate content with streaming support
   * @param prompt - The input prompt for generation
   * @param config - Provider-specific configuration
   * @param onChunk - Callback for streaming chunks
   * @returns Promise resolving to generated content
   */
  generateContentStream(prompt: string, config?: any, onChunk?: (chunk: string) => void): Promise<string>;
  
  /**
   * Check if the provider is available and configured
   * @returns Promise resolving to availability status
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Abstract interface for code generation services
 * Defines the contract for all code generation implementations
 */
export interface ICodeGenerationService {
  /**
   * Generate code based on user requirements
   * @param request - Code generation request parameters
   * @returns Promise resolving to generated code and metadata
   */
  generateCode(request: GenerateCodeRequest): Promise<GenerateCodeResponse>;
  
  /**
   * Generate code with streaming support
   * @param request - Code generation request parameters
   * @param onChunk - Callback for streaming progress updates
   * @returns Promise resolving to generated code and metadata
   */
  generateCodeWithStreaming(request: GenerateCodeRequest, onChunk?: (chunk: string) => void): Promise<GenerateCodeResponse>;
  
  /**
   * Validate generated code for syntax and best practices
   * @param request - Code validation request parameters
   * @returns Promise resolving to validation results
   */
  validateCode(request: ValidateCodeRequest): Promise<ValidateCodeResponse>;
}

/**
 * Abstract interface for template management
 * Handles framework-specific templates and boilerplate code
 */
export interface ITemplateService {
  /**
   * Get framework-specific template
   * @param framework - Target framework identifier
   * @returns Promise resolving to template files
   */
  getFrameworkTemplate(framework: string): Promise<Record<string, string>>;
  
  /**
   * Get available frameworks
   * @returns Promise resolving to list of supported frameworks
   */
  getSupportedFrameworks(): Promise<string[]>;
  
  /**
   * Validate template structure
   * @param template - Template files to validate
   * @param framework - Target framework
   * @returns Promise resolving to validation status
   */
  validateTemplate(template: Record<string, string>, framework: string): Promise<boolean>;
}

/**
 * Abstract interface for prompt engineering
 * Handles prompt construction and optimization for different use cases
 */
export interface IPromptService {
  /**
   * Build generation prompt for code creation
   * @param request - Code generation request
   * @returns Optimized prompt string
   */
  buildGenerationPrompt(request: GenerateCodeRequest): string;
  
  /**
   * Build validation prompt for code review
   * @param request - Code validation request
   * @returns Optimized prompt string
   */
  buildValidationPrompt(request: ValidateCodeRequest): string;
  
  /**
   * Get framework-specific instructions
   * @param framework - Target framework
   * @returns Framework-specific prompt instructions
   */
  getFrameworkInstructions(framework: string): string;
}

/**
 * Abstract interface for caching services
 * Provides caching capabilities for expensive operations
 */
export interface ICacheService {
  /**
   * Get cached value by key
   * @param key - Cache key
   * @returns Promise resolving to cached value or null
   */
  get<T>(key: string): Promise<T | null>;
  
  /**
   * Set cached value with optional TTL
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in seconds (optional)
   * @returns Promise resolving when value is cached
   */
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  
  /**
   * Delete cached value
   * @param key - Cache key
   * @returns Promise resolving when value is deleted
   */
  delete(key: string): Promise<void>;
  
  /**
   * Clear all cached values
   * @returns Promise resolving when cache is cleared
   */
  clear(): Promise<void>;
  
  /**
   * Check if key exists in cache
   * @param key - Cache key
   * @returns Promise resolving to existence status
   */
  has(key: string): Promise<boolean>;
}

/**
 * Abstract interface for response parsing
 * Handles parsing and validation of LLM responses
 */
export interface IResponseParserService {
  /**
   * Parse code generation response
   * @param response - Raw LLM response
   * @returns Parsed and validated response
   */
  parseGenerationResponse(response: string): GenerateCodeResponse;
  
  /**
   * Parse code validation response
   * @param response - Raw LLM response
   * @returns Parsed validation results
   */
  parseValidationResponse(response: string): ValidateCodeResponse;
  
  /**
   * Validate response structure
   * @param response - Response to validate
   * @param expectedSchema - Expected response schema
   * @returns Validation status
   */
  validateResponseStructure(response: any, expectedSchema: any): boolean;
}

/**
 * Service container interface for dependency injection
 * Manages service instances and their dependencies
 */
export interface IServiceContainer {
  /**
   * Register a service implementation
   * @param token - Service identifier
   * @param implementation - Service implementation
   * @param singleton - Whether to use singleton pattern
   */
  register<T>(token: string | symbol, implementation: new (...args: any[]) => T, singleton?: boolean): void;
  
  /**
   * Register a service instance
   * @param token - Service identifier
   * @param instance - Service instance
   */
  registerInstance<T>(token: string | symbol, instance: T): void;
  
  /**
   * Resolve a service instance
   * @param token - Service identifier
   * @returns Service instance
   */
  resolve<T>(token: string | symbol): T;
  
  /**
   * Check if service is registered
   * @param token - Service identifier
   * @returns Registration status
   */
  isRegistered(token: string | symbol): boolean;
}

/**
 * Service tokens for dependency injection
 * Unique symbols to identify service implementations
 */
export const SERVICE_TOKENS = {
  LLM_PROVIDER: Symbol('LLMProvider'),
  CODE_GENERATION_SERVICE: Symbol('CodeGenerationService'),
  TEMPLATE_SERVICE: Symbol('TemplateService'),
  PROMPT_SERVICE: Symbol('PromptService'),
  CACHE_SERVICE: Symbol('CacheService'),
  RESPONSE_PARSER_SERVICE: Symbol('ResponseParserService'),
} as const;

/**
 * Service configuration interface
 * Defines configuration options for service implementations
 */
export interface IServiceConfig {
  llm?: {
    provider: 'gemini' | 'openai' | 'anthropic';
    apiKey: string;
    model?: string;
    timeout?: number;
    retries?: number;
  };
  cache?: {
    type: 'memory' | 'redis' | 'file';
    ttl?: number;
    maxSize?: number;
    connection?: string;
  };
  templates?: {
    cacheEnabled?: boolean;
    customTemplatesPath?: string;
  };
}
/**
 * Gemini LLM Provider Implementation - Phase 2: Service Layer Refactoring
 * 
 * Concrete implementation of ILLMProvider for Google's Gemini AI.
 * Handles API communication, error handling, and response processing.
 * 
 * @fileoverview Gemini AI provider implementation
 * @version 2.0.0
 * @since Phase 2
 */

import { GoogleGenAI, Type } from '@google/genai';
import { ILLMProvider } from '../abstractions/index.js';
import { config } from '../../config/index.js';

/**
 * Gemini Provider Configuration
 * Defines configuration options specific to Gemini AI
 */
export interface GeminiConfig {
  /** Gemini API key */
  apiKey: string;
  /** Model name to use (default: gemini-2.5-flash) */
  model?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Number of retry attempts */
  retries?: number;
  /** Temperature for response generation */
  temperature?: number;
  /** Maximum tokens in response */
  maxTokens?: number;
}

/**
 * Gemini LLM Provider
 * 
 * Provides integration with Google's Gemini AI service.
 * Supports both standard and streaming content generation.
 * 
 * Features:
 * - Automatic retry logic with exponential backoff
 * - Request/response validation
 * - Error handling and logging
 * - Streaming support with chunk processing
 * - Rate limiting awareness
 * 
 * @example
 * ```typescript
 * const provider = new GeminiProvider({
 *   apiKey: 'your-api-key',
 *   model: 'gemini-2.5-flash'
 * });
 * 
 * const response = await provider.generateContent('Hello, world!');
 * ```
 */
export class GeminiProvider implements ILLMProvider {
  private readonly genAI: GoogleGenAI;
  private readonly config: Required<GeminiConfig>;
  private readonly defaultModel = 'gemini-2.5-flash';

  /**
   * Initialize Gemini provider
   * 
   * @param providerConfig - Gemini-specific configuration
   * @throws Error if API key is missing or invalid
   */
  constructor(providerConfig?: Partial<GeminiConfig>) {
    // Merge with default configuration
    this.config = {
      apiKey: providerConfig?.apiKey || config.gemini.apiKey,
      model: providerConfig?.model || this.defaultModel,
      timeout: providerConfig?.timeout || 30000,
      retries: providerConfig?.retries || 3,
      temperature: providerConfig?.temperature || 0.7,
      maxTokens: providerConfig?.maxTokens || 4096
    };

    // Validate API key
    if (!this.config.apiKey) {
      throw new Error('Gemini API key is required. Please set GEMINI_API_KEY environment variable.');
    }

    // Initialize Gemini client
    this.genAI = new GoogleGenAI({ apiKey: this.config.apiKey });
    
    console.log(`🤖 Gemini provider initialized with model: ${this.config.model}`);
  }

  /**
   * Generate content using Gemini AI
   * 
   * @param prompt - Input prompt for generation
   * @param requestConfig - Request-specific configuration
   * @returns Promise resolving to generated content
   * @throws Error if generation fails after retries
   */
  async generateContent(prompt: string, requestConfig?: any): Promise<string> {
    this.validatePrompt(prompt);

    const startTime = Date.now();
    let lastError: Error | null = null;

    // Retry logic with exponential backoff
    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        console.log(`🔄 Gemini generation attempt ${attempt}/${this.config.retries}`);

        const result = await this.makeRequest(prompt, requestConfig);
        const content = result.text || '';

        if (!content.trim()) {
          throw new Error('Empty response received from Gemini');
        }

        const duration = Date.now() - startTime;
        console.log(`✅ Gemini generation completed in ${duration}ms (${content.length} chars)`);

        return content;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`⚠️ Gemini attempt ${attempt} failed:`, lastError.message);

        // Don't retry on certain errors
        if (this.isNonRetryableError(lastError)) {
          break;
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.config.retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          console.log(`⏳ Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    // All retries failed
    const duration = Date.now() - startTime;
    console.error(`❌ Gemini generation failed after ${this.config.retries} attempts (${duration}ms)`);
    throw new Error(`Gemini generation failed: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Generate content with streaming support
   * 
   * @param prompt - Input prompt for generation
   * @param requestConfig - Request-specific configuration
   * @param onChunk - Callback for processing streaming chunks
   * @returns Promise resolving to complete generated content
   */
  async generateContentStream(
    prompt: string,
    requestConfig?: any,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    this.validatePrompt(prompt);

    const startTime = Date.now();
    console.log(`🌊 Starting Gemini streaming generation`);

    try {
      const result = await this.genAI.models.generateContentStream({
        model: this.config.model,
        contents: prompt,
        config: {
          ...requestConfig,
          temperature: this.config.temperature,
          maxOutputTokens: this.config.maxTokens
        }
      });

      let fullContent = '';
      let chunkCount = 0;

      for await (const chunk of result) {
        const chunkText = chunk.text || '';
        if (chunkText) {
          fullContent += chunkText;
          chunkCount++;
          
          // Process chunk through callback
          if (onChunk) {
            try {
              onChunk(chunkText);
            } catch (error) {
              console.warn('⚠️ Chunk processing error:', error);
            }
          }
        }
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Gemini streaming completed: ${chunkCount} chunks, ${fullContent.length} chars in ${duration}ms`);

      if (!fullContent.trim()) {
        throw new Error('Empty response received from Gemini streaming');
      }

      return fullContent;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Gemini streaming failed after ${duration}ms:`, error);
      
      // Fallback to regular generation
      console.log('🔄 Falling back to non-streaming generation');
      return this.generateContent(prompt, requestConfig);
    }
  }

  /**
   * Check if Gemini provider is available and configured
   * 
   * @returns Promise resolving to availability status
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Test with a simple prompt
      const testPrompt = 'Hello';
      const result = await this.genAI.models.generateContent({
        model: this.config.model,
        contents: testPrompt,
        config: {
          maxOutputTokens: 10,
          temperature: 0
        }
      });

      const isValid = !!(result.text && result.text.trim());
      console.log(`🔍 Gemini availability check: ${isValid ? 'Available' : 'Unavailable'}`);
      
      return isValid;
    } catch (error) {
      console.warn('⚠️ Gemini availability check failed:', error);
      return false;
    }
  }

  /**
   * Get provider information and status
   * 
   * @returns Provider metadata
   */
  getProviderInfo(): {
    name: string;
    model: string;
    version: string;
    capabilities: string[];
  } {
    return {
      name: 'Google Gemini',
      model: this.config.model,
      version: '2.5',
      capabilities: ['text-generation', 'streaming', 'json-mode', 'function-calling']
    };
  }

  /**
   * Update provider configuration
   * 
   * @param newConfig - Updated configuration
   */
  updateConfig(newConfig: Partial<GeminiConfig>): void {
    Object.assign(this.config, newConfig);
    console.log('🔧 Gemini provider configuration updated');
  }

  /**
   * Make request to Gemini API
   * 
   * @param prompt - Input prompt
   * @param requestConfig - Request configuration
   * @returns Promise resolving to API response
   * @private
   */
  private async makeRequest(prompt: string, requestConfig?: any): Promise<any> {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), this.config.timeout);
    });

    const requestPromise = this.genAI.models.generateContent({
      model: this.config.model,
      contents: prompt,
      config: {
        ...requestConfig,
        temperature: this.config.temperature,
        maxOutputTokens: this.config.maxTokens
      }
    });

    return Promise.race([requestPromise, timeoutPromise]);
  }

  /**
   * Validate input prompt
   * 
   * @param prompt - Prompt to validate
   * @throws Error if prompt is invalid
   * @private
   */
  private validatePrompt(prompt: string): void {
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt must be a non-empty string');
    }

    if (prompt.trim().length === 0) {
      throw new Error('Prompt cannot be empty or whitespace only');
    }

    if (prompt.length > 100000) {
      throw new Error('Prompt is too long (max 100,000 characters)');
    }
  }

  /**
   * Check if error should not be retried
   * 
   * @param error - Error to check
   * @returns True if error should not be retried
   * @private
   */
  private isNonRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    
    // Don't retry on authentication, quota, or validation errors
    return (
      message.includes('api key') ||
      message.includes('authentication') ||
      message.includes('quota') ||
      message.includes('billing') ||
      message.includes('invalid') ||
      message.includes('malformed')
    );
  }

  /**
   * Sleep for specified duration
   * 
   * @param ms - Duration in milliseconds
   * @returns Promise that resolves after delay
   * @private
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Dispose of provider resources
   * Called during application shutdown
   */
  async dispose(): Promise<void> {
    console.log('🗑️ Disposing Gemini provider');
    // Clean up any resources if needed
  }
}
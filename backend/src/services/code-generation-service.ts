/**
 * Code Generation Service Implementation - Phase 2: Service Layer Refactoring
 * 
 * Refactored code generation service that implements the ICodeGenerationService
 * interface and uses dependency injection for better testability and maintainability.
 * 
 * @fileoverview Main code generation service implementation
 * @version 2.0.0
 * @since Phase 2
 */

import { 
  ICodeGenerationService, 
  ILLMProvider, 
  IPromptService, 
  ICacheService,
  ITemplateService 
} from './abstractions/index.js';
import { 
  GenerateCodeRequest, 
  GenerateCodeResponse, 
  ValidateCodeRequest, 
  ValidateCodeResponse,
  Framework 
} from '../types/index.js';
import { AppError } from '../errors/index.js';

/**
 * Code Generation Service Implementation
 * 
 * Orchestrates code generation by coordinating between LLM providers,
 * prompt services, caching, and template services. Provides both
 * standard and streaming code generation capabilities.
 * 
 * @example
 * ```typescript
 * const codeGenService = new CodeGenerationService(
 *   llmProvider,
 *   promptService,
 *   cacheService,
 *   templateService
 * );
 * 
 * const result = await codeGenService.generateCode({
 *   prompt: "Create a todo app",
 *   framework: "react"
 * });
 * ```
 */
export class CodeGenerationService implements ICodeGenerationService {
  constructor(
    private readonly llmProvider: ILLMProvider,
    private readonly promptService: IPromptService,
    private readonly cacheService: ICacheService,
    private readonly templateService: ITemplateService
  ) {}

  /**
   * Generate code based on user requirements
   * 
   * @param request - Code generation request parameters
   * @returns Promise resolving to generated code and metadata
   * @throws AppError if generation fails
   */
  async generateCode(request: GenerateCodeRequest): Promise<GenerateCodeResponse> {
    try {
      console.log(`🤖 Starting code generation for ${request.framework} framework`);
      
      // Check cache first for performance optimization
      const cacheKey = this.generateCacheKey(request);
      const cachedResult = await this.cacheService.get<GenerateCodeResponse>(cacheKey);
      
      if (cachedResult) {
        console.log(`⚡ Cache hit for code generation request`);
        return cachedResult;
      }

      // Build the generation prompt using the prompt service
      const prompt = this.promptService.buildGenerationPrompt(request);

      // Generate content using the LLM provider
      const generatedContent = await this.llmProvider.generateContent(prompt, {
        responseMimeType: "application/json",
        temperature: 0.7,
        maxOutputTokens: 8192
      });

      // Parse and validate the generated response
      const response = this.parseGeneratedResponse(generatedContent, request.framework);

      // Cache the result for future requests
      await this.cacheService.set(cacheKey, response, 300); // 5 minutes TTL

      console.log(`✅ Code generation completed for ${request.framework}`);
      return response;

    } catch (error) {
      console.error('❌ Code generation failed:', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError(
        'Code generation failed',
        500,
        'internal_server',
        { originalError: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Generate code with streaming support
   * 
   * @param request - Code generation request parameters
   * @param onChunk - Callback for streaming progress updates
   * @returns Promise resolving to generated code and metadata
   * @throws AppError if generation fails
   */
  async generateCodeWithStreaming(
    request: GenerateCodeRequest, 
    onChunk?: (chunk: string) => void
  ): Promise<GenerateCodeResponse> {
    try {
      console.log(`🤖 Starting streaming code generation for ${request.framework} framework`);

      // Build the generation prompt using the prompt service
      const prompt = this.promptService.buildGenerationPrompt(request);

      // Generate content with streaming using the LLM provider
      const generatedContent = await this.llmProvider.generateContentStream(
        prompt,
        {
          responseMimeType: "application/json",
          temperature: 0.7,
          maxOutputTokens: 8192
        },
        onChunk
      );

      // Parse and validate the generated response
      const response = this.parseGeneratedResponse(generatedContent, request.framework);

      console.log(`✅ Streaming code generation completed for ${request.framework}`);
      return response;

    } catch (error) {
      console.error('❌ Streaming code generation failed:', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError(
        'Streaming code generation failed',
        500,
        'external_api',
        
        { originalError: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Validate generated code for syntax and best practices
   * 
   * @param request - Code validation request parameters
   * @returns Promise resolving to validation results
   * @throws AppError if validation fails
   */
  async validateCode(request: ValidateCodeRequest): Promise<ValidateCodeResponse> {
    try {
      console.log(`🔍 Starting code validation for ${request.framework} framework`);

      // Check cache first
      const cacheKey = this.generateValidationCacheKey(request);
      const cachedResult = await this.cacheService.get<ValidateCodeResponse>(cacheKey);
      
      if (cachedResult) {
        console.log(`⚡ Cache hit for code validation request`);
        return cachedResult;
      }

      // Build validation prompt using the prompt service
      const prompt = this.promptService.buildValidationPrompt(request);

      // Validate using the LLM provider
      const validationContent = await this.llmProvider.generateContent(prompt, {
        responseMimeType: "application/json",
        temperature: 0.3, // Lower temperature for more consistent validation
        maxOutputTokens: 2048
      });

      // Parse validation response
      const response = this.parseValidationResponse(validationContent);

      // Cache the validation result
      await this.cacheService.set(cacheKey, response, 600); // 10 minutes TTL

      console.log(`✅ Code validation completed for ${request.framework}`);
      return response;

    } catch (error) {
      console.error('❌ Code validation failed:', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError(
        'Code validation failed',
        500,
        'external_api',
        
        { originalError: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Get framework-specific template
   * Delegates to the template service
   * 
   * @param framework - Target framework identifier
   * @returns Promise resolving to template files
   */
  async getFrameworkTemplate(framework: string): Promise<Record<string, string>> {
    try {
      return await this.templateService.getFrameworkTemplate(framework);
    } catch (error) {
      console.error(`❌ Failed to get template for ${framework}:`, error);
      
      throw new AppError(
        `Failed to get template for framework: ${framework}`,
        400,
        'validation',
        
        { framework, originalError: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Generate cache key for code generation requests
   * 
   * @private
   * @param request - Code generation request
   * @returns Cache key string
   */
  private generateCacheKey(request: GenerateCodeRequest): string {
    const historyHash = request.conversationHistory 
      ? JSON.stringify(request.conversationHistory).slice(0, 100)
      : '';
    const filesHash = request.currentFiles 
      ? Object.keys(request.currentFiles).join(',').slice(0, 50)
      : '';
    
    return `code_gen:${request.framework}:${request.prompt.slice(0, 100)}:${historyHash}:${filesHash}`;
  }

  /**
   * Generate cache key for validation requests
   * 
   * @private
   * @param request - Code validation request
   * @returns Cache key string
   */
  private generateValidationCacheKey(request: ValidateCodeRequest): string {
    const filesHash = Object.keys(request.files).sort().join(',');
    return `code_validation:${request.framework}:${filesHash}`;
  }

  /**
   * Parse and validate generated response from LLM
   * 
   * @private
   * @param content - Raw LLM response content
   * @param framework - Target framework
   * @returns Parsed generation response
   * @throws AppError if parsing fails
   */
  private parseGeneratedResponse(content: string, framework: string): GenerateCodeResponse {
    try {
      // Clean the content to extract JSON
      const cleanedContent = this.extractJsonFromContent(content);
      const parsed = JSON.parse(cleanedContent);

      // Handle different response formats
      let files: Record<string, string> = {};
      
      if (parsed.files) {
        if (Array.isArray(parsed.files)) {
          // Convert array format to object format
          parsed.files.forEach((file: any) => {
            if (file.name && file.content) {
              files[file.name] = file.content;
            } else if (file.filename && file.content) {
              files[file.filename] = file.content;
            } else if (file.path && file.content) {
              files[file.path] = file.content;
            } else if (file.fileName && file.fileContent) {
              files[file.fileName] = file.fileContent;
            }
          });
        } else if (typeof parsed.files === 'object') {
          files = parsed.files;
        }
      } else if (Array.isArray(parsed)) {
        // Handle case where the entire response is an array of files
        parsed.forEach((file: any) => {
          if (file.name && file.content) {
            files[file.name] = file.content;
          } else if (file.filename && file.content) {
            files[file.filename] = file.content;
          } else if (file.path && file.content) {
            files[file.path] = file.content;
          } else if (file.fileName && file.fileContent) {
            files[file.fileName] = file.fileContent;
          }
        });
      }

      // Validate that we have files
      if (Object.keys(files).length === 0) {
        throw new Error('No valid files found in response');
      }

      return {
        files,
        message: parsed.message || `Generated ${framework} application successfully`,
        suggestions: parsed.suggestions || []
      };

    } catch (error) {
      console.error('❌ Failed to parse generated response:', error);
      
      throw new AppError(
        'Failed to parse generated code response',
        500,
        'external_api',
        
        { 
          framework,
          contentPreview: content.slice(0, 200),
          originalError: error instanceof Error ? error.message : String(error)
        }
      );
    }
  }

  /**
   * Parse validation response from LLM
   * 
   * @private
   * @param content - Raw LLM validation response
   * @returns Parsed validation response
   * @throws AppError if parsing fails
   */
  private parseValidationResponse(content: string): ValidateCodeResponse {
    try {
      const cleanedContent = this.extractJsonFromContent(content);
      const parsed = JSON.parse(cleanedContent);

      return {
        isValid: parsed.isValid ?? true,
        errors: parsed.errors || [],
        warnings: parsed.warnings || [],
        suggestions: parsed.suggestions || []
      };

    } catch (error) {
      console.error('❌ Failed to parse validation response:', error);
      
      throw new AppError(
        'Failed to parse validation response',
        500,
        'external_api',
        
        { 
          contentPreview: content.slice(0, 200),
          originalError: error instanceof Error ? error.message : String(error)
        }
      );
    }
  }

  /**
   * Extract JSON content from LLM response
   * Handles cases where LLM includes additional text around JSON
   * 
   * @private
   * @param content - Raw content from LLM
   * @returns Cleaned JSON string
   */
  private extractJsonFromContent(content: string): string {
    // Try to find JSON within code blocks
    const codeBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (codeBlockMatch) {
      return this.cleanJsonString(codeBlockMatch[1]);
    }

    // Try to find JSON object directly
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return this.cleanJsonString(jsonMatch[0]);
    }

    // If no JSON found, return original content and let JSON.parse handle the error
    return content;
  }

  /**
   * Clean and fix common JSON formatting issues from LLM responses
   * 
   * @private
   * @param jsonStr - Raw JSON string
   * @returns Cleaned JSON string
   */
  private cleanJsonString(jsonStr: string): string {
    try {
      // First, try to parse as-is
      JSON.parse(jsonStr);
      return jsonStr;
    } catch (error) {
      // If parsing fails, try to fix common issues
      let cleaned = jsonStr;
      
      // Fix escaped quotes in file content that break JSON structure
      // Look for patterns like "fileContent": "content with \"quotes\"" and fix them
      cleaned = cleaned.replace(
        /"fileContent":\s*"([^"]*(?:\\.[^"]*)*)"(?=\s*[,}])/g,
        (match, content) => {
          // Re-escape the content properly
          const escapedContent = content
            .replace(/\\/g, '\\\\')  // Escape backslashes
            .replace(/"/g, '\\"')    // Escape quotes
            .replace(/\n/g, '\\n')   // Escape newlines
            .replace(/\r/g, '\\r')   // Escape carriage returns
            .replace(/\t/g, '\\t');  // Escape tabs
          return `"fileContent": "${escapedContent}"`;
        }
      );
      
      // Fix other content fields similarly
      cleaned = cleaned.replace(
        /"content":\s*"([^"]*(?:\\.[^"]*)*)"(?=\s*[,}])/g,
        (match, content) => {
          const escapedContent = content
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
          return `"content": "${escapedContent}"`;
        }
      );
      
      // Try to parse the cleaned version
      try {
        JSON.parse(cleaned);
        return cleaned;
      } catch (secondError) {
        // If still failing, return original and let the error bubble up
        console.warn('Failed to clean JSON, returning original:', secondError);
        return jsonStr;
      }
    }
  }
}
import { Framework, FileContent } from '../store/useAppStore';
import { configUtils } from '../config';

export interface LLMResponse {
  files: FileContent;
  message: string;
  suggestions?: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ValidationResponse {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface ProviderInfo {
  provider: string;
  available: boolean;
  available_providers?: string[];
}

export class LLMService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = configUtils.getActiveBackendUrl();
  }

  /**
   * Get available LLM providers (Python backend only)
   */
  async getAvailableProviders(): Promise<string[]> {
    if (!configUtils.isPythonBackend()) {
      return ['gemini']; // TypeScript backend only supports Gemini
    }

    try {
      const response = await fetch(configUtils.getApiUrl('api/v1/providers/available'));
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to get available providers:', error);
      return ['gemini']; // Fallback
    }
  }

  /**
   * Get current provider info (Python backend only)
   */
  async getCurrentProvider(): Promise<ProviderInfo> {
    if (!configUtils.isPythonBackend()) {
      return { provider: 'gemini', available: true };
    }

    try {
      const response = await fetch(configUtils.getApiUrl('api/v1/providers/current'));
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to get current provider:', error);
      return { provider: 'gemini', available: true };
    }
  }

  async generateCodeWithStreaming(
    userRequest: string,
    framework: Framework,
    conversationHistory: ChatMessage[] = [],
    currentFiles: FileContent = {},
    onChunk?: (chunk: string) => void
  ): Promise<LLMResponse> {
    try {
      // Use different endpoints based on backend type
      const endpoint = configUtils.isPythonBackend() 
        ? 'api/v1/stream/' 
        : 'api/generate/stream';
      
      const response = await fetch(configUtils.getApiUrl(endpoint), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: userRequest,
          framework,
          conversation_history: conversationHistory, // Python backend uses snake_case
          current_files: currentFiles
        }),
      });

      if (!response.ok) {
        // Fallback to non-streaming if streaming endpoint doesn't exist
        if (response.status === 404) {
          return this.generateCode(userRequest, framework, conversationHistory);
        }
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || errorData.detail || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Streaming not supported');
      }

      let fullMessage = '';
      let files = {};
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'message_chunk') {
                  fullMessage += data.content;
                  onChunk?.(data.content);
                } else if (data.type === 'files') {
                  files = data.files;
                } else if (data.type === 'done') {
                  return {
                    files,
                    message: fullMessage,
                    suggestions: data.suggestions || []
                  };
                }
              } catch (e) {
                // Skip invalid JSON lines
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      return {
        files,
        message: fullMessage || 'Code generated successfully!',
        suggestions: []
      };
    } catch (error) {
      console.error('Streaming LLM Service Error:', error);
      
      // Fallback to regular generation
      return this.generateCode(userRequest, framework, conversationHistory);
    }
  }

  async generateCode(
    userRequest: string, 
    framework: Framework, 
    conversationHistory: ChatMessage[] = []
  ): Promise<LLMResponse> {
    try {
      // Use different endpoints based on backend type
      const endpoint = configUtils.isPythonBackend() 
        ? 'api/v1/generate/' 
        : 'api/generate';

      const requestBody = configUtils.isPythonBackend() 
        ? {
            prompt: userRequest,
            framework,
            conversation_history: conversationHistory,
            current_files: {}
          }
        : {
            prompt: userRequest,
            framework,
            conversationHistory
          };

      const response = await fetch(configUtils.getApiUrl(endpoint), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || errorData.detail || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Handle different response formats
      if (configUtils.isPythonBackend()) {
        // Python backend returns data directly
        if (!data.files) {
          throw new Error('Invalid response format from Python backend');
        }
      } else {
        // TypeScript backend wraps data in success/data structure
        if (!data.success) {
          throw new Error(data.error?.message || 'Failed to generate code');
        }
      }

      // Ensure all file contents are strings
      const processedFiles: FileContent = {};
      const rawFiles = configUtils.isPythonBackend() ? data.files : (data.data?.files || {});
      
      Object.entries(rawFiles).forEach(([path, content]) => {
        if (typeof content === 'object' && content !== null) {
          // If content is an object, stringify it (likely package.json)
          processedFiles[path] = JSON.stringify(content, null, 2);
        } else {
          // Ensure it's a string
          processedFiles[path] = String(content);
        }
      });

      const explanation = configUtils.isPythonBackend() 
        ? data.explanation 
        : (data.data?.message || data.data?.explanation);

      const suggestions = configUtils.isPythonBackend() 
        ? data.suggestions 
        : data.data?.suggestions;

      return {
        files: processedFiles,
        message: explanation || 'Code generated successfully!',
        suggestions: suggestions || []
      };
    } catch (error) {
      console.error('LLM Service Error:', error);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Failed to generate code. Please check your connection and try again.');
    }
  }

  async validateCode(files: FileContent, framework: Framework): Promise<ValidationResponse> {
    try {
      // Use different endpoints based on backend type
      const endpoint = configUtils.isPythonBackend() 
        ? 'api/v1/generate/validate' 
        : 'api/generate/validate';

      const response = await fetch(configUtils.getApiUrl(endpoint), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files,
          framework
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || errorData.detail || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (configUtils.isPythonBackend()) {
        // Python backend returns data directly
        return {
          is_valid: data.is_valid ?? true,
          errors: data.errors || [],
          warnings: data.warnings || [],
          suggestions: data.suggestions || []
        };
      } else {
        // TypeScript backend wraps data
        return {
          is_valid: data.data?.isValid ?? true,
          errors: data.data?.errors || [],
          warnings: data.data?.warnings || [],
          suggestions: data.data?.suggestions || []
        };
      }
    } catch (error) {
      console.error('Validation Error:', error);
      return {
        is_valid: false,
        errors: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        suggestions: []
      };
    }
  }

}
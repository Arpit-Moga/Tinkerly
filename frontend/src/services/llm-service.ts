import { Framework, FileContent } from '../store/useAppStore';

export interface LLMResponse {
  files: FileContent;
  message: string;
  suggestions?: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class LLMService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
  }

  async generateCode(
    userRequest: string, 
    framework: Framework, 
    conversationHistory: ChatMessage[] = []
  ): Promise<LLMResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: userRequest,
          framework,
          conversationHistory
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to generate code');
      }

      // Ensure all file contents are strings
      const processedFiles: FileContent = {};
      const rawFiles = data.data.files || {};
      
      Object.entries(rawFiles).forEach(([path, content]) => {
        if (typeof content === 'object' && content !== null) {
          // If content is an object, stringify it (likely package.json)
          processedFiles[path] = JSON.stringify(content, null, 2);
        } else {
          // Ensure it's a string
          processedFiles[path] = String(content);
        }
      });

      return {
        files: processedFiles,
        message: data.data.message || 'Code generated successfully!',
        suggestions: data.data.suggestions || []
      };
    } catch (error) {
      console.error('LLM Service Error:', error);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Failed to generate code. Please check your connection and try again.');
    }
  }

  async validateCode(files: FileContent, framework: Framework): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate/validate`, {
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
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Validation Error:', error);
      return {
        isValid: false,
        errors: ['Failed to validate code'],
        warnings: [],
        suggestions: []
      };
    }
  }

}
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();


export interface GenerateCodeRequest {
  prompt: string;
  framework: 'react' | 'vue' | 'svelte' | 'angular' | 'nodejs';
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  currentFiles?: Record<string, string>;
}

export interface GenerateCodeResponse {
  files: Record<string, string>;
  message: string;
  suggestions?: string[];
}

export interface ValidateCodeRequest {
  files: Record<string, string>;
  framework: 'react' | 'vue' | 'svelte' | 'angular' | 'nodejs';
}

export interface ValidateCodeResponse {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export class LLMService {
  private genAI: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY; // Replace with process.env.GEMINI_API_KEY in production
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    this.genAI = new GoogleGenAI({apiKey: apiKey});
  }

  async generateCode(request: GenerateCodeRequest): Promise<GenerateCodeResponse> {
    const prompt = this.buildGenerationPrompt(request);

    try {
      const result = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      const text = result.text || '';

      console.log('LLM response received, length:', text.length);
      return this.parseGenerationResponse(text);
    } catch (error) {
      console.error('LLM generation error:', error);
      throw new Error('Failed to generate code. Please try again.');
    }
  }

  async generateCodeWithStreaming(
    request: GenerateCodeRequest,
    onChunk?: (chunk: string) => void
  ): Promise<GenerateCodeResponse> {
    const prompt = this.buildGenerationPrompt(request);

    try {
      const result = await this.genAI.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      let fullText = '';

      for await (const chunk of result) {
        const chunkText = chunk.text || '';
        fullText += chunkText;
        
        // Send chunk to client if callback provided
        if (onChunk && chunkText) {
          onChunk(chunkText);
        }
      }

      return this.parseGenerationResponse(fullText);
    } catch (error) {
      console.error('LLM streaming generation error:', error);
      // Fallback to regular generation
      return this.generateCode(request);
    }
  }

  async validateCode(request: ValidateCodeRequest): Promise<ValidateCodeResponse> {
    const prompt = this.buildValidationPrompt(request);

    try {
      const result = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      const text = result.text || '';

      return this.parseValidationResponse(text);
    } catch (error) {
      console.error('LLM validation error:', error);
      throw new Error('Failed to validate code. Please try again.');
    }
  }

  async getFrameworkTemplate(framework: string): Promise<Record<string, string>> {
    // Return basic templates for each framework
    const templates = {
      react: this.getReactTemplate(),
      vue: this.getVueTemplate(),
      svelte: this.getSvelteTemplate(),
      angular: this.getAngularTemplate(),
      nodejs: this.getNodejsTemplate()
    };

    return templates[framework as keyof typeof templates] || {};
  }

  private buildGenerationPrompt(request: GenerateCodeRequest): string {
    const { prompt, framework, conversationHistory = [], currentFiles = {} } = request;
    
    const frameworkName = framework.charAt(0).toUpperCase() + framework.slice(1);
    
    let contextPrompt = '';
    if (conversationHistory.length > 0) {
      contextPrompt = `\n\nCONVERSATION HISTORY:\n${conversationHistory.map(msg => 
        `${msg.role.toUpperCase()}: ${msg.content}`
      ).join('\n')}\n`;
    }

    let filesContext = '';
    if (Object.keys(currentFiles).length > 0) {
      filesContext = `\n\nCURRENT PROJECT FILES:\n${Object.keys(currentFiles).map(path => 
        `${path}: ${currentFiles[path].substring(0, 200)}${currentFiles[path].length > 200 ? '...' : ''}`
      ).join('\n\n')}\n\nPlease consider the existing code structure when making changes. If modifying existing files, maintain consistency with the current codebase.`;
    }

    return `You are an expert ${frameworkName} developer. Generate a complete, production-ready ${frameworkName} project based on the user's request.

CRITICAL REQUIREMENTS:
1. You MUST respond with ONLY a valid JSON object - no other text before or after
2. Include ALL necessary files: package.json, configuration files, source files, HTML, CSS, etc.
3. Use TypeScript and Tailwind CSS for styling (except for Node.js backend projects)
4. Follow ${frameworkName} best practices and modern patterns
5. Ensure CORS compatibility for WebContainer deployment
6. Include proper error handling, loading states, and user feedback
7. Make the code production-ready, well-structured, and commented
8. Include all dependencies in package.json with correct versions
9. Ensure the project can run with 'npm install && npm run dev'
10. Handle edge cases and provide good UX

RESPONSE FORMAT - RESPOND WITH ONLY THIS JSON (NO MARKDOWN, NO EXPLANATION OUTSIDE JSON):
{
  "files": {
    "package.json": "complete package.json with all dependencies",
    "src/App.tsx": "main application component",
    "src/main.tsx": "entry point",
    "index.html": "HTML template",
    "vite.config.ts": "build configuration",
    "tailwind.config.js": "tailwind configuration",
    "tsconfig.json": "typescript configuration",
    "postcss.config.js": "postcss configuration",
    "src/index.css": "main CSS file with Tailwind imports"
  },
  "explanation": "Brief conversational response explaining what was created (2-3 sentences max, NO CODE)",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}

CRITICAL: 
- Start your response immediately with { and end with }
- NO markdown code blocks, NO explanatory text outside the JSON
- The "explanation" field should ONLY contain a brief description of what was built
- DO NOT include any code, file contents, or technical details in the explanation
- Keep explanation conversational and user-friendly

FRAMEWORK SPECIFIC REQUIREMENTS:

${this.getFrameworkSpecificInstructions(framework)}

${contextPrompt}

USER REQUEST: ${prompt}

${filesContext}

Generate a complete, working ${frameworkName} application that fulfills the user's request. Include all necessary files for live preview in WebContainer. Make it visually appealing with Tailwind CSS and ensure it's fully functional.`;
  }

  private buildValidationPrompt(request: ValidateCodeRequest): string {
    const { files, framework } = request;
    
    return `You are an expert code reviewer. Analyze the provided ${framework} project files and provide validation feedback.

FILES TO VALIDATE:
${Object.entries(files).map(([path, content]) => 
  `--- ${path} ---\n${content}\n`
).join('\n')}

Provide validation in this JSON format:
\`\`\`json
{
  "isValid": true/false,
  "errors": ["critical errors that prevent the code from running"],
  "warnings": ["potential issues or improvements"],
  "suggestions": ["recommendations for better code quality"]
}
\`\`\`

Check for:
1. Syntax errors
2. Missing dependencies
3. Incorrect imports/exports
4. Framework-specific issues
5. TypeScript errors
6. Best practice violations
7. Security issues
8. Performance concerns`;
  }

  private parseGenerationResponse(text: string): GenerateCodeResponse {
    try {
      console.log('Raw LLM response:', text.substring(0, 500) + '...');
      
      // Try multiple JSON extraction patterns
      let jsonText = '';
      
      // Pattern 1: JSON code block
      const jsonBlockMatch = text.match(/```json\n([\s\S]*?)\n```/);
      if (jsonBlockMatch) {
        jsonText = jsonBlockMatch[1];
      } else {
        // Pattern 2: Find JSON object
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonText = jsonMatch[0];
        } else {
          // Pattern 3: Extract between first { and last }
          const firstBrace = text.indexOf('{');
          const lastBrace = text.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            jsonText = text.substring(firstBrace, lastBrace + 1);
          }
        }
      }

      if (!jsonText) {
        console.error('No JSON found in response');
        throw new Error('No valid JSON found in response');
      }

      console.log('Extracted JSON:', jsonText.substring(0, 200) + '...');
      
      const parsed = JSON.parse(jsonText);

      // Ensure all required fields exist
      const response = {
        files: parsed.files || {},
        message: parsed.explanation || parsed.message || 'Code generated successfully!',
        suggestions: parsed.suggestions || []
      };

      console.log('Parsed response keys:', Object.keys(response));
      console.log('Files count:', Object.keys(response.files).length);

      return response;
    } catch (error) {
      console.error('Failed to parse generation response:', error);
      console.error('Raw text length:', text.length);
      
      // Fallback response
      return {
        files: {},
        message: 'I generated some code but had trouble formatting the response. Please try again.',
        suggestions: []
      };
    }
  }

  private parseValidationResponse(text: string): ValidateCodeResponse {
    try {
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('No valid JSON found in validation response');
      }

      const jsonText = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonText);

      return {
        isValid: parsed.isValid || false,
        errors: parsed.errors || [],
        warnings: parsed.warnings || [],
        suggestions: parsed.suggestions || []
      };
    } catch (error) {
      console.error('Failed to parse validation response:', error);
      return {
        isValid: false,
        errors: ['Failed to validate code'],
        warnings: [],
        suggestions: []
      };
    }
  }

  private getFrameworkSpecificInstructions(framework: string): string {
    switch (framework) {
      case 'react':
        return `
- Use React 18+ with TypeScript and functional components
- Use Vite as build tool with proper configuration
- Include proper JSX/TSX components with modern React patterns
- Use React hooks (useState, useEffect, etc.) appropriately
- Include proper state management (useState, useContext, or Zustand if needed)
- Use Tailwind CSS for styling with responsive design
- Include proper error boundaries and loading states
- Follow React best practices and naming conventions
- Include proper prop types and TypeScript interfaces
- Ensure components are reusable and well-structured`;

      case 'vue':
        return `
- Use Vue 3+ with TypeScript and Composition API
- Use Vite as build tool with Vue plugin
- Create proper .vue single file components
- Use modern Vue patterns (setup script, reactive, computed, etc.)
- Include proper component communication (props, emits, provide/inject)
- Use Tailwind CSS for styling with responsive design
- Include proper error handling and loading states
- Follow Vue 3 best practices and naming conventions
- Use TypeScript interfaces for props and data
- Ensure components are reusable and well-structured`;

      case 'svelte':
        return `
- Use SvelteKit with TypeScript
- Create proper .svelte components with modern syntax
- Use Svelte stores for state management when needed
- Include proper component props and event handling
- Use Tailwind CSS for styling with responsive design
- Include proper error handling and loading states
- Follow SvelteKit project structure and conventions
- Use TypeScript for type safety
- Ensure components are reactive and performant
- Include proper routing if needed`;

      case 'angular':
        return `
- Use Angular 17+ with TypeScript and standalone components
- Include proper component structure with services
- Use Angular CLI project structure and conventions
- Include proper dependency injection and services
- Use Angular Material or Tailwind CSS for styling
- Include proper error handling and loading states
- Follow Angular best practices and style guide
- Use TypeScript interfaces and proper typing
- Include proper routing and guards if needed
- Ensure components are modular and testable`;

      case 'nodejs':
        return `
- Use Node.js with Express and TypeScript
- Include proper API routes with RESTful design
- Use modern ES modules and async/await
- Include proper error handling middleware
- Include CORS configuration for frontend integration
- Use proper request validation and sanitization
- Include proper logging and monitoring
- Follow Node.js best practices and security guidelines
- Use TypeScript interfaces for request/response types
- Include proper project structure and organization
- Add health check endpoints and proper status codes`;

      default:
        return '';
    }
  }

  private getReactTemplate(): Record<string, string> {
    return {
      'package.json': JSON.stringify({
        name: 'react-app',
        private: true,
        version: '0.0.0',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'tsc && vite build',
          preview: 'vite preview'
        },
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0'
        },
        devDependencies: {
          '@types/react': '^18.2.43',
          '@types/react-dom': '^18.2.17',
          '@vitejs/plugin-react': '^4.2.1',
          autoprefixer: '^10.4.16',
          postcss: '^8.4.32',
          tailwindcss: '^3.3.6',
          typescript: '^5.2.2',
          vite: '^5.0.8'
        }
      }, null, 2)
    };
  }

  private getVueTemplate(): Record<string, string> {
    return {
      'package.json': JSON.stringify({
        name: 'vue-app',
        private: true,
        version: '0.0.0',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'vue-tsc && vite build',
          preview: 'vite preview'
        },
        dependencies: {
          vue: '^3.3.11'
        },
        devDependencies: {
          '@vitejs/plugin-vue': '^4.5.2',
          autoprefixer: '^10.4.16',
          postcss: '^8.4.32',
          tailwindcss: '^3.3.6',
          typescript: '^5.2.2',
          vite: '^5.0.8',
          'vue-tsc': '^1.8.25'
        }
      }, null, 2)
    };
  }

  private getSvelteTemplate(): Record<string, string> {
    return {
      'package.json': JSON.stringify({
        name: 'svelte-app',
        private: true,
        version: '0.0.0',
        type: 'module',
        scripts: {
          dev: 'vite dev',
          build: 'vite build',
          preview: 'vite preview'
        },
        dependencies: {
          '@sveltejs/kit': '^1.20.4'
        },
        devDependencies: {
          '@sveltejs/adapter-auto': '^2.0.0',
          '@sveltejs/vite-plugin-svelte': '^2.4.2',
          autoprefixer: '^10.4.16',
          postcss: '^8.4.32',
          svelte: '^4.0.5',
          tailwindcss: '^3.3.6',
          typescript: '^5.0.0',
          vite: '^4.4.2'
        }
      }, null, 2)
    };
  }

  private getAngularTemplate(): Record<string, string> {
    return {
      'package.json': JSON.stringify({
        name: 'angular-app',
        version: '0.0.0',
        scripts: {
          dev: 'ng serve',
          build: 'ng build',
          watch: 'ng build --watch --configuration development'
        },
        dependencies: {
          '@angular/animations': '^17.0.0',
          '@angular/common': '^17.0.0',
          '@angular/compiler': '^17.0.0',
          '@angular/core': '^17.0.0',
          '@angular/forms': '^17.0.0',
          '@angular/platform-browser': '^17.0.0',
          '@angular/platform-browser-dynamic': '^17.0.0',
          '@angular/router': '^17.0.0',
          rxjs: '~7.8.0',
          tslib: '^2.3.0',
          'zone.js': '~0.14.0'
        },
        devDependencies: {
          '@angular-devkit/build-angular': '^17.0.0',
          '@angular/cli': '~17.0.0',
          '@angular/compiler-cli': '^17.0.0',
          autoprefixer: '^10.4.16',
          postcss: '^8.4.32',
          tailwindcss: '^3.3.6',
          typescript: '~5.2.0'
        }
      }, null, 2)
    };
  }

  private getNodejsTemplate(): Record<string, string> {
    return {
      'package.json': JSON.stringify({
        name: 'nodejs-app',
        version: '1.0.0',
        type: 'module',
        scripts: {
          dev: 'tsx watch src/index.ts',
          build: 'tsc',
          start: 'node dist/index.js'
        },
        dependencies: {
          express: '^4.18.2',
          cors: '^2.8.5'
        },
        devDependencies: {
          '@types/express': '^4.17.21',
          '@types/cors': '^2.8.17',
          '@types/node': '^20.10.5',
          tsx: '^4.6.2',
          typescript: '^5.3.3'
        }
      }, null, 2)
    };
  }
}
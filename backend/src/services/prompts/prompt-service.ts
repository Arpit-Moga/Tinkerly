/**
 * Prompt Service Implementation - Phase 2: Service Layer Refactoring
 * 
 * Handles prompt construction, optimization, and framework-specific
 * instructions for code generation and validation tasks.
 * 
 * @fileoverview Prompt engineering and construction service
 * @version 2.0.0
 * @since Phase 2
 */

import { IPromptService } from '../abstractions/index.js';
import { GenerateCodeRequest, ValidateCodeRequest } from '../../types/index.js';

/**
 * Prompt templates and configurations
 */
interface PromptTemplate {
  /** Base template string */
  template: string;
  /** Required variables in template */
  variables: string[];
  /** Template version for caching */
  version: string;
}

/**
 * Framework-specific configuration
 */
interface FrameworkConfig {
  /** Framework display name */
  displayName: string;
  /** Specific instructions for this framework */
  instructions: string;
  /** Required files for this framework */
  requiredFiles: string[];
  /** Best practices specific to framework */
  bestPractices: string[];
  /** Common patterns and conventions */
  patterns: string[];
}

/**
 * Prompt Service Implementation
 * 
 * Provides intelligent prompt construction with:
 * - Framework-specific optimizations
 * - Context-aware prompt building
 * - Template management and caching
 * - Conversation history integration
 * - Best practices enforcement
 * 
 * @example
 * ```typescript
 * const promptService = new PromptService();
 * 
 * const prompt = promptService.buildGenerationPrompt({
 *   prompt: 'Create a todo app',
 *   framework: 'react',
 *   conversationHistory: []
 * });
 * ```
 */
export class PromptService implements IPromptService {
  private readonly frameworkConfigs: Map<string, FrameworkConfig>;
  private readonly promptTemplates: Map<string, PromptTemplate>;

  /**
   * Initialize prompt service with framework configurations
   */
  constructor() {
    this.frameworkConfigs = new Map();
    this.promptTemplates = new Map();
    
    this.initializeFrameworkConfigs();
    this.initializePromptTemplates();
    
    console.log('📝 Prompt service initialized with framework configurations');
  }

  /**
   * Build generation prompt for code creation
   * 
   * @param request - Code generation request parameters
   * @returns Optimized prompt string for code generation
   */
  buildGenerationPrompt(request: GenerateCodeRequest): string {
    const { prompt, framework, conversationHistory = [], currentFiles = {} } = request;
    
    const frameworkConfig = this.getFrameworkConfig(framework);
    const template = this.getPromptTemplate('code-generation');
    
    // Build context sections
    const contextSections = {
      frameworkName: frameworkConfig.displayName,
      frameworkInstructions: frameworkConfig.instructions,
      conversationContext: this.buildConversationContext(conversationHistory),
      filesContext: this.buildFilesContext(currentFiles),
      userRequest: prompt.trim(),
      responseFormat: this.getResponseFormatInstructions(),
      criticalRequirements: this.getCriticalRequirements(framework),
      bestPractices: this.buildBestPracticesSection(frameworkConfig)
    };

    // Replace template variables
    let finalPrompt = template.template;
    Object.entries(contextSections).forEach(([key, value]) => {
      finalPrompt = finalPrompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    console.log(`📝 Generated prompt for ${framework}: ${finalPrompt.length} characters`);
    return finalPrompt;
  }

  /**
   * Build validation prompt for code review
   * 
   * @param request - Code validation request parameters
   * @returns Optimized prompt string for code validation
   */
  buildValidationPrompt(request: ValidateCodeRequest): string {
    const { files, framework } = request;
    
    const frameworkConfig = this.getFrameworkConfig(framework);
    const template = this.getPromptTemplate('code-validation');
    
    // Build validation context
    const contextSections = {
      frameworkName: frameworkConfig.displayName,
      filesToValidate: this.buildFilesForValidation(files),
      validationCriteria: this.getValidationCriteria(framework),
      responseFormat: this.getValidationResponseFormat(),
      frameworkSpecificChecks: this.getFrameworkSpecificValidation(framework)
    };

    // Replace template variables
    let finalPrompt = template.template;
    Object.entries(contextSections).forEach(([key, value]) => {
      finalPrompt = finalPrompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    console.log(`📝 Generated validation prompt for ${framework}: ${finalPrompt.length} characters`);
    return finalPrompt;
  }

  /**
   * Get framework-specific instructions
   * 
   * @param framework - Target framework identifier
   * @returns Framework-specific instruction string
   */
  getFrameworkInstructions(framework: string): string {
    const config = this.getFrameworkConfig(framework);
    return config.instructions;
  }

  /**
   * Get supported frameworks
   * 
   * @returns Array of supported framework identifiers
   */
  getSupportedFrameworks(): string[] {
    return Array.from(this.frameworkConfigs.keys());
  }

  /**
   * Update framework configuration
   * 
   * @param framework - Framework identifier
   * @param config - Updated configuration
   */
  updateFrameworkConfig(framework: string, config: Partial<FrameworkConfig>): void {
    const existing = this.frameworkConfigs.get(framework);
    if (existing) {
      this.frameworkConfigs.set(framework, { ...existing, ...config });
      console.log(`📝 Updated framework config for ${framework}`);
    }
  }

  /**
   * Add custom prompt template
   * 
   * @param name - Template name
   * @param template - Template configuration
   */
  addPromptTemplate(name: string, template: PromptTemplate): void {
    this.promptTemplates.set(name, template);
    console.log(`📝 Added prompt template: ${name}`);
  }

  /**
   * Initialize framework configurations
   * 
   * @private
   */
  private initializeFrameworkConfigs(): void {
    // React configuration
    this.frameworkConfigs.set('react', {
      displayName: 'React',
      instructions: `
- Use React 18+ with TypeScript and functional components
- Use Vite as build tool with proper configuration
- Include proper JSX/TSX components with modern React patterns
- Use React hooks (useState, useEffect, etc.) appropriately
- Include proper state management (useState, useContext, or Zustand if needed)
- Use Tailwind CSS for styling with responsive design
- Include proper error boundaries and loading states
- Follow React best practices and naming conventions
- Include proper prop types and TypeScript interfaces
- Ensure components are reusable and well-structured`,
      requiredFiles: ['package.json', 'index.html', 'vite.config.ts', 'src/main.tsx', 'src/App.tsx'],
      bestPractices: [
        'Use functional components with hooks',
        'Implement proper error boundaries',
        'Use TypeScript for type safety',
        'Follow React naming conventions',
        'Optimize performance with useMemo/useCallback when needed'
      ],
      patterns: [
        'Component composition over inheritance',
        'Custom hooks for reusable logic',
        'Context for global state',
        'Proper event handling patterns'
      ]
    });

    // Vue configuration
    this.frameworkConfigs.set('vue', {
      displayName: 'Vue',
      instructions: `
- Use Vue 3+ with TypeScript and Composition API
- Use Vite as build tool with Vue plugin
- Create proper .vue single file components
- Use modern Vue patterns (setup script, reactive, computed, etc.)
- Include proper component communication (props, emits, provide/inject)
- Use Tailwind CSS for styling with responsive design
- Include proper error handling and loading states
- Follow Vue 3 best practices and naming conventions
- Use TypeScript interfaces for props and data
- Ensure components are reusable and well-structured`,
      requiredFiles: ['package.json', 'index.html', 'vite.config.ts', 'src/main.ts', 'src/App.vue'],
      bestPractices: [
        'Use Composition API over Options API',
        'Implement proper reactivity patterns',
        'Use TypeScript for type safety',
        'Follow Vue style guide',
        'Use provide/inject for dependency injection'
      ],
      patterns: [
        'Single file components',
        'Composition functions',
        'Reactive state management',
        'Template refs for DOM access'
      ]
    });

    // Add other frameworks...
    this.initializeOtherFrameworks();
  }

  /**
   * Initialize other framework configurations
   * 
   * @private
   */
  private initializeOtherFrameworks(): void {
    // Svelte configuration
    this.frameworkConfigs.set('svelte', {
      displayName: 'Svelte',
      instructions: `
- Use SvelteKit with TypeScript
- Create proper .svelte components with modern syntax
- Use Svelte stores for state management when needed
- Include proper component props and event handling
- Use Tailwind CSS for styling with responsive design
- Include proper error handling and loading states
- Follow SvelteKit project structure and conventions
- Use TypeScript for type safety
- Ensure components are reactive and performant
- Include proper routing if needed`,
      requiredFiles: ['package.json', 'vite.config.js', 'src/app.html', 'src/routes/+layout.svelte'],
      bestPractices: [
        'Use reactive statements effectively',
        'Implement proper component lifecycle',
        'Use stores for shared state',
        'Follow Svelte conventions'
      ],
      patterns: [
        'Reactive declarations',
        'Component slots',
        'Store subscriptions',
        'Action functions'
      ]
    });

    // Angular configuration
    this.frameworkConfigs.set('angular', {
      displayName: 'Angular',
      instructions: `
- Use Angular 17+ with TypeScript and standalone components
- Include proper component structure with services
- Use Angular CLI project structure and conventions
- Include proper dependency injection and services
- Use Angular Material or Tailwind CSS for styling
- Include proper error handling and loading states
- Follow Angular best practices and style guide
- Use TypeScript interfaces and proper typing
- Include proper routing and guards if needed
- Ensure components are modular and testable`,
      requiredFiles: ['package.json', 'src/index.html', 'src/main.ts', 'src/app/app.component.ts'],
      bestPractices: [
        'Use standalone components',
        'Implement proper dependency injection',
        'Use RxJS for reactive programming',
        'Follow Angular style guide'
      ],
      patterns: [
        'Service injection',
        'Observable patterns',
        'Component lifecycle hooks',
        'Template-driven forms'
      ]
    });

    // Node.js configuration
    this.frameworkConfigs.set('nodejs', {
      displayName: 'Node.js',
      instructions: `
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
- Add health check endpoints and proper status codes`,
      requiredFiles: ['package.json', 'tsconfig.json', 'src/index.ts'],
      bestPractices: [
        'Use Express middleware properly',
        'Implement proper error handling',
        'Use environment variables',
        'Follow REST API conventions'
      ],
      patterns: [
        'Middleware composition',
        'Route organization',
        'Error handling patterns',
        'Async/await usage'
      ]
    });
  }

  /**
   * Initialize prompt templates
   * 
   * @private
   */
  private initializePromptTemplates(): void {
    // Code generation template
    this.promptTemplates.set('code-generation', {
      template: `You are an expert {{frameworkName}} developer. Generate a complete, production-ready {{frameworkName}} project based on the user's request.

{{criticalRequirements}}

FRAMEWORK SPECIFIC REQUIREMENTS:
{{frameworkInstructions}}

{{conversationContext}}

USER REQUEST: {{userRequest}}

{{filesContext}}

{{responseFormat}}

{{bestPractices}}

Generate a complete, working {{frameworkName}} application that fulfills the user's request. Include all necessary files for live preview in WebContainer. Make it visually appealing with Tailwind CSS and ensure it's fully functional.`,
      variables: ['frameworkName', 'frameworkInstructions', 'conversationContext', 'userRequest', 'filesContext', 'responseFormat', 'criticalRequirements', 'bestPractices'],
      version: '2.0.0'
    });

    // Code validation template
    this.promptTemplates.set('code-validation', {
      template: `You are an expert code reviewer. Analyze the provided {{frameworkName}} project files and provide validation feedback.

FILES TO VALIDATE:
{{filesToValidate}}

VALIDATION CRITERIA:
{{validationCriteria}}

FRAMEWORK-SPECIFIC CHECKS:
{{frameworkSpecificChecks}}

{{responseFormat}}`,
      variables: ['frameworkName', 'filesToValidate', 'validationCriteria', 'frameworkSpecificChecks', 'responseFormat'],
      version: '2.0.0'
    });
  }

  /**
   * Get framework configuration
   * 
   * @param framework - Framework identifier
   * @returns Framework configuration
   * @private
   */
  private getFrameworkConfig(framework: string): FrameworkConfig {
    const config = this.frameworkConfigs.get(framework);
    if (!config) {
      throw new Error(`Unsupported framework: ${framework}`);
    }
    return config;
  }

  /**
   * Get prompt template
   * 
   * @param templateName - Template name
   * @returns Prompt template
   * @private
   */
  private getPromptTemplate(templateName: string): PromptTemplate {
    const template = this.promptTemplates.get(templateName);
    if (!template) {
      throw new Error(`Prompt template not found: ${templateName}`);
    }
    return template;
  }

  /**
   * Build conversation context section
   * 
   * @param conversationHistory - Previous conversation messages
   * @returns Formatted conversation context
   * @private
   */
  private buildConversationContext(conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>): string {
    if (conversationHistory.length === 0) {
      return '';
    }

    const contextLines = conversationHistory.map(msg => 
      `${msg.role.toUpperCase()}: ${msg.content}`
    );

    return `\n\nCONVERSATION HISTORY:\n${contextLines.join('\n')}\n`;
  }

  /**
   * Build files context section
   * 
   * @param currentFiles - Current project files
   * @returns Formatted files context
   * @private
   */
  private buildFilesContext(currentFiles: Record<string, string>): string {
    if (Object.keys(currentFiles).length === 0) {
      return '';
    }

    const fileDescriptions = Object.keys(currentFiles).map(path => {
      const content = currentFiles[path];
      const preview = content.substring(0, 200);
      const truncated = content.length > 200 ? '...' : '';
      return `${path}: ${preview}${truncated}`;
    });

    return `\n\nCURRENT PROJECT FILES:\n${fileDescriptions.join('\n\n')}\n\nPlease consider the existing code structure when making changes. If modifying existing files, maintain consistency with the current codebase.`;
  }

  /**
   * Build files for validation section
   * 
   * @param files - Files to validate
   * @returns Formatted files content
   * @private
   */
  private buildFilesForValidation(files: Record<string, string>): string {
    return Object.entries(files).map(([path, content]) => 
      `--- ${path} ---\n${content}\n`
    ).join('\n');
  }

  /**
   * Get response format instructions
   * 
   * @returns Response format instructions
   * @private
   */
  private getResponseFormatInstructions(): string {
    return `RESPONSE FORMAT:
The response will be automatically structured as JSON with these fields:
- "files": Array of objects, where each object has "fileName" (string) and "fileContent" (string)
- "explanation": Brief conversational explanation (2-3 sentences, no code)
- "suggestions": Array of helpful suggestions for the user

IMPORTANT NOTES:
- File contents should be complete and ready to use
- Include ALL necessary files for the project to work
- The explanation should be user-friendly and describe what was built
- Suggestions should be actionable next steps or improvements`;
  }

  /**
   * Get critical requirements section
   * 
   * @param framework - Target framework
   * @returns Critical requirements text
   * @private
   */
  private getCriticalRequirements(framework: string): string {
    return `CRITICAL REQUIREMENTS:
1. You MUST respond with ONLY a valid JSON object - no other text before or after
2. Include ALL necessary files: package.json, configuration files, source files, HTML, CSS, etc.
3. Use TypeScript and Tailwind CSS for styling (except for Node.js backend projects)
4. Follow ${framework} best practices and modern patterns
5. Ensure CORS compatibility for WebContainer deployment
6. Include proper error handling, loading states, and user feedback
7. Make the code production-ready, well-structured, and commented
8. Include all dependencies in package.json with correct versions
9. Ensure the project can run with 'npm install && npm run dev'
10. Handle edge cases and provide good UX`;
  }

  /**
   * Build best practices section
   * 
   * @param frameworkConfig - Framework configuration
   * @returns Best practices text
   * @private
   */
  private buildBestPracticesSection(frameworkConfig: FrameworkConfig): string {
    const practices = frameworkConfig.bestPractices.map(practice => `- ${practice}`).join('\n');
    const patterns = frameworkConfig.patterns.map(pattern => `- ${pattern}`).join('\n');

    return `BEST PRACTICES:
${practices}

RECOMMENDED PATTERNS:
${patterns}`;
  }

  /**
   * Get validation criteria
   * 
   * @param framework - Target framework
   * @returns Validation criteria text
   * @private
   */
  private getValidationCriteria(framework: string): string {
    return `Check for:
1. Syntax errors
2. Missing dependencies
3. Incorrect imports/exports
4. Framework-specific issues
5. TypeScript errors
6. Best practice violations
7. Security issues
8. Performance concerns`;
  }

  /**
   * Get validation response format
   * 
   * @returns Validation response format instructions
   * @private
   */
  private getValidationResponseFormat(): string {
    return `Provide validation in this JSON format:
{
  "isValid": true/false,
  "errors": ["critical errors that prevent the code from running"],
  "warnings": ["potential issues or improvements"],
  "suggestions": ["recommendations for better code quality"]
}`;
  }

  /**
   * Get framework-specific validation checks
   * 
   * @param framework - Target framework
   * @returns Framework-specific validation instructions
   * @private
   */
  private getFrameworkSpecificValidation(framework: string): string {
    const config = this.getFrameworkConfig(framework);
    
    const checks = [
      `Verify ${config.displayName}-specific patterns are followed`,
      `Check for proper ${config.displayName} project structure`,
      `Validate ${config.displayName} best practices implementation`,
      `Ensure all required files are present: ${config.requiredFiles.join(', ')}`
    ];

    return checks.join('\n');
  }
}
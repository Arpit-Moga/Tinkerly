/**
 * Service Initializer - Phase 2: Service Layer Refactoring
 * 
 * Initializes and configures the dependency injection container with all
 * required services. Provides a centralized place for service registration
 * and configuration.
 * 
 * @fileoverview Service container initialization and configuration
 * @version 2.0.0
 * @since Phase 2
 */

import { ServiceContainer } from './container/service-container.js';
import { 
  SERVICE_TOKENS,
  IServiceConfig,
  ICodeGenerationService,
  ILLMProvider,
  IPromptService,
  ICacheService,
  ITemplateService
} from './abstractions/index.js';
import { CodeGenerationService } from './code-generation-service.js';
import { GeminiProvider } from './providers/gemini-provider.js';
import { PromptService } from './prompts/prompt-service.js';
import { MemoryCacheService } from './cache/memory-cache.js';
import { config } from '../config/index.js';

/**
 * Template Service Implementation
 * Simple implementation for framework templates
 */
class TemplateService implements ITemplateService {
  async getFrameworkTemplate(framework: string): Promise<Record<string, string>> {
    const template = await this.getTemplate(framework);
    return template.files;
  }

  async getSupportedFrameworks(): Promise<string[]> {
    return ['react', 'vue', 'svelte', 'angular', 'nodejs'];
  }

  private async getTemplate(framework: string): Promise<{ files: Record<string, string>; dependencies: Record<string, string> }> {
    // Basic template implementation - can be enhanced later
    const templates = {
      react: {
        files: {
          'package.json': JSON.stringify({
            name: 'react-app',
            version: '1.0.0',
            dependencies: {
              'react': '^18.0.0',
              'react-dom': '^18.0.0'
            }
          }, null, 2),
          'src/App.tsx': `import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <h1 className="text-4xl font-bold text-gray-900">Hello React!</h1>
    </div>
  );
}`
        },
        dependencies: {
          'react': '^18.0.0',
          'react-dom': '^18.0.0',
          '@types/react': '^18.0.0',
          '@types/react-dom': '^18.0.0'
        }
      },
      vue: {
        files: {
          'package.json': JSON.stringify({
            name: 'vue-app',
            version: '1.0.0',
            dependencies: {
              'vue': '^3.0.0'
            }
          }, null, 2),
          'src/App.vue': `<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center">
    <h1 class="text-4xl font-bold text-gray-900">Hello Vue!</h1>
  </div>
</template>

<script setup lang="ts">
// Vue 3 Composition API
</script>`
        },
        dependencies: {
          'vue': '^3.0.0'
        }
      },
      nodejs: {
        files: {
          'package.json': JSON.stringify({
            name: 'node-app',
            version: '1.0.0',
            main: 'index.js',
            dependencies: {
              'express': '^4.18.0'
            }
          }, null, 2),
          'index.js': `const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.json({ message: 'Hello Node.js!' });
});

app.listen(port, () => {
  console.log(\`Server running at http://localhost:\${port}\`);
});`
        },
        dependencies: {
          'express': '^4.18.0',
          '@types/express': '^4.17.0'
        }
      }
    };

    return templates[framework as keyof typeof templates] || templates.react;
  }

  async validateTemplate(template: Record<string, string>, framework: string): Promise<boolean> {
    // Simple validation - check for required files
    if (!template['package.json']) {
      return false;
    }
    
    return true;
  }
}

/**
 * Initialize and configure the service container
 * 
 * @param serviceConfig - Optional service configuration
 * @returns Configured service container
 */
export function initializeServices(serviceConfig?: Partial<IServiceConfig>): ServiceContainer {
  const container = new ServiceContainer();

  // Create service configuration
  const config: IServiceConfig = {
    llm: {
      provider: 'gemini',
      apiKey: process.env.GEMINI_API_KEY || '',
      model: 'gemini-2.0-flash-exp',
      timeout: 30000,
      retries: 3,
      ...serviceConfig?.llm
    },
    cache: {
      type: 'memory',
      ttl: 3600000, // 1 hour
      maxSize: 100,
      ...serviceConfig?.cache
    },
    templates: {
      cacheEnabled: true,
      ...serviceConfig?.templates
    }
  };

  try {
    // Register cache service (singleton)
    container.register(
      SERVICE_TOKENS.CACHE_SERVICE,
      MemoryCacheService,
      true
    );

    // Register template service (singleton)
    container.registerInstance(
      SERVICE_TOKENS.TEMPLATE_SERVICE,
      new TemplateService()
    );

    // Register prompt service (singleton)
    container.register(
      SERVICE_TOKENS.PROMPT_SERVICE,
      PromptService,
      true
    );

    // Register LLM provider (singleton)
    container.registerInstance(
      SERVICE_TOKENS.LLM_PROVIDER,
      new GeminiProvider(config.llm!)
    );

    // Register code generation service (transient) with manual dependency injection
    container.registerInstance(
      SERVICE_TOKENS.CODE_GENERATION_SERVICE,
      new CodeGenerationService(
        container.resolve(SERVICE_TOKENS.LLM_PROVIDER),
        container.resolve(SERVICE_TOKENS.PROMPT_SERVICE),
        container.resolve(SERVICE_TOKENS.CACHE_SERVICE),
        container.resolve(SERVICE_TOKENS.TEMPLATE_SERVICE)
      )
    );

    console.log('✅ Services initialized successfully');
    console.log(`📦 Registered services: ${container.getRegisteredTokens().length}`);
    
    return container;
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    throw error;
  }
}

/**
 * Express middleware to inject service container into requests
 * 
 * @param container - Service container instance
 * @returns Express middleware function
 */
export function serviceContainerMiddleware(container: ServiceContainer) {
  return (req: any, res: any, next: any) => {
    req.serviceContainer = container;
    next();
  };
}

/**
 * Gracefully dispose of services
 * 
 * @param container - Service container to dispose
 */
export async function disposeServices(container: ServiceContainer): Promise<void> {
  try {
    await container.dispose();
    console.log('✅ Services disposed successfully');
  } catch (error) {
    console.error('❌ Error disposing services:', error);
  }
}
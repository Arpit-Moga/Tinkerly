/**
 * Service Container Implementation - Phase 2: Service Layer Refactoring
 * 
 * Implements dependency injection container for managing service instances
 * and their dependencies. Supports singleton and transient lifetimes.
 * 
 * @fileoverview Dependency injection container implementation
 * @version 2.0.0
 * @since Phase 2
 */

import { IServiceContainer } from '../abstractions/index.js';

/**
 * Service registration metadata
 * Contains information about registered services
 */
interface ServiceRegistration {
  /** Service constructor function */
  implementation: new (...args: any[]) => any;
  /** Whether to use singleton pattern */
  singleton: boolean;
  /** Cached singleton instance */
  instance?: any;
  /** Service dependencies */
  dependencies?: (string | symbol)[];
}

/**
 * Service Container Implementation
 * 
 * Provides dependency injection capabilities with support for:
 * - Singleton and transient service lifetimes
 * - Automatic dependency resolution
 * - Circular dependency detection
 * - Service instance caching
 * 
 * @example
 * ```typescript
 * const container = new ServiceContainer();
 * 
 * // Register services
 * container.register(SERVICE_TOKENS.CACHE_SERVICE, MemoryCacheService, true);
 * container.register(SERVICE_TOKENS.LLM_PROVIDER, GeminiProvider);
 * 
 * // Resolve services
 * const cacheService = container.resolve<ICacheService>(SERVICE_TOKENS.CACHE_SERVICE);
 * ```
 */
export class ServiceContainer implements IServiceContainer {
  /** Map of registered services */
  private readonly services = new Map<string | symbol, ServiceRegistration>();
  
  /** Map of service instances for singleton pattern */
  private readonly instances = new Map<string | symbol, any>();
  
  /** Set to track circular dependencies during resolution */
  private readonly resolutionStack = new Set<string | symbol>();

  /**
   * Register a service implementation
   * 
   * @param token - Unique service identifier
   * @param implementation - Service constructor function
   * @param singleton - Whether to use singleton pattern (default: false)
   * @throws Error if service is already registered
   * 
   * @example
   * ```typescript
   * container.register(SERVICE_TOKENS.CACHE_SERVICE, MemoryCacheService, true);
   * ```
   */
  register<T>(
    token: string | symbol,
    implementation: new (...args: any[]) => T,
    singleton: boolean = false
  ): void {
    if (this.services.has(token)) {
      throw new Error(`Service with token ${String(token)} is already registered`);
    }

    this.services.set(token, {
      implementation,
      singleton,
      dependencies: this.extractDependencies(implementation)
    });

    console.log(`📦 Service registered: ${String(token)} (singleton: ${singleton})`);
  }

  /**
   * Register a service instance directly
   * 
   * @param token - Unique service identifier
   * @param instance - Service instance
   * @throws Error if service is already registered
   * 
   * @example
   * ```typescript
   * const cacheService = new MemoryCacheService();
   * container.registerInstance(SERVICE_TOKENS.CACHE_SERVICE, cacheService);
   * ```
   */
  registerInstance<T>(token: string | symbol, instance: T): void {
    if (this.services.has(token) || this.instances.has(token)) {
      throw new Error(`Service with token ${String(token)} is already registered`);
    }

    this.instances.set(token, instance);
    console.log(`📦 Service instance registered: ${String(token)}`);
  }

  /**
   * Resolve a service instance
   * 
   * @param token - Service identifier
   * @returns Service instance
   * @throws Error if service is not registered or circular dependency detected
   * 
   * @example
   * ```typescript
   * const cacheService = container.resolve<ICacheService>(SERVICE_TOKENS.CACHE_SERVICE);
   * ```
   */
  resolve<T>(token: string | symbol): T {
    // Check for circular dependency
    if (this.resolutionStack.has(token)) {
      const stackArray = Array.from(this.resolutionStack);
      throw new Error(
        `Circular dependency detected: ${stackArray.map(String).join(' -> ')} -> ${String(token)}`
      );
    }

    // Check if instance is already cached
    if (this.instances.has(token)) {
      return this.instances.get(token) as T;
    }

    // Get service registration
    const registration = this.services.get(token);
    if (!registration) {
      throw new Error(`Service with token ${String(token)} is not registered`);
    }

    // Add to resolution stack for circular dependency detection
    this.resolutionStack.add(token);

    try {
      // Resolve dependencies
      const dependencies = this.resolveDependencies(registration.dependencies || []);
      
      // Create service instance
      const instance = new registration.implementation(...dependencies);

      // Cache singleton instances
      if (registration.singleton) {
        this.instances.set(token, instance);
        registration.instance = instance;
      }

      console.log(`🔧 Service resolved: ${String(token)}`);
      return instance as T;
    } finally {
      // Remove from resolution stack
      this.resolutionStack.delete(token);
    }
  }

  /**
   * Check if service is registered
   * 
   * @param token - Service identifier
   * @returns True if service is registered
   * 
   * @example
   * ```typescript
   * if (container.isRegistered(SERVICE_TOKENS.CACHE_SERVICE)) {
   *   const service = container.resolve(SERVICE_TOKENS.CACHE_SERVICE);
   * }
   * ```
   */
  isRegistered(token: string | symbol): boolean {
    return this.services.has(token) || this.instances.has(token);
  }

  /**
   * Get all registered service tokens
   * @returns Array of registered service tokens
   */
  getRegisteredTokens(): (string | symbol)[] {
    const tokens: (string | symbol)[] = [];
    this.services.forEach((_, token) => tokens.push(token));
    this.instances.forEach((_, token) => tokens.push(token));
    return tokens;
  }

  /**
   * Get all registered service tokens
   * 
   * @returns Array of registered service tokens
   */
  getRegisteredServices(): (string | symbol)[] {
    return [
      ...Array.from(this.services.keys()),
      ...Array.from(this.instances.keys())
    ];
  }

  /**
   * Clear all registered services and instances
   * Useful for testing and cleanup
   */
  clear(): void {
    this.services.clear();
    this.instances.clear();
    this.resolutionStack.clear();
    console.log('🧹 Service container cleared');
  }

  /**
   * Get service registration information
   * 
   * @param token - Service identifier
   * @returns Service registration metadata or null
   */
  getServiceInfo(token: string | symbol): ServiceRegistration | null {
    return this.services.get(token) || null;
  }

  /**
   * Extract dependencies from service constructor
   * 
   * @param implementation - Service constructor
   * @returns Array of dependency tokens
   * @private
   */
  private extractDependencies(implementation: new (...args: any[]) => any): (string | symbol)[] {
    // In a real implementation, this would use reflection or decorators
    // For now, we'll return an empty array and rely on manual dependency specification
    // This could be enhanced with TypeScript decorators or metadata reflection
    return [];
  }

  /**
   * Resolve array of dependencies
   * 
   * @param dependencies - Array of dependency tokens
   * @returns Array of resolved dependency instances
   * @private
   */
  private resolveDependencies(dependencies: (string | symbol)[]): any[] {
    return dependencies.map(dep => this.resolve(dep));
  }

  /**
   * Create a child container with inherited registrations
   * Useful for scoped service resolution
   * 
   * @returns New service container with inherited registrations
   */
  createChildContainer(): ServiceContainer {
    const child = new ServiceContainer();
    
    // Copy service registrations (but not instances)
    for (const [token, registration] of this.services) {
      child.services.set(token, { ...registration });
    }
    
    console.log(`👶 Child container created with ${this.services.size} inherited services`);
    return child;
  }

  /**
   * Dispose of all singleton instances that implement IDisposable
   * Useful for cleanup during application shutdown
   */
  async dispose(): Promise<void> {
    const disposalPromises: Promise<void>[] = [];

    for (const [token, instance] of this.instances) {
      if (instance && typeof instance.dispose === 'function') {
        console.log(`🗑️ Disposing service: ${String(token)}`);
        disposalPromises.push(
          Promise.resolve(instance.dispose()).catch(error => {
            console.error(`❌ Error disposing service ${String(token)}:`, error);
          })
        );
      }
    }

    await Promise.all(disposalPromises);
    this.clear();
    console.log('🧹 Service container disposed');
  }
}

/**
 * Global service container instance
 * Provides a default container for application-wide service registration
 */
export const globalContainer = new ServiceContainer();

/**
 * Decorator for automatic service registration
 * 
 * @param token - Service token
 * @param singleton - Whether to use singleton pattern
 * @returns Class decorator
 * 
 * @example
 * ```typescript
 * @Service(SERVICE_TOKENS.CACHE_SERVICE, true)
 * class MemoryCacheService implements ICacheService {
 *   // Implementation
 * }
 * ```
 */
export function Service(token: string | symbol, singleton: boolean = false) {
  return function <T extends new (...args: any[]) => any>(constructor: T) {
    globalContainer.register(token, constructor, singleton);
    return constructor;
  };
}

/**
 * Decorator for dependency injection
 * 
 * @param tokens - Array of dependency tokens
 * @returns Class decorator
 * 
 * @example
 * ```typescript
 * @Injectable([SERVICE_TOKENS.CACHE_SERVICE, SERVICE_TOKENS.LLM_PROVIDER])
 * class CodeGenerationService {
 *   constructor(
 *     private cacheService: ICacheService,
 *     private llmProvider: ILLMProvider
 *   ) {}
 * }
 * ```
 */
export function Injectable(tokens: (string | symbol)[] = []) {
  return function <T extends new (...args: any[]) => any>(constructor: T) {
    // Store dependency metadata (would use reflect-metadata in real implementation)
    (constructor as any).__dependencies = tokens;
    return constructor;
  };
}
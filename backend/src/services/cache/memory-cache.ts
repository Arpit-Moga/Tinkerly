/**
 * Memory Cache Service Implementation - Phase 2: Service Layer Refactoring
 * 
 * In-memory caching implementation with TTL support, size limits,
 * and LRU eviction policy for optimal performance.
 * 
 * @fileoverview Memory-based caching service implementation
 * @version 2.0.0
 * @since Phase 2
 */

import { ICacheService } from '../abstractions/index.js';

/**
 * Cache entry metadata
 * Contains value and expiration information
 */
interface CacheEntry<T> {
  /** Cached value */
  value: T;
  /** Expiration timestamp (0 for no expiration) */
  expiresAt: number;
  /** Last access timestamp for LRU */
  lastAccessed: number;
  /** Entry size in bytes (approximate) */
  size: number;
}

/**
 * Memory Cache Configuration
 */
export interface MemoryCacheConfig {
  /** Maximum number of entries (default: 1000) */
  maxEntries?: number;
  /** Default TTL in seconds (default: 3600 = 1 hour) */
  defaultTtl?: number;
  /** Maximum cache size in bytes (default: 50MB) */
  maxSize?: number;
  /** Cleanup interval in milliseconds (default: 5 minutes) */
  cleanupInterval?: number;
  /** Enable detailed logging */
  enableLogging?: boolean;
}

/**
 * Memory Cache Service
 * 
 * Provides high-performance in-memory caching with:
 * - TTL (Time To Live) support
 * - LRU (Least Recently Used) eviction
 * - Size-based eviction
 * - Automatic cleanup of expired entries
 * - Memory usage tracking
 * - Cache statistics
 * 
 * @example
 * ```typescript
 * const cache = new MemoryCacheService({
 *   maxEntries: 500,
 *   defaultTtl: 1800, // 30 minutes
 *   maxSize: 25 * 1024 * 1024 // 25MB
 * });
 * 
 * await cache.set('user:123', userData, 3600);
 * const user = await cache.get<UserData>('user:123');
 * ```
 */
export class MemoryCacheService implements ICacheService {
  private readonly cache = new Map<string, CacheEntry<any>>();
  private readonly config: Required<MemoryCacheConfig>;
  private cleanupTimer?: NodeJS.Timeout;
  private currentSize = 0;
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    cleanups: 0
  };

  /**
   * Initialize memory cache service
   * 
   * @param cacheConfig - Cache configuration options
   */
  constructor(cacheConfig?: MemoryCacheConfig) {
    this.config = {
      maxEntries: cacheConfig?.maxEntries || 1000,
      defaultTtl: cacheConfig?.defaultTtl || 3600,
      maxSize: cacheConfig?.maxSize || 50 * 1024 * 1024, // 50MB
      cleanupInterval: cacheConfig?.cleanupInterval || 5 * 60 * 1000, // 5 minutes
      enableLogging: cacheConfig?.enableLogging || false
    };

    // Start automatic cleanup
    this.startCleanupTimer();
    
    if (this.config.enableLogging) {
      console.log(`💾 Memory cache initialized: max ${this.config.maxEntries} entries, ${this.formatBytes(this.config.maxSize)} limit`);
    }
  }

  /**
   * Get cached value by key
   * 
   * @param key - Cache key
   * @returns Promise resolving to cached value or null if not found/expired
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if entry has expired
    if (entry.expiresAt > 0 && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.currentSize -= entry.size;
      this.stats.misses++;
      
      if (this.config.enableLogging) {
        console.log(`⏰ Cache entry expired: ${key}`);
      }
      
      return null;
    }

    // Update last accessed time for LRU
    entry.lastAccessed = Date.now();
    this.stats.hits++;
    
    if (this.config.enableLogging) {
      console.log(`✅ Cache hit: ${key}`);
    }
    
    return entry.value as T;
  }

  /**
   * Set cached value with optional TTL
   * 
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in seconds (optional, uses default if not provided)
   * @returns Promise resolving when value is cached
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const effectiveTtl = ttl ?? this.config.defaultTtl;
    const expiresAt = effectiveTtl > 0 ? Date.now() + (effectiveTtl * 1000) : 0;
    const size = this.calculateSize(value);
    const now = Date.now();

    // Check if we need to evict entries
    await this.ensureCapacity(size);

    // Remove existing entry if present
    const existingEntry = this.cache.get(key);
    if (existingEntry) {
      this.currentSize -= existingEntry.size;
    }

    // Create new entry
    const entry: CacheEntry<T> = {
      value,
      expiresAt,
      lastAccessed: now,
      size
    };

    this.cache.set(key, entry);
    this.currentSize += size;
    this.stats.sets++;

    if (this.config.enableLogging) {
      const ttlInfo = effectiveTtl > 0 ? ` (TTL: ${effectiveTtl}s)` : ' (no expiration)';
      console.log(`💾 Cache set: ${key}${ttlInfo}, size: ${this.formatBytes(size)}`);
    }
  }

  /**
   * Delete cached value
   * 
   * @param key - Cache key
   * @returns Promise resolving when value is deleted
   */
  async delete(key: string): Promise<void> {
    const entry = this.cache.get(key);
    
    if (entry) {
      this.cache.delete(key);
      this.currentSize -= entry.size;
      this.stats.deletes++;
      
      if (this.config.enableLogging) {
        console.log(`🗑️ Cache delete: ${key}`);
      }
    }
  }

  /**
   * Clear all cached values
   * 
   * @returns Promise resolving when cache is cleared
   */
  async clear(): Promise<void> {
    const entryCount = this.cache.size;
    const sizeFreed = this.currentSize;
    
    this.cache.clear();
    this.currentSize = 0;
    
    if (this.config.enableLogging) {
      console.log(`🧹 Cache cleared: ${entryCount} entries, ${this.formatBytes(sizeFreed)} freed`);
    }
  }

  /**
   * Check if key exists in cache
   * 
   * @param key - Cache key
   * @returns Promise resolving to existence status
   */
  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    // Check if entry has expired
    if (entry.expiresAt > 0 && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.currentSize -= entry.size;
      return false;
    }

    return true;
  }

  /**
   * Get cache statistics
   * 
   * @returns Cache performance and usage statistics
   */
  getStats(): {
    entries: number;
    size: string;
    hitRate: string;
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    evictions: number;
    cleanups: number;
  } {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? ((this.stats.hits / totalRequests) * 100).toFixed(2) : '0.00';

    return {
      entries: this.cache.size,
      size: this.formatBytes(this.currentSize),
      hitRate: `${hitRate}%`,
      hits: this.stats.hits,
      misses: this.stats.misses,
      sets: this.stats.sets,
      deletes: this.stats.deletes,
      evictions: this.stats.evictions,
      cleanups: this.stats.cleanups
    };
  }

  /**
   * Get all cache keys
   * 
   * @returns Array of cache keys
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Manually trigger cleanup of expired entries
   * 
   * @returns Number of entries cleaned up
   */
  async cleanup(): Promise<number> {
    const startTime = Date.now();
    const initialSize = this.cache.size;
    const now = Date.now();
    let cleanedCount = 0;
    let sizeFreed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt > 0 && now > entry.expiresAt) {
        this.cache.delete(key);
        sizeFreed += entry.size;
        cleanedCount++;
      }
    }

    this.currentSize -= sizeFreed;
    this.stats.cleanups++;

    const duration = Date.now() - startTime;
    
    if (this.config.enableLogging && cleanedCount > 0) {
      console.log(`🧹 Cache cleanup: ${cleanedCount}/${initialSize} entries removed, ${this.formatBytes(sizeFreed)} freed in ${duration}ms`);
    }

    return cleanedCount;
  }

  /**
   * Ensure cache has capacity for new entry
   * 
   * @param requiredSize - Size of new entry
   * @private
   */
  private async ensureCapacity(requiredSize: number): Promise<void> {
    // Check size limit
    while (this.currentSize + requiredSize > this.config.maxSize && this.cache.size > 0) {
      await this.evictLRU();
    }

    // Check entry count limit
    while (this.cache.size >= this.config.maxEntries && this.cache.size > 0) {
      await this.evictLRU();
    }
  }

  /**
   * Evict least recently used entry
   * 
   * @private
   */
  private async evictLRU(): Promise<void> {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this.cache.get(oldestKey)!;
      this.cache.delete(oldestKey);
      this.currentSize -= entry.size;
      this.stats.evictions++;

      if (this.config.enableLogging) {
        console.log(`🔄 LRU eviction: ${oldestKey}, size: ${this.formatBytes(entry.size)}`);
      }
    }
  }

  /**
   * Calculate approximate size of value in bytes
   * 
   * @param value - Value to measure
   * @returns Approximate size in bytes
   * @private
   */
  private calculateSize(value: any): number {
    if (value === null || value === undefined) {
      return 8; // Approximate overhead
    }

    if (typeof value === 'string') {
      return value.length * 2 + 8; // UTF-16 encoding + overhead
    }

    if (typeof value === 'number') {
      return 8;
    }

    if (typeof value === 'boolean') {
      return 4;
    }

    if (typeof value === 'object') {
      try {
        return JSON.stringify(value).length * 2 + 16; // Approximate
      } catch {
        return 64; // Fallback for non-serializable objects
      }
    }

    return 32; // Default fallback
  }

  /**
   * Format bytes into human-readable string
   * 
   * @param bytes - Number of bytes
   * @returns Formatted string
   * @private
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Start automatic cleanup timer
   * 
   * @private
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(async () => {
      await this.cleanup();
    }, this.config.cleanupInterval);

    // Ensure timer doesn't prevent process exit
    this.cleanupTimer.unref();
  }

  /**
   * Stop automatic cleanup timer
   * 
   * @private
   */
  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  /**
   * Dispose of cache resources
   * Called during application shutdown
   */
  async dispose(): Promise<void> {
    this.stopCleanupTimer();
    await this.clear();
    
    if (this.config.enableLogging) {
      console.log('🗑️ Memory cache disposed');
    }
  }
}
/**
 * Shared Type Definitions
 * 
 * This module contains all shared type definitions used across the backend.
 * It provides:
 * - API request/response types
 * - Domain model types
 * - Utility types for type safety
 * - Type guards for runtime validation
 * - Common interfaces and enums
 * 
 * These types should be kept in sync with frontend types for consistency.
 */

import { z } from 'zod';

/**
 * ============================================================================
 * FRAMEWORK AND LANGUAGE TYPES
 * ============================================================================
 */

/**
 * Supported frameworks for code generation
 */
export const SUPPORTED_FRAMEWORKS = ['react', 'vue', 'svelte', 'angular', 'nodejs'] as const;
export type Framework = typeof SUPPORTED_FRAMEWORKS[number];

/**
 * Programming languages supported by the system
 */
export const SUPPORTED_LANGUAGES = ['typescript', 'javascript', 'html', 'css', 'json'] as const;
export type Language = typeof SUPPORTED_LANGUAGES[number];

/**
 * ============================================================================
 * FILE AND PROJECT TYPES
 * ============================================================================
 */

/**
 * Represents a single file in a generated project
 */
export interface ProjectFile {
  /** File path relative to project root */
  path: string;
  /** File content as string */
  content: string;
  /** Programming language/file type */
  language: Language;
  /** Whether this file is the main entry point */
  isEntryPoint?: boolean;
  /** File size in bytes */
  size?: number;
  /** Last modified timestamp */
  lastModified?: Date;
}

/**
 * Collection of files representing a complete project
 */
export interface ProjectFiles {
  [path: string]: string;
}

/**
 * Project metadata and structure information
 */
export interface ProjectMetadata {
  /** Project name */
  name: string;
  /** Target framework */
  framework: Framework;
  /** Project description */
  description?: string;
  /** Dependencies required */
  dependencies?: Record<string, string>;
  /** Development dependencies */
  devDependencies?: Record<string, string>;
  /** Build scripts and commands */
  scripts?: Record<string, string>;
  /** Entry point file */
  entryPoint?: string;
  /** Project version */
  version?: string;
}

/**
 * ============================================================================
 * CHAT AND CONVERSATION TYPES
 * ============================================================================
 */

/**
 * Chat message roles
 */
export const CHAT_ROLES = ['user', 'assistant', 'system'] as const;
export type ChatRole = typeof CHAT_ROLES[number];

/**
 * Individual chat message
 */
export interface ChatMessage {
  /** Unique message identifier */
  id: string;
  /** Message role (user, assistant, system) */
  role: ChatRole;
  /** Message content */
  content: string;
  /** Message timestamp */
  timestamp: Date;
  /** Optional metadata */
  metadata?: {
    /** Token count for this message */
    tokenCount?: number;
    /** Processing time in milliseconds */
    processingTime?: number;
    /** Model used for generation */
    model?: string;
  };
}

/**
 * Conversation history for context
 */
export interface ConversationHistory {
  /** Array of chat messages */
  messages: ChatMessage[];
  /** Total token count for conversation */
  totalTokens?: number;
  /** Conversation start time */
  startTime: Date;
  /** Last activity time */
  lastActivity: Date;
}

/**
 * ============================================================================
 * API REQUEST/RESPONSE TYPES
 * ============================================================================
 */

/**
 * Base API response structure
 */
export interface ApiResponse<T = any> {
  /** Whether the request was successful */
  success: boolean;
  /** Response data (if successful) */
  data?: T;
  /** Error information (if failed) */
  error?: {
    /** Error message */
    message: string;
    /** Error code */
    code?: string;
    /** Additional error details */
    details?: any;
    /** Stack trace (development only) */
    stack?: string;
  };
  /** Response timestamp */
  timestamp: string;
  /** Request processing time in milliseconds */
  processingTime?: number;
}

/**
 * Code generation request payload
 */
export interface GenerateCodeRequest {
  /** User prompt for code generation */
  prompt: string;
  /** Target framework */
  framework: Framework;
  /** Previous conversation context */
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  /** Current project files for context */
  currentFiles?: ProjectFiles;
  /** Generation options */
  options?: {
    /** Include TypeScript types */
    includeTypes?: boolean;
    /** Include tests */
    includeTests?: boolean;
    /** Include documentation */
    includeDocs?: boolean;
    /** Code style preferences */
    codeStyle?: 'standard' | 'prettier' | 'airbnb';
  };
}

/**
 * Code generation response data
 */
export interface GenerateCodeResponse {
  /** Generated project files */
  files: ProjectFiles;
  /** AI assistant message */
  message: string;
  /** Suggested next steps */
  suggestions?: string[];
  /** Project metadata */
  metadata?: ProjectMetadata;
  /** Generation statistics */
  stats?: {
    /** Number of files generated */
    fileCount: number;
    /** Total lines of code */
    totalLines: number;
    /** Generation time in milliseconds */
    generationTime: number;
    /** Tokens used */
    tokensUsed: number;
  };
}

/**
 * Code validation request payload
 */
export interface ValidateCodeRequest {
  /** Files to validate */
  files: ProjectFiles;
  /** Target framework for validation rules */
  framework: Framework;
  /** Validation options */
  options?: {
    /** Check syntax only */
    syntaxOnly?: boolean;
    /** Include performance suggestions */
    includePerformance?: boolean;
    /** Include security checks */
    includeSecurity?: boolean;
  };
}

/**
 * Code validation response data
 */
export interface ValidateCodeResponse {
  /** Whether code is valid */
  isValid: boolean;
  /** Validation errors */
  errors: ValidationIssue[];
  /** Validation warnings */
  warnings: ValidationIssue[];
  /** Improvement suggestions */
  suggestions: ValidationIssue[];
  /** Overall quality score (0-100) */
  qualityScore?: number;
}

/**
 * Individual validation issue
 */
export interface ValidationIssue {
  /** Issue severity level */
  severity: 'error' | 'warning' | 'info';
  /** Issue message */
  message: string;
  /** File path where issue occurs */
  file?: string;
  /** Line number */
  line?: number;
  /** Column number */
  column?: number;
  /** Issue category */
  category: 'syntax' | 'logic' | 'performance' | 'security' | 'style' | 'accessibility';
  /** Suggested fix */
  fix?: string;
  /** Rule that triggered this issue */
  rule?: string;
}

/**
 * ============================================================================
 * STREAMING TYPES
 * ============================================================================
 */

/**
 * Streaming response chunk types
 */
export const STREAM_CHUNK_TYPES = ['message_chunk', 'files', 'done', 'error'] as const;
export type StreamChunkType = typeof STREAM_CHUNK_TYPES[number];

/**
 * Streaming response chunk
 */
export interface StreamChunk {
  /** Chunk type */
  type: StreamChunkType;
  /** Chunk content */
  content?: string;
  /** Generated files (for 'files' type) */
  files?: ProjectFiles;
  /** Suggestions (for 'done' type) */
  suggestions?: string[];
  /** Error message (for 'error' type) */
  message?: string;
  /** Chunk timestamp */
  timestamp?: string;
}

/**
 * ============================================================================
 * ERROR TYPES
 * ============================================================================
 */

/**
 * Application error categories
 */
export const ERROR_CATEGORIES = [
  'validation',
  'authentication',
  'authorization',
  'not_found',
  'rate_limit',
  'external_api',
  'internal_server',
  'configuration'
] as const;
export type ErrorCategory = typeof ERROR_CATEGORIES[number];

/**
 * Custom application error
 */
export interface AppError extends Error {
  /** HTTP status code */
  statusCode: number;
  /** Error category */
  category: ErrorCategory;
  /** Whether error is operational (expected) */
  isOperational: boolean;
  /** Additional error context */
  context?: Record<string, any>;
  /** Error code for client handling */
  code?: string;
}

/**
 * ============================================================================
 * HEALTH CHECK TYPES
 * ============================================================================
 */

/**
 * Service health status
 */
export type HealthStatus = 'healthy' | 'unhealthy' | 'degraded';

/**
 * Individual service health check
 */
export interface ServiceHealth {
  /** Service name */
  name: string;
  /** Current status */
  status: HealthStatus;
  /** Response time in milliseconds */
  responseTime?: number;
  /** Additional details */
  details?: Record<string, any>;
  /** Last check timestamp */
  lastCheck: Date;
}

/**
 * Overall system health
 */
export interface SystemHealth {
  /** Overall system status */
  status: HealthStatus;
  /** Individual service health checks */
  services: ServiceHealth[];
  /** System uptime in seconds */
  uptime: number;
  /** System version */
  version: string;
  /** Environment */
  environment: string;
  /** Check timestamp */
  timestamp: Date;
}

/**
 * ============================================================================
 * UTILITY TYPES
 * ============================================================================
 */

/**
 * Make all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Make specific properties required
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Extract array element type
 */
export type ArrayElement<T> = T extends (infer U)[] ? U : never;

/**
 * ============================================================================
 * TYPE GUARDS
 * ============================================================================
 */

/**
 * Type guard for Framework
 */
export const isFramework = (value: any): value is Framework => {
  return typeof value === 'string' && SUPPORTED_FRAMEWORKS.includes(value as Framework);
};

/**
 * Type guard for ChatRole
 */
export const isChatRole = (value: any): value is ChatRole => {
  return typeof value === 'string' && CHAT_ROLES.includes(value as ChatRole);
};

/**
 * Type guard for StreamChunkType
 */
export const isStreamChunkType = (value: any): value is StreamChunkType => {
  return typeof value === 'string' && STREAM_CHUNK_TYPES.includes(value as StreamChunkType);
};

/**
 * Type guard for ErrorCategory
 */
export const isErrorCategory = (value: any): value is ErrorCategory => {
  return typeof value === 'string' && ERROR_CATEGORIES.includes(value as ErrorCategory);
};

/**
 * Type guard for ProjectFiles
 */
export const isProjectFiles = (value: any): value is ProjectFiles => {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.values(value).every(v => typeof v === 'string')
  );
};

/**
 * ============================================================================
 * VALIDATION SCHEMAS
 * ============================================================================
 */

/**
 * Zod schema for Framework validation
 */
export const FrameworkSchema = z.enum(SUPPORTED_FRAMEWORKS);

/**
 * Zod schema for ChatMessage validation
 */
export const ChatMessageSchema = z.object({
  role: z.enum(CHAT_ROLES),
  content: z.string().min(1),
});

/**
 * Zod schema for GenerateCodeRequest validation
 */
export const GenerateCodeRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  framework: FrameworkSchema,
  conversationHistory: z.array(ChatMessageSchema).optional().default([]),
  currentFiles: z.record(z.string()).optional().default({}),
  options: z.object({
    includeTypes: z.boolean().optional(),
    includeTests: z.boolean().optional(),
    includeDocs: z.boolean().optional(),
    codeStyle: z.enum(['standard', 'prettier', 'airbnb']).optional(),
  }).optional(),
});

/**
 * Zod schema for ValidateCodeRequest validation
 */
export const ValidateCodeRequestSchema = z.object({
  files: z.record(z.string()),
  framework: FrameworkSchema,
  options: z.object({
    syntaxOnly: z.boolean().optional(),
    includePerformance: z.boolean().optional(),
    includeSecurity: z.boolean().optional(),
  }).optional(),
});
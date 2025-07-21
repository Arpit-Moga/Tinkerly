/**
 * Shared Type Definitions
 * 
 * This module contains type definitions shared between frontend and backend.
 * It ensures type consistency across the entire application and provides
 * a single source of truth for data structures.
 * 
 * These types are used for:
 * - API request/response contracts
 * - State management
 * - Component props
 * - Service interfaces
 * 
 * Note: Keep this file in sync with backend/src/types/index.ts
 */

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
 * Collection of files representing a complete project
 * Key: file path, Value: file content
 */
export interface FileContent {
  [path: string]: string;
}

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
  currentFiles?: FileContent;
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
  files: FileContent;
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
  files: FileContent;
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
  files?: FileContent;
  /** Suggestions (for 'done' type) */
  suggestions?: string[];
  /** Error message (for 'error' type) */
  message?: string;
  /** Chunk timestamp */
  timestamp?: string;
}

/**
 * ============================================================================
 * UI STATE TYPES
 * ============================================================================
 */

/**
 * Application view modes
 */
export type ViewMode = 'preview' | 'editor';

/**
 * WebContainer status
 */
export type WebContainerStatus = 'idle' | 'initializing' | 'ready' | 'running' | 'error';

/**
 * Generation status
 */
export type GenerationStatus = 'idle' | 'generating' | 'streaming' | 'complete' | 'error';

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
 * Type guard for FileContent
 */
export const isFileContent = (value: any): value is FileContent => {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.values(value).every(v => typeof v === 'string')
  );
};

/**
 * Type guard for ApiResponse
 */
export const isApiResponse = <T>(value: any): value is ApiResponse<T> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.success === 'boolean' &&
    typeof value.timestamp === 'string'
  );
};
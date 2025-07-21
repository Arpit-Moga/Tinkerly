/**
 * Application State Management Store
 * 
 * This module provides centralized state management using Zustand.
 * It manages all application state including:
 * - Framework selection and project configuration
 * - Generated files and code editing
 * - Chat messages and conversation history
 * - UI state and user preferences
 * - WebContainer status and preview management
 * - Console logs and debugging information
 * 
 * The store is designed to be:
 * - Type-safe with comprehensive TypeScript definitions
 * - Performant with selective subscriptions
 * - Persistent where appropriate
 * - Easy to debug and maintain
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  Framework, 
  FileContent, 
  ChatMessage, 
  ViewMode, 
  WebContainerStatus, 
  GenerationStatus 
} from '../../../shared/types';

/**
 * Extended chat message with UI-specific properties
 */
export interface ExtendedChatMessage extends ChatMessage {
  /** Whether the message is currently being streamed */
  isStreaming?: boolean;
  /** Error state for failed messages */
  error?: string;
  /** Retry function for failed messages */
  retry?: () => void;
}

/**
 * Application state interface
 * Defines the complete state structure and available actions
 */
interface AppState {
  // ============================================================================
  // FRAMEWORK AND PROJECT STATE
  // ============================================================================
  
  /** Currently selected framework for code generation */
  selectedFramework: Framework | null;
  /** Set the selected framework and reset related state */
  setSelectedFramework: (framework: Framework) => void;
  
  /** Generated project files */
  generatedFiles: FileContent;
  /** Set all generated files at once */
  setGeneratedFiles: (files: FileContent) => void;
  /** Update a single file's content */
  updateFile: (path: string, content: string) => void;
  /** Delete a file from the project */
  deleteFile: (path: string) => void;
  /** Rename a file in the project */
  renameFile: (oldPath: string, newPath: string) => void;
  
  // ============================================================================
  // CHAT AND CONVERSATION STATE
  // ============================================================================
  
  /** Chat message history */
  chatMessages: ExtendedChatMessage[];
  /** Add a new chat message */
  addChatMessage: (message: Omit<ExtendedChatMessage, 'id' | 'timestamp'>) => void;
  /** Update an existing chat message */
  updateChatMessage: (id: string, updates: Partial<ExtendedChatMessage>) => void;
  /** Clear all chat messages */
  clearChat: () => void;
  /** Remove a specific chat message */
  removeChatMessage: (id: string) => void;
  
  // ============================================================================
  // GENERATION STATE
  // ============================================================================
  
  /** Current generation status */
  generationStatus: GenerationStatus;
  /** Set generation status */
  setGenerationStatus: (status: GenerationStatus) => void;
  /** Legacy support - maps to generationStatus */
  isGenerating: boolean;
  /** Legacy support - maps to setGenerationStatus */
  setIsGenerating: (generating: boolean) => void;
  
  /** Current streaming message content */
  streamingContent: string;
  /** Set streaming content */
  setStreamingContent: (content: string) => void;
  /** Clear streaming content */
  clearStreamingContent: () => void;
  
  // ============================================================================
  // FILE EDITOR STATE
  // ============================================================================
  
  /** Currently selected file for editing */
  selectedFile: string | null;
  /** Set the selected file */
  setSelectedFile: (file: string | null) => void;
  
  /** File editor preferences */
  editorPreferences: {
    /** Font size for code editor */
    fontSize: number;
    /** Theme for code editor */
    theme: 'dark' | 'light';
    /** Whether to show line numbers */
    showLineNumbers: boolean;
    /** Whether to enable word wrap */
    wordWrap: boolean;
  };
  /** Update editor preferences */
  updateEditorPreferences: (preferences: Partial<AppState['editorPreferences']>) => void;
  
  // ============================================================================
  // PREVIEW AND WEBCONTAINER STATE
  // ============================================================================
  
  /** WebContainer status */
  webContainerStatus: WebContainerStatus;
  /** Set WebContainer status */
  setWebContainerStatus: (status: WebContainerStatus) => void;
  /** Legacy support - maps to webContainerStatus === 'ready' */
  isWebContainerReady: boolean;
  /** Legacy support - maps to setWebContainerStatus */
  setIsWebContainerReady: (ready: boolean) => void;
  
  /** Current preview URL */
  previewUrl: string | null;
  /** Set preview URL */
  setPreviewUrl: (url: string | null) => void;
  
  /** Whether to auto-start preview when files are generated */
  shouldAutoStartPreview: boolean;
  /** Set auto-start preview preference */
  setShouldAutoStartPreview: (should: boolean) => void;
  
  // ============================================================================
  // UI STATE
  // ============================================================================
  
  /** Current view mode */
  viewMode: ViewMode;
  /** Set view mode */
  setViewMode: (mode: ViewMode) => void;
  
  /** Whether console panel is visible */
  showConsole: boolean;
  /** Toggle console panel visibility */
  setShowConsole: (show: boolean) => void;
  
  /** Whether sidebar is collapsed */
  sidebarCollapsed: boolean;
  /** Toggle sidebar collapse state */
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // ============================================================================
  // CONSOLE AND LOGGING STATE
  // ============================================================================
  
  /** Console log messages */
  logs: Array<{
    id: string;
    message: string;
    level: 'info' | 'warn' | 'error' | 'debug';
    timestamp: Date;
    source?: string;
  }>;
  /** Add a log message */
  addLog: (log: string | { message: string; level?: 'info' | 'warn' | 'error' | 'debug'; source?: string }) => void;
  /** Clear all logs */
  clearLogs: () => void;
  /** Remove logs older than specified time */
  clearOldLogs: (olderThanMs: number) => void;
  
  // ============================================================================
  // ERROR STATE
  // ============================================================================
  
  /** Current application error */
  error: string | null;
  /** Set application error */
  setError: (error: string | null) => void;
  /** Clear application error */
  clearError: () => void;
  
  // ============================================================================
  // UTILITY ACTIONS
  // ============================================================================
  
  /** Reset all state to initial values */
  resetState: () => void;
  /** Export current state for backup */
  exportState: () => string;
  /** Import state from backup */
  importState: (state: string) => boolean;
}

/**
 * Initial state values
 */
const initialState = {
  // Framework and project state
  selectedFramework: null,
  generatedFiles: {},
  
  // Chat state
  chatMessages: [],
  
  // Generation state
  generationStatus: 'idle' as GenerationStatus,
  streamingContent: '',
  
  // File editor state
  selectedFile: null,
  editorPreferences: {
    fontSize: 14,
    theme: 'dark' as const,
    showLineNumbers: true,
    wordWrap: false,
  },
  
  // Preview and WebContainer state
  webContainerStatus: 'idle' as WebContainerStatus,
  previewUrl: null,
  shouldAutoStartPreview: false,
  
  // UI state
  viewMode: 'preview' as ViewMode,
  showConsole: false,
  sidebarCollapsed: false,
  
  // Console and logging state
  logs: [],
  
  // Error state
  error: null,
};

/**
 * Create the Zustand store with persistence for user preferences
 */
export const useAppStore = create<AppState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        ...initialState,
        
        // ============================================================================
        // FRAMEWORK AND PROJECT ACTIONS
        // ============================================================================
        
        setSelectedFramework: (framework) => set({ 
          selectedFramework: framework,
          // Reset related state when framework changes
          generatedFiles: {},
          selectedFile: null,
          previewUrl: null,
          webContainerStatus: 'idle',
        }),
        
        setGeneratedFiles: (files) => set({ 
          generatedFiles: files,
          shouldAutoStartPreview: Object.keys(files).length > 0,
          // Auto-select first file if none selected
          selectedFile: get().selectedFile || Object.keys(files)[0] || null,
        }),
        
        updateFile: (path, content) => set((state) => ({
          generatedFiles: { ...state.generatedFiles, [path]: content }
        })),
        
        deleteFile: (path) => set((state) => {
          const newFiles = { ...state.generatedFiles };
          delete newFiles[path];
          return {
            generatedFiles: newFiles,
            selectedFile: state.selectedFile === path ? null : state.selectedFile,
          };
        }),
        
        renameFile: (oldPath, newPath) => set((state) => {
          const newFiles = { ...state.generatedFiles };
          if (newFiles[oldPath]) {
            newFiles[newPath] = newFiles[oldPath];
            delete newFiles[oldPath];
          }
          return {
            generatedFiles: newFiles,
            selectedFile: state.selectedFile === oldPath ? newPath : state.selectedFile,
          };
        }),
        
        // ============================================================================
        // CHAT ACTIONS
        // ============================================================================
        
        addChatMessage: (message) => set((state) => ({
          chatMessages: [...state.chatMessages, {
            ...message,
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date()
          }]
        })),
        
        updateChatMessage: (id, updates) => set((state) => ({
          chatMessages: state.chatMessages.map(msg => 
            msg.id === id ? { ...msg, ...updates } : msg
          )
        })),
        
        clearChat: () => set({ chatMessages: [] }),
        
        removeChatMessage: (id) => set((state) => ({
          chatMessages: state.chatMessages.filter(msg => msg.id !== id)
        })),
        
        // ============================================================================
        // GENERATION ACTIONS
        // ============================================================================
        
        setGenerationStatus: (status) => set({ generationStatus: status }),
        
        // Legacy support
        get isGenerating() { return get().generationStatus === 'generating' || get().generationStatus === 'streaming'; },
        setIsGenerating: (generating) => set({ 
          generationStatus: generating ? 'generating' : 'idle' 
        }),
        
        setStreamingContent: (content) => set({ streamingContent: content }),
        clearStreamingContent: () => set({ streamingContent: '' }),
        
        // ============================================================================
        // FILE EDITOR ACTIONS
        // ============================================================================
        
        setSelectedFile: (file) => set({ selectedFile: file }),
        
        updateEditorPreferences: (preferences) => set((state) => ({
          editorPreferences: { ...state.editorPreferences, ...preferences }
        })),
        
        // ============================================================================
        // PREVIEW AND WEBCONTAINER ACTIONS
        // ============================================================================
        
        setWebContainerStatus: (status) => set({ webContainerStatus: status }),
        
        // Legacy support
        get isWebContainerReady() { return get().webContainerStatus === 'ready'; },
        setIsWebContainerReady: (ready) => set({ 
          webContainerStatus: ready ? 'ready' : 'idle' 
        }),
        
        setPreviewUrl: (url) => set({ previewUrl: url }),
        setShouldAutoStartPreview: (should) => set({ shouldAutoStartPreview: should }),
        
        // ============================================================================
        // UI ACTIONS
        // ============================================================================
        
        setViewMode: (mode) => set({ viewMode: mode }),
        setShowConsole: (show) => set({ showConsole: show }),
        setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
        
        // ============================================================================
        // CONSOLE AND LOGGING ACTIONS
        // ============================================================================
        
        addLog: (log) => set((state) => {
          const logEntry = typeof log === 'string' 
            ? {
                id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                message: log,
                level: 'info' as const,
                timestamp: new Date(),
              }
            : {
                id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                level: 'info' as const,
                timestamp: new Date(),
                ...log,
              };
          
          const newLogs = [...state.logs, logEntry];
          
          // Keep only the last 1000 logs to prevent memory issues
          if (newLogs.length > 1000) {
            newLogs.splice(0, newLogs.length - 1000);
          }
          
          return { logs: newLogs };
        }),
        
        clearLogs: () => set({ logs: [] }),
        
        clearOldLogs: (olderThanMs) => set((state) => {
          const cutoffTime = new Date(Date.now() - olderThanMs);
          return {
            logs: state.logs.filter(log => log.timestamp > cutoffTime)
          };
        }),
        
        // ============================================================================
        // ERROR ACTIONS
        // ============================================================================
        
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),
        
        // ============================================================================
        // UTILITY ACTIONS
        // ============================================================================
        
        resetState: () => set(initialState),
        
        exportState: () => {
          const state = get();
          return JSON.stringify({
            selectedFramework: state.selectedFramework,
            generatedFiles: state.generatedFiles,
            chatMessages: state.chatMessages,
            editorPreferences: state.editorPreferences,
            shouldAutoStartPreview: state.shouldAutoStartPreview,
            viewMode: state.viewMode,
            showConsole: state.showConsole,
            sidebarCollapsed: state.sidebarCollapsed,
          }, null, 2);
        },
        
        importState: (stateString) => {
          try {
            const importedState = JSON.parse(stateString);
            set((currentState) => ({
              ...currentState,
              ...importedState,
              // Reset runtime state
              generationStatus: 'idle',
              webContainerStatus: 'idle',
              streamingContent: '',
              previewUrl: null,
              error: null,
              logs: [],
            }));
            return true;
          } catch (error) {
            console.error('Failed to import state:', error);
            return false;
          }
        },
      }),
      {
        name: 'llm-code-generator-store',
        storage: createJSONStorage(() => localStorage),
        // Only persist user preferences, not runtime state
        partialize: (state) => ({
          selectedFramework: state.selectedFramework,
          editorPreferences: state.editorPreferences,
          shouldAutoStartPreview: state.shouldAutoStartPreview,
          viewMode: state.viewMode,
          showConsole: state.showConsole,
          sidebarCollapsed: state.sidebarCollapsed,
        }),
      }
    )
  )
);
import { create } from 'zustand';

export type Framework = 'react' | 'vue' | 'svelte' | 'angular' | 'nodejs';

export interface FileContent {
  [path: string]: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AppState {
  // Framework selection
  selectedFramework: Framework | null;
  setSelectedFramework: (framework: Framework) => void;

  // Generated files
  generatedFiles: FileContent;
  setGeneratedFiles: (files: FileContent) => void;
  updateFile: (path: string, content: string) => void;

  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChat: () => void;

  // UI state
  isGenerating: boolean;
  setIsGenerating: (generating: boolean) => void;
  
  selectedFile: string | null;
  setSelectedFile: (file: string | null) => void;

  previewUrl: string | null;
  setPreviewUrl: (url: string | null) => void;

  // WebContainer state
  isWebContainerReady: boolean;
  setIsWebContainerReady: (ready: boolean) => void;

  // Console logs
  logs: string[];
  addLog: (log: string) => void;
  clearLogs: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Framework selection
  selectedFramework: null,
  setSelectedFramework: (framework) => set({ selectedFramework: framework }),

  // Generated files
  generatedFiles: {},
  setGeneratedFiles: (files) => set({ generatedFiles: files }),
  updateFile: (path, content) => set((state) => ({
    generatedFiles: { ...state.generatedFiles, [path]: content }
  })),

  // Chat
  chatMessages: [],
  addChatMessage: (message) => set((state) => ({
    chatMessages: [...state.chatMessages, {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    }]
  })),
  clearChat: () => set({ chatMessages: [] }),

  // UI state
  isGenerating: false,
  setIsGenerating: (generating) => set({ isGenerating: generating }),
  
  selectedFile: null,
  setSelectedFile: (file) => set({ selectedFile: file }),

  previewUrl: null,
  setPreviewUrl: (url) => set({ previewUrl: url }),

  // WebContainer state
  isWebContainerReady: false,
  setIsWebContainerReady: (ready) => set({ isWebContainerReady: ready }),

  // Console logs
  logs: [],
  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
  clearLogs: () => set({ logs: [] }),
}));
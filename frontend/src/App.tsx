import React from 'react';
import { FrameworkSelector } from './components/FrameworkSelector/FrameworkSelector';
import { SimpleCodeEditor } from './components/CodeEditor/SimpleCodeEditor';
import { LivePreview } from './components/LivePreview/LivePreview';
import { ChatInterface } from './components/ChatInterface/ChatInterface';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
import { useAppStore } from './store/useAppStore';

function App() {
  const { selectedFramework, generatedFiles } = useAppStore();

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">LLM Code Generator</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              {selectedFramework ? `Framework: ${selectedFramework}` : 'Select a framework'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Framework Selection & Chat */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          <ErrorBoundary>
            {!selectedFramework ? (
              <div className="p-6">
                <FrameworkSelector />
              </div>
            ) : (
              <ChatInterface />
            )}
          </ErrorBoundary>
        </div>

        {/* Middle Panel - Code Editor */}
        <div className="w-1/3 border-r border-gray-200">
          <ErrorBoundary>
            <SimpleCodeEditor />
          </ErrorBoundary>
        </div>

        {/* Right Panel - Live Preview */}
        <div className="w-1/3">
          <ErrorBoundary>
            <LivePreview />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}

export default App;
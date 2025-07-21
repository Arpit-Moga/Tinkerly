import React, { useState } from 'react';
import { FrameworkSelector } from './components/FrameworkSelector/FrameworkSelector';
import { SimpleCodeEditor } from './components/CodeEditor/SimpleCodeEditor';
import { LivePreview } from './components/LivePreview/LivePreview';
import { ChatInterface } from './components/ChatInterface/ChatInterface';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
import { Console } from './components/Console/Console';
import { Header } from './components/Header/Header';
import { useAppStore } from './store/useAppStore';

type ViewMode = 'preview' | 'editor';

function App() {
  const { selectedFramework } = useAppStore();
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [showConsole, setShowConsole] = useState(false);

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <Header 
        viewMode={viewMode}
        setViewMode={setViewMode}
        showConsole={showConsole}
        setShowConsole={setShowConsole}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Chat Interface */}
        <div className="w-96 border-r border-gray-700 flex flex-col bg-gray-800">
          <ErrorBoundary>
            <ChatInterface />
          </ErrorBoundary>
        </div>

        {/* Right Panel - Preview/Editor */}
        <div className="flex-1 flex flex-col">
          <div className={`flex-1 ${showConsole ? 'h-2/3' : 'h-full'}`}>
            <ErrorBoundary>
              {viewMode === 'preview' ? (
                <LivePreview />
              ) : (
                <SimpleCodeEditor />
              )}
            </ErrorBoundary>
          </div>

          {/* Console Panel */}
          {showConsole && (
            <div className="h-1/3 border-t border-gray-700">
              <ErrorBoundary>
                <Console />
              </ErrorBoundary>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
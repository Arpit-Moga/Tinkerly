import React, { useEffect, useRef, useState } from 'react';
import { Play, Square, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { WebContainerManager } from '../../services/webcontainer-manager';

export const LivePreview: React.FC = () => {
  const {
    generatedFiles,
    selectedFramework,
    previewUrl,
    setPreviewUrl,
    isWebContainerReady,
    setIsWebContainerReady,
  } = useAppStore();

  const [isStarting, setIsStarting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const webContainerManagerRef = useRef<WebContainerManager | null>(null);

  useEffect(() => {
    // Initialize WebContainer only when we have files to work with
    if (Object.keys(generatedFiles).length > 0 && !isWebContainerReady) {
      const initWebContainer = async () => {
        try {
          if (!webContainerManagerRef.current) {
            webContainerManagerRef.current = new WebContainerManager();
          }
          await webContainerManagerRef.current.initialize();
          setIsWebContainerReady(true);
          addLog('WebContainer initialized successfully');
        } catch (err) {
          console.error('Failed to initialize WebContainer:', err);
          setError('Failed to initialize WebContainer. Please refresh the page.');
          addLog('Failed to initialize WebContainer');
        }
      };

      initWebContainer();
    }

    return () => {
      // Cleanup on unmount
      if (webContainerManagerRef.current) {
        webContainerManagerRef.current.cleanup();
      }
    };
  }, [generatedFiles, isWebContainerReady, setIsWebContainerReady]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-19), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const startPreview = async () => {
    if (!selectedFramework || Object.keys(generatedFiles).length === 0) {
      return;
    }

    setIsStarting(true);
    setError(null);
    addLog('Initializing preview...');

    try {
      // Initialize WebContainer if not ready
      if (!webContainerManagerRef.current) {
        webContainerManagerRef.current = new WebContainerManager();
      }
      
      if (!isWebContainerReady) {
        addLog('Initializing WebContainer...');
        await webContainerManagerRef.current.initialize();
        setIsWebContainerReady(true);
        addLog('WebContainer ready');
      }

      // Create project with generated files
      addLog('Mounting project files...');
      await webContainerManagerRef.current.createProject(generatedFiles);
      addLog('Project files mounted successfully');

      // Install dependencies
      addLog('Installing dependencies (this may take a moment)...');
      await webContainerManagerRef.current.installDependencies((data) => {
        if (data.trim()) {
          addLog(`npm: ${data.trim()}`);
        }
      });
      addLog('Dependencies installed successfully');

      // Start dev server
      addLog('Starting development server...');
      const url = await webContainerManagerRef.current.startDevServer((data) => {
        if (data.trim()) {
          addLog(`dev: ${data.trim()}`);
        }
      });

      setPreviewUrl(url);
      setIsRunning(true);
      addLog(`🎉 Preview ready at: ${url}`);
    } catch (err) {
      console.error('Failed to start preview:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to start preview';
      setError(errorMessage);
      addLog(`❌ Error: ${errorMessage}`);
    } finally {
      setIsStarting(false);
    }
  };

  const stopPreview = async () => {
    if (webContainerManagerRef.current) {
      await webContainerManagerRef.current.stopDevServer();
      setIsRunning(false);
      setPreviewUrl(null);
      addLog('Preview stopped');
    }
  };

  const refreshPreview = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
      addLog('Preview refreshed');
    }
  };

  const openInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  const canStartPreview = selectedFramework && 
                         Object.keys(generatedFiles).length > 0 && 
                         !isStarting && 
                         !isRunning;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Live Preview</h3>
            <p className="text-sm text-gray-600 mt-1">
              {isRunning ? 'Running' : 'Ready to preview your application'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {!isRunning ? (
              <button
                onClick={startPreview}
                disabled={!canStartPreview}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
              >
                {isStarting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                <span>{isStarting ? 'Starting...' : 'Start'}</span>
              </button>
            ) : (
              <>
                <button
                  onClick={refreshPreview}
                  className="btn-secondary flex items-center space-x-1"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={openInNewTab}
                  className="btn-secondary flex items-center space-x-1"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button
                  onClick={stopPreview}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-1"
                >
                  <Square className="w-4 h-4" />
                  <span>Stop</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {!isWebContainerReady ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-600" />
              <p className="text-gray-600">Initializing WebContainer...</p>
            </div>
          </div>
        ) : !selectedFramework ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a framework to start</p>
            </div>
          </div>
        ) : Object.keys(generatedFiles).length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Generate code to see live preview</p>
            </div>
          </div>
        ) : previewUrl ? (
          <div className="flex-1">
            <iframe
              ref={iframeRef}
              src={previewUrl}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              title="Live Preview"
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Click "Start" to begin live preview</p>
            </div>
          </div>
        )}

        {/* Logs Panel */}
        {logs.length > 0 && (
          <div className="h-32 border-t border-gray-200 bg-gray-900 text-green-400 font-mono text-xs overflow-y-auto">
            <div className="p-2">
              <div className="text-gray-400 mb-1">Console Output:</div>
              {logs.map((log, index) => (
                <div key={index} className="whitespace-pre-wrap">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
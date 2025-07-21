import React, { useEffect, useRef } from 'react';
import { Terminal, X, Trash2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const Console: React.FC = () => {
  const { logs, clearLogs } = useAppStore();
  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getLogColor = (log: string) => {
    if (log.includes('❌') || log.toLowerCase().includes('error')) {
      return 'text-red-400';
    }
    if (log.includes('⚠️') || log.toLowerCase().includes('warn')) {
      return 'text-yellow-400';
    }
    if (log.includes('✅') || log.includes('🎉')) {
      return 'text-green-400';
    }
    if (log.includes('npm:') || log.includes('dev:')) {
      return 'text-blue-400';
    }
    return 'text-gray-300';
  };

  return (
    <div className="h-full bg-gray-900 flex flex-col">
      {/* Console Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-300">Console</span>
          {logs.length > 0 && (
            <span className="text-xs text-gray-500">({logs.length} logs)</span>
          )}
        </div>
        <button
          onClick={clearLogs}
          className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          <span>Clear</span>
        </button>
      </div>

      {/* Console Content */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Console output will appear here</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((log, index) => (
              <div
                key={index}
                className={`${getLogColor(log)} leading-relaxed`}
              >
                {log}
              </div>
            ))}
            <div ref={consoleEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};
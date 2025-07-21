import React from 'react';
import { Code, Eye, Terminal, ChevronDown } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

type ViewMode = 'preview' | 'editor';

interface HeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  showConsole: boolean;
  setShowConsole: (show: boolean) => void;
}

const frameworks = [
  { id: 'react', name: 'React', icon: '⚛️' },
  { id: 'vue', name: 'Vue', icon: '🟢' },
  { id: 'svelte', name: 'Svelte', icon: '🔥' },
  { id: 'angular', name: 'Angular', icon: '🅰️' },
  { id: 'nodejs', name: 'Node.js', icon: '🟩' },
];

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  setViewMode,
  showConsole,
  setShowConsole,
}) => {
  const { selectedFramework, setSelectedFramework, clearChat } = useAppStore();
  const [showFrameworkDropdown, setShowFrameworkDropdown] = React.useState(false);

  const handleFrameworkChange = (framework: any) => {
    setSelectedFramework(framework);
    clearChat();
    setShowFrameworkDropdown(false);
  };

  const selectedFrameworkData = frameworks.find(f => f.id === selectedFramework);

  return (
    <header className="bg-gray-800 border-b border-gray-700 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left side - Logo and Framework Selector */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Code className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">CodeGen</h1>
          </div>

          {/* Framework Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFrameworkDropdown(!showFrameworkDropdown)}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
            >
              {selectedFrameworkData ? (
                <>
                  <span className="text-sm">{selectedFrameworkData.icon}</span>
                  <span className="text-sm font-medium">{selectedFrameworkData.name}</span>
                </>
              ) : (
                <span className="text-sm text-gray-300">Select Framework</span>
              )}
              <ChevronDown className="w-4 h-4" />
            </button>

            {showFrameworkDropdown && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-50">
                {frameworks.map((framework) => (
                  <button
                    key={framework.id}
                    onClick={() => handleFrameworkChange(framework.id)}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-600 first:rounded-t-lg last:rounded-b-lg transition-colors"
                  >
                    <span className="text-lg">{framework.icon}</span>
                    <span className="text-white font-medium">{framework.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side - View Controls */}
        <div className="flex items-center space-x-4">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'preview'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setViewMode('editor')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'editor'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <Code className="w-4 h-4" />
              <span>Code</span>
            </button>
          </div>

          {/* Console Toggle */}
          <button
            onClick={() => setShowConsole(!showConsole)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              showConsole
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:text-white hover:bg-gray-600'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Console</span>
          </button>
        </div>
      </div>
    </header>
  );
};
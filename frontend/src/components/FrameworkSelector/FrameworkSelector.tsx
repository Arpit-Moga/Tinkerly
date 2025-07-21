import React from 'react';
import { useAppStore, Framework } from '../../store/useAppStore';

const frameworks = [
  {
    id: 'react' as Framework,
    name: 'React',
    description: 'A JavaScript library for building user interfaces',
    icon: '⚛️',
    color: 'bg-blue-500',
  },
  {
    id: 'vue' as Framework,
    name: 'Vue.js',
    description: 'The Progressive JavaScript Framework',
    icon: '🟢',
    color: 'bg-green-500',
  },
  {
    id: 'svelte' as Framework,
    name: 'Svelte',
    description: 'Cybernetically enhanced web apps',
    icon: '🔥',
    color: 'bg-orange-500',
  },
  {
    id: 'angular' as Framework,
    name: 'Angular',
    description: 'Platform for building mobile and desktop web applications',
    icon: '🅰️',
    color: 'bg-red-500',
  },
  {
    id: 'nodejs' as Framework,
    name: 'Node.js',
    description: 'JavaScript runtime built on Chrome\'s V8 JavaScript engine',
    icon: '🟩',
    color: 'bg-green-600',
  },
];

export const FrameworkSelector: React.FC = () => {
  const { setSelectedFramework, clearChat } = useAppStore();

  const handleFrameworkSelect = (framework: Framework) => {
    setSelectedFramework(framework);
    clearChat();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">
          Choose Your Framework
        </h2>
        <p className="text-gray-400">
          Select a framework to start generating code with AI assistance.
        </p>
      </div>

      <div className="grid gap-4">
        {frameworks.map((framework) => (
          <button
            key={framework.id}
            onClick={() => handleFrameworkSelect(framework.id)}
            className="bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg p-4 transition-all text-left group hover:border-purple-500"
          >
            <div className="flex items-start space-x-4">
              <div className={`w-12 h-12 ${framework.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                {framework.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors">
                  {framework.name}
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  {framework.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
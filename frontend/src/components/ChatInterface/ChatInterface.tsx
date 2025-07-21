import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { LLMService } from '../../services/llm-service';

export const ChatInterface: React.FC = () => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    chatMessages,
    addChatMessage,
    isGenerating,
    setIsGenerating,
    selectedFramework,
    setGeneratedFiles,
  } = useAppStore();

  const llmService = new LLMService();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating || !selectedFramework) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message
    addChatMessage({
      role: 'user',
      content: userMessage,
    });

    setIsGenerating(true);

    try {
      // Convert chat messages to the format expected by the API
      const conversationHistory = chatMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await llmService.generateCode(userMessage, selectedFramework, conversationHistory);
      
      // Add assistant message
      addChatMessage({
        role: 'assistant',
        content: response.message,
      });

      // Update generated files
      if (response.files) {
        setGeneratedFiles(response.files);
      }
    } catch (error) {
      console.error('Error generating code:', error);
      addChatMessage({
        role: 'assistant',
        content: 'Sorry, I encountered an error while generating the code. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">
          Chat with AI - {selectedFramework?.toUpperCase()}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Describe what you want to build and I'll generate the code for you.
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p>Start a conversation to generate your {selectedFramework} project!</p>
            <p className="text-sm mt-2">
              Try: "Create a todo app with add, delete, and mark complete features"
            </p>
          </div>
        )}

        {chatMessages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {isGenerating && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2 flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm text-gray-600">Generating code...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe what you want to build..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={isGenerating}
          />
          <button
            type="submit"
            disabled={!input.trim() || isGenerating}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
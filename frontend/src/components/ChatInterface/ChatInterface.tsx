import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useAppStore } from '../../store/useAppStore';
import { LLMService } from '../../services/llm-service';

export const ChatInterface: React.FC = () => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const {
    chatMessages,
    addChatMessage,
    isGenerating,
    setIsGenerating,
    selectedFramework,
    setSelectedFramework,
    setGeneratedFiles,
    generatedFiles,
  } = useAppStore();

  // Set React as default framework on mount
  useEffect(() => {
    if (!selectedFramework) {
      setSelectedFramework('react');
    }
  }, [selectedFramework, setSelectedFramework]);

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

      // Add current files context to the conversation
      const contextualPrompt = `${userMessage}

Current project files:
${Object.keys(generatedFiles).map(path => `- ${path}`).join('\n')}

Please consider the existing code structure when making changes.`;

      const response = await llmService.generateCode(
        contextualPrompt, 
        selectedFramework, 
        conversationHistory
      );
      
      // Add final assistant message (only the explanation, not code)
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

  const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <div className="my-3">
                <SyntaxHighlighter
                  style={oneDark}
                  language={match[1]}
                  PreTag="div"
                  className="rounded-lg text-sm"
                  customStyle={{
                    margin: 0,
                    padding: '1rem',
                    background: '#1e1e1e',
                  }}
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code className="bg-gray-600 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            );
          },
          p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1 ml-4">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1 ml-4">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          h1: ({ children }) => <h1 className="text-xl font-bold mb-3 text-white">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold mb-3 text-white">{children}</h2>,
          h3: ({ children }) => <h3 className="text-md font-bold mb-2 text-white">{children}</h3>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-purple-500 pl-4 italic mb-3 text-gray-300 bg-gray-700/30 py-2 rounded-r">{children}</blockquote>
          ),
          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
          em: ({ children }) => <em className="italic text-gray-300">{children}</em>,
        }}
      >
        {content}
      </ReactMarkdown>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-800">

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {chatMessages.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-medium text-gray-300 mb-2">
                Ready to build with {selectedFramework?.toUpperCase()}
              </h3>
              <p className="text-gray-500 mb-4">
                Describe what you want to build and I'll generate the complete code for you.
              </p>
              <div className="text-left bg-gray-700 rounded-lg p-4 text-sm">
                <p className="text-gray-300 mb-2">Try asking:</p>
                <ul className="space-y-1 text-gray-400">
                  <li>• "Create a todo app with add, delete, and mark complete"</li>
                  <li>• "Build a weather dashboard with current conditions"</li>
                  <li>• "Make a simple blog with posts and comments"</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {chatMessages.map((message) => (
          <div key={message.id} className="flex items-start space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              message.role === 'user' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-600 text-gray-200'
            }`}>
              {message.role === 'user' ? 'U' : 'AI'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-100 prose prose-invert max-w-none">
                <MarkdownRenderer content={message.content} />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}


        {isGenerating && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
            </div>
            <div className="flex-1">
              <div className="bg-gray-700 rounded-lg px-4 py-3">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-300">Generating your {selectedFramework} project...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700 bg-gray-800">
        <form onSubmit={handleSubmit} className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message CodeGen..."
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none max-h-32"
              disabled={isGenerating || !selectedFramework}
              rows={1}
              style={{ minHeight: '44px' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 128) + 'px';
              }}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isGenerating || !selectedFramework}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
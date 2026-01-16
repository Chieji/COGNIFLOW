import React, { useState, useRef, useEffect } from 'react';
import { AiSettings, Note, Folder, AiAction } from '../types';
import { processChatTurn } from '../services/geminiService';
import { useStore } from '../store';
import { RefreshIcon, SendIcon } from './icons';

interface AssistantChatProps {
  settings: AiSettings;
  notes: Note[];
  folders: Folder[];
  onAiAction: (action: AiAction) => string;
  currentNote?: Note | null;
}

export const AssistantChat: React.FC<AssistantChatProps> = ({
  settings,
  notes,
  folders,
  onAiAction,
  currentNote
}) => {
  const {
    chatMessages,
    addChatMessage,
    clearChatMessages,
    retryLastMessage
  } = useStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const provider = settings.tasks.chat.provider;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    setIsLoading(true);
    setError(null);

      const userMessage = {
        id: `msg-${Date.now()}`,
        role: 'user' as const,
        content: inputMessage,
        createdAt: new Date(),
      };

    await addChatMessage(userMessage);
    setInputMessage('');

    try {
      let assistantContent = '';

      if (provider === 'gemini') {
        const apiKey = settings.keys.gemini;
        if (!apiKey) throw new Error("Gemini API key missing");

        await processChatTurn(
          chatMessages.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content as string || '' }]
          })),
          inputMessage,
          apiKey,
          false,
          notes,
          folders,
          onAiAction,
          'gemini-2.5-flash-lite',
          null,
          (chunk: string) => {
            assistantContent += chunk;
          },
          currentNote
        );
      } else {
        assistantContent = "Provider not supported yet.";
      }

      const assistantMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant' as const,
        content: assistantContent,
        createdAt: new Date(),
      };
      await addChatMessage(assistantMessage);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-full flex-col bg-dark-bg text-dark-text relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-dark-accent/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-dark-bg/80 backdrop-blur-md z-10">
        <h2 className="text-lg font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">AI Assistant</h2>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all chat messages? This cannot be undone.')) {
                clearChatMessages();
              }
            }}
            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-colors text-xs font-medium border border-red-500/20"
          >
            Clear Chat
          </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 relative z-0">
        {chatMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-20 h-20 bg-gradient-to-br from-dark-accent to-dark-accent-hover rounded-2xl flex items-center justify-center mb-6 shadow-glow transform rotate-3">
              <span className="text-white text-4xl font-black">C</span>
            </div>
            <h3 className="text-2xl font-bold mb-3 tracking-tight">How can I help?</h3>
            <p className="text-light-text-secondary dark:text-gray-400 mb-8 max-w-sm mx-auto leading-relaxed">Ask about your notes, create connections, or brainstorm new ideas together.</p>
            <div className="flex flex-wrap gap-3 justify-center max-w-lg">
              {[
                "Analyze connections in 'Atomic Notes'",
                "Summarize recent thoughts",
                "New folder for 'Project Alpha'"
              ].map((suggestion, i) => (
                <button
                  key={i}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm transition-all hover:scale-105 active:scale-95"
                  onClick={() => setInputMessage(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatMessages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
              message.role === 'user'
                ? 'bg-dark-accent text-white rounded-br-none shadow-red-900/20'
                : 'bg-white/5 border border-white/5 text-gray-100 rounded-bl-none'
            }`}>
              <div className="whitespace-pre-wrap leading-relaxed text-sm">
                {typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
              </div>
            </div>
          </div>
        ))}

        {/* Error Display */}
        {error && (
          <div className="flex justify-center">
            <div className="flex items-center gap-3 rounded-lg bg-red-500/10 border border-red-500/20 p-4 max-w-md backdrop-blur-sm">
              <div className="flex-1">
                <p className="text-red-400 text-xs font-bold uppercase tracking-wider">Error</p>
                <p className="text-red-200 text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={retryLastMessage}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-md transition-all uppercase tracking-wide"
              >
                <RefreshIcon className="h-3 w-3" />
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl rounded-bl-none p-4 w-fit">
              <div className="w-2 h-2 bg-dark-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-dark-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-dark-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/5 bg-dark-bg/80 backdrop-blur-md z-10">
        <div className="relative flex gap-2 max-w-4xl mx-auto">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Message Cogniflow..."
            className="flex-1 px-5 py-3 bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-dark-accent/50 focus:border-dark-accent/50 transition-all font-medium"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            aria-label="Send message"
            className="px-5 py-3 bg-dark-accent hover:bg-dark-accent-hover text-white rounded-xl shadow-lg shadow-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 flex items-center justify-center"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
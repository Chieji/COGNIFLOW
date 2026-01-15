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
    <div className="flex h-full flex-col bg-dark-bg text-dark-text">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-dark-primary">
        <h2 className="text-lg font-semibold">AI Assistant</h2>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all chat messages? This cannot be undone.')) {
                clearChatMessages();
              }
            }}
            className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 hover:text-red-200 rounded-md transition-colors text-sm"
          >
            Clear Chat
          </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-dark-accent rounded-full flex items-center justify-center mb-4">
              <span className="text-white text-2xl font-bold">C</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">How can I help you today?</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Ask me about your notes, create connections, or get AI assistance.</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                "How is my note on 'Atomic Notes' connected to my other ideas?",
                "Summarize my latest notes.",
                "Create a new folder for 'Project Alpha'."
              ].map((suggestion, i) => (
                <button
                  key={i}
                  className="px-4 py-2 bg-dark-secondary hover:bg-dark-primary rounded-lg text-sm transition-colors"
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
            <div className={`max-w-[80%] rounded-lg p-3 ${
              message.role === 'user'
                ? 'bg-dark-accent text-white'
                : 'bg-dark-secondary text-dark-text'
            }`}>
              <div className="whitespace-pre-wrap">
                {typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
              </div>
            </div>
          </div>
        ))}

        {/* Error Display */}
        {error && (
          <div className="flex justify-center">
            <div className="flex items-center gap-3 rounded-lg bg-red-900/20 border border-red-500/30 p-4 max-w-md">
              <div className="flex-1">
                <p className="text-red-300 text-sm font-medium">Error</p>
                <p className="text-red-200 text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={retryLastMessage}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors"
              >
                <RefreshIcon className="h-4 w-4" />
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-3 bg-dark-secondary rounded-lg p-3">
              <div className="w-8 h-8 bg-dark-accent rounded-full flex items-center justify-center">
                <span className="text-white text-xs">C</span>
              </div>
              <div className="flex items-center gap-2 text-dark-text">
                <div className="w-4 h-4 border-2 border-dark-accent border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-dark-primary">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Message Cogniflow..."
            className="flex-1 px-4 py-2 bg-dark-secondary border border-dark-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-accent"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="px-4 py-2 bg-dark-accent text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
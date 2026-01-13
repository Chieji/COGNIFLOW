import React, { useMemo, useEffect } from 'react';
import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
  type ChatModelAdapter,
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  ActionBarPrimitive,
} from "@assistant-ui/react";
import * as Avatar from "@radix-ui/react-avatar";
import {
  ArrowUpIcon,
  CopyIcon,
  ReloadIcon,
  AlertCircle,
  Loader2,
  Trash2,
} from "lucide-react";
import { AiSettings, Note, Folder, AiAction } from '../types';
import { processChatTurn } from '../services/geminiService';
import { processUniversalChat } from '../services/universalService';
import { processHuggingFaceChat } from '../services/huggingfaceService';
import { useStore } from '../src/store';

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
    loadChatMessages,
    clearChatMessages,
    isLoading,
    error,
    setLoading,
    setError,
    retryLastMessage
  } = useStore();

  useEffect(() => {
    loadChatMessages();
  }, [loadChatMessages]);

  const provider = settings.tasks.chat.provider;

  const adapter = useMemo<ChatModelAdapter>(() => ({
    async *run({ messages, abortSignal }) {
      const history = messages.slice(0, -1).map(msg => ({
        role: msg.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: (msg.content[0] as any).text || '' }]
      }));

      const lastMessage = messages[messages.length - 1];
      const newMessage = (lastMessage.content[0] as any).text || '';

      let fullText = "";
      const onChunk = (chunk: string) => {
        fullText += chunk;
      };

      try {
        if (provider === 'gemini') {
          const apiKey = settings.keys.gemini;
          if (!apiKey) throw new Error("Gemini API key missing");

          await processChatTurn(
            history,
            newMessage,
            apiKey,
            false, // web search disabled for now in this adapter
            notes,
            folders,
            onAiAction,
            'gemini-2.5-flash-lite',
            null,
            onChunk,
            currentNote
          );
        } else if (provider === 'universal') {
          const apiKey = settings.keys.universal;
          await processUniversalChat(
            history,
            newMessage,
            apiKey,
            settings.universal.baseUrl,
            settings.universal.modelId,
            onChunk
          );
        } else if (provider === 'huggingface') {
          const apiKey = settings.keys.huggingface;
          const response = await processHuggingFaceChat(
            history,
            newMessage,
            apiKey,
            settings.huggingface.modelId
          );
          onChunk(response.text);
        } else {
          onChunk("Provider not supported in this view yet.");
        }

        yield {
          content: [{ type: "text", text: fullText }],
        };
      } catch (e) {
        yield {
          content: [{ type: "text", text: `Error: ${e instanceof Error ? e.message : 'Unknown error'}` }],
        };
      }
    },
  }), [provider, settings, notes, folders, onAiAction]);

  const runtime = useExternalStoreRuntime({
    messages: chatMessages,
    onNew: async (message) => {
      setLoading(true);
      setError(null);

      try {
        // Add user message
        const userMessage = {
          id: `msg-${Date.now()}`,
          role: 'user' as const,
          content: message.content,
        };
        addChatMessage(userMessage);

        // Get AI response
        const assistantContent = [];
        for await (const chunk of adapter.run({
          messages: [...chatMessages, userMessage],
        })) {
          assistantContent.push(...chunk.content);
        }

        const assistantMessage = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant' as const,
          content: assistantContent,
        };
        addChatMessage(assistantMessage);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
  });

  const chatStyle = useMemo(() => ({
    '--aui-primary': settings.accentColor || '#FF0000',
  } as React.CSSProperties), [settings.accentColor]);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="flex h-full flex-col bg-[#212121] text-white" style={chatStyle}>
        {/* Header with Clear Chat Button */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold">AI Assistant</h2>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all chat messages? This cannot be undone.')) {
                clearChatMessages();
              }
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 hover:text-red-200 rounded-md transition-colors text-sm"
            disabled={isLoading}
          >
            <Trash2 className="h-4 w-4" />
            Clear Chat
          </button>
        </div>

        <ThreadPrimitive.Root className="flex h-full flex-col">
          <ThreadPrimitive.Viewport className="flex flex-grow flex-col gap-8 overflow-y-scroll pt-16 px-4">
            <ThreadPrimitive.Empty>
              <div className="flex flex-grow flex-col items-center justify-center">
                <Avatar.Root className="flex h-12 w-12 items-center justify-center rounded-[24px] border border-white/15 shadow">
                  <Avatar.AvatarFallback className="text-white">C</Avatar.AvatarFallback>
                </Avatar.Root>
                <p className="mt-4 text-white text-xl">How can I help you today?</p>
                <div className="mt-8 flex flex-col gap-2">
                  <p className="text-white/70 text-sm">Try asking:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "How is my note on 'Atomic Notes' connected to my other ideas?",
                      "Summarize my latest notes.",
                      "Create a new folder for 'Project Alpha'."
                    ].map((suggestion, i) => (
                      <button
                        key={i}
                        className="rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20 transition-colors"
                        onClick={() => {
                          // This would need to be implemented to send the suggestion
                        }}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </ThreadPrimitive.Empty>

            <ThreadPrimitive.Messages
              components={{
                UserMessage,
                AssistantMessage,
              }}
            />

            {/* Error Display */}
            {error && (
              <div className="mx-auto max-w-screen-md">
                <div className="flex items-center gap-3 rounded-lg bg-red-900/20 border border-red-500/30 p-4">
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-red-300 text-sm font-medium">Error</p>
                    <p className="text-red-200 text-sm mt-1">{error}</p>
                  </div>
                  <button
                    onClick={retryLastMessage}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors"
                  >
                    <ReloadIcon className="h-4 w-4" />
                    Retry
                  </button>
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="mx-auto max-w-screen-md">
                <div className="flex items-center gap-3">
                  <Avatar.Root className="flex size-8 flex-shrink-0 items-center justify-center rounded-[24px] border border-white/15 shadow">
                    <Avatar.AvatarFallback className="text-white text-xs">C</Avatar.AvatarFallback>
                  </Avatar.Root>
                  <div className="flex items-center gap-2 text-white/70">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </ThreadPrimitive.Viewport>

          <ComposerPrimitive.Root className="mx-auto flex w-full max-w-screen-md items-end rounded-3xl bg-white/5 pl-2 mb-4">
            <ComposerPrimitive.Input
              placeholder="Message Cogniflow"
              className="h-12 max-h-40 flex-grow resize-none bg-transparent p-3.5 text-sm text-white outline-none placeholder:text-white/50"
              disabled={isLoading}
            />
            <ComposerPrimitive.Send className="m-2 flex size-8 items-center justify-center rounded-full bg-white disabled:opacity-10 disabled:cursor-not-allowed">
              <ArrowUpIcon className="size-5 text-black" />
            </ComposerPrimitive.Send>
          </ComposerPrimitive.Root>
        </ThreadPrimitive.Root>
      </div>
    </AssistantRuntimeProvider>
  );
};

const UserMessage: React.FC = () => {
  return (
    <MessagePrimitive.Root className="relative mx-auto flex w-full max-w-screen-md gap-3">
      <div className="flex-1 pt-1">
        <div className="text-white">
          <MessagePrimitive.Content />
        </div>
      </div>
    </MessagePrimitive.Root>
  );
};

const AssistantMessage: React.FC = () => {
  return (
    <MessagePrimitive.Root className="relative mx-auto flex w-full max-w-screen-md gap-3">
      <Avatar.Root className="flex size-8 flex-shrink-0 items-center justify-center rounded-[24px] border border-white/15 shadow">
        <Avatar.AvatarFallback className="text-white text-xs">C</Avatar.AvatarFallback>
      </Avatar.Root>

      <div className="flex-1 pt-1">
        <div className="text-[#eee]">
          <MessagePrimitive.Content />
        </div>
        <ActionBarPrimitive.Root className="mt-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <ActionBarPrimitive.Copy className="flex size-6 items-center justify-center rounded-md hover:bg-white/10">
            <CopyIcon className="size-4" />
          </ActionBarPrimitive.Copy>
          <ActionBarPrimitive.Reload className="flex size-6 items-center justify-center rounded-md hover:bg-white/10">
            <ReloadIcon className="size-4" />
          </ActionBarPrimitive.Reload>
        </ActionBarPrimitive.Root>
      </div>
    </MessagePrimitive.Root>
  );
};

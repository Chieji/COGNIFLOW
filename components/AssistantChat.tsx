import React, { useMemo } from 'react';
import { 
  AssistantRuntimeProvider, 
  useLocalRuntime, 
  type ChatModelAdapter,
  Thread
} from "@assistant-ui/react";
import { AiSettings, Note, Folder, AiAction } from '../types';
import { processChatTurn } from '../services/geminiService';
import { processUniversalChat } from '../services/universalService';
import { processHuggingFaceChat } from '../services/huggingfaceService';

interface AssistantChatProps {
  settings: AiSettings;
  notes: Note[];
  folders: Folder[];
  onAiAction: (action: AiAction) => string;
}

export const AssistantChat: React.FC<AssistantChatProps> = ({ 
  settings, 
  notes, 
  folders, 
  onAiAction 
}) => {
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
            onChunk
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

  const runtime = useLocalRuntime(adapter);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="flex-1 h-full bg-light-bg dark:bg-dark-bg overflow-hidden">
        <Thread 
          welcome={{
            message: "Welcome to Cogniflow! How can I help you today?",
            suggestions: [
              { prompt: "How is my note on 'Atomic Notes' connected to my other ideas?" },
              { prompt: "Summarize my latest notes." },
              { prompt: "Create a new folder for 'Project Alpha'." }
            ]
          }}
        />
      </div>
    </AssistantRuntimeProvider>
  );
};

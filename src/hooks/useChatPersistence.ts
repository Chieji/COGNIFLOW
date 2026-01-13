import { useEffect } from 'react';
import { db } from '../db';
import { ChatMessage } from '../types';
import { useThread } from '@assistant-ui/react';

/**
 * Hook to sync assistant-ui Thread messages with Dexie.js
 * Ensures chat persistence across sessions
 * 
 * Note: This is a foundation. Full integration requires:
 * - A chat store slice to be implemented
 */
export const useChatPersistence = (threadId: string) => {
    const { setMessages } = useThread();
  useEffect(() => {
    // Load messages from Dexie on mount
    const loadMessages = async () => {
      try {
        const chatData: ChatMessage[] = await db.chatMessages
          .where('threadId')
          .equals(threadId)
          .toArray();
          
        if (chatData.length > 0) {
            setMessages(chatData.map(m => ({
                id: m.id?.toString() ?? Math.random().toString(),
                role: m.role,
                content: [{ type: 'text', text: m.content }],
                createdAt: new Date(m.timestamp),
            })));
        }
        console.log('[ChatPersistence] Hook initialized for thread:', threadId);
      } catch (error) {
        console.error('[ChatPersistence] Failed to load chat history:', error);
      }
    };

    loadMessages();
  }, [threadId, setMessages]);

  return { threadId };
};

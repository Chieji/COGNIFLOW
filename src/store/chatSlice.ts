import { StateCreator } from 'zustand';
import { ThreadMessageLike } from '@assistant-ui/react';

export interface ChatSlice {
  chatMessages: ThreadMessageLike[];
  isLoading: boolean;
  error: string | null;
  addChatMessage: (message: ThreadMessageLike) => void;
  clearChatMessages: () => void;
  loadChatMessages: () => void;
  saveChatMessages: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  retryLastMessage: () => void;
}

export const createChatSlice: StateCreator<ChatSlice> = (set, get) => ({
  chatMessages: [],
  isLoading: false,
  error: null,

  addChatMessage: (message: ThreadMessageLike) => {
    if (!message?.id || !message?.content) {
      console.error('[ChatSlice] Invalid message structure');
      return;
    }
    set((state) => ({
      chatMessages: [...state.chatMessages, message],
      error: null,
    }));
    get().saveChatMessages();
  },

  clearChatMessages: () => {
    set({ chatMessages: [], error: null, isLoading: false });
  },

  loadChatMessages: () => {
    try {
      const saved = localStorage.getItem('cogniflow-chat-messages');
      if (saved) {
        const messages = JSON.parse(saved);
        set({ chatMessages: messages });
      }
    } catch (error) {
      console.error('Failed to load chat messages:', error);
      set({ error: 'Failed to load chat history' });
    }
  },

  saveChatMessages: () => {
    try {
      const { chatMessages } = get();
      localStorage.setItem('cogniflow-chat-messages', JSON.stringify(chatMessages));
    } catch (error) {
      console.error('Failed to save chat messages:', error);
      set({ error: 'Failed to save chat history' });
    }
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  retryLastMessage: () => {
    const { chatMessages } = get();
    if (chatMessages.length === 0) return;

    // Find the last user message and remove all messages after it
    const lastUserMessageIndex = chatMessages
      .map((msg, index) => ({ msg, index }))
      .filter(({ msg }) => msg.role === 'user')
      .pop()?.index;

    if (lastUserMessageIndex !== undefined) {
      const messagesToKeep = chatMessages.slice(0, lastUserMessageIndex + 1);
      set({
        chatMessages: messagesToKeep,
        error: null,
        isLoading: false
      });
      get().saveChatMessages();
    }
  },
});
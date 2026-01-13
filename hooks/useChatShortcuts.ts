import { useEffect } from 'react';

interface ShortcutConfig {
  focusChat?: boolean; // Cmd+K or Ctrl+K
  newThread?: boolean; // Cmd+N or Ctrl+N
  sendMessage?: boolean; // Enter to send
}

/**
 * Hook to manage keyboard shortcuts for chat interface
 * Default shortcuts:
 * - Cmd/Ctrl+K: Focus chat input
 * - Cmd/Ctrl+N: New thread
 * - Enter: Send message
 * - Shift+Enter: New line
 */
export const useChatShortcuts = (config: ShortcutConfig = { focusChat: true }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Cmd/Ctrl+K: Focus chat input
      if (config.focusChat && modifier && e.key === 'k') {
        e.preventDefault();
        const input = document.querySelector('[data-chat-input]') as HTMLInputElement;
        if (input) {
          input.focus();
        }
      }

      // Cmd/Ctrl+N: New thread (if handler provided)
      if (config.newThread && modifier && e.key === 'n') {
        e.preventDefault();
        const newThreadBtn = document.querySelector('[data-new-thread]') as HTMLElement;
        if (newThreadBtn) {
          newThreadBtn.click();
        }
      }

      // Enter to send (if Shift+Enter for newline)
      if (config.sendMessage && e.key === 'Enter' && !e.shiftKey) {
        const sendBtn = document.querySelector('[data-send-message]') as HTMLElement;
        if (sendBtn && (e.target as HTMLElement).closest('[data-chat-input]')) {
          e.preventDefault();
          sendBtn.click();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config]);
};

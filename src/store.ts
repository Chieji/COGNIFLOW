import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ThreadMessageLike } from '@assistant-ui/react';
import { Note, Folder, Connection, AiSettings, PatchProposal, FeatureFlag, AuditLogEntry, View, Theme } from './types';
import { initialNotes, initialFolders, initialPatches, initialFeatureFlags, initialAuditLog } from './constants';
import { db } from './db';
import { ensureInitialized } from './utils/dbUtils';
import { optimisticUpdate } from './utils/dbUtils';

interface AppState {
  notes: Note[];
  folders: Folder[];
  connections: Connection[];
  activeNoteId: string | null;
  activeFolderId: string | null;
  view: View;
  theme: Theme;
  isSettingsOpen: boolean;
  settings: AiSettings;
  patches: PatchProposal[];
  featureFlags: FeatureFlag[];
  auditLog: AuditLogEntry[];
  isInitialized: boolean;
  chatMessages: ThreadMessageLike[];
  isChatLoading: boolean;
  chatError: string | null;

  // Actions
  initialize: () => Promise<void>;
  setNotes: (notes: Note[]) => void;
  setFolders: (folders: Folder[]) => void;
  setConnections: (connections: Connection[]) => void;
  setActiveNoteId: (id: string | null) => void;
  setActiveFolderId: (id: string | null) => void;
  setView: (view: View) => void;
  setTheme: (theme: Theme) => void;
  setIsSettingsOpen: (isOpen: boolean) => void;
  setSettings: (settings: AiSettings) => void;
  setPatches: (patches: PatchProposal[]) => void;
  setFeatureFlags: (flags: FeatureFlag[]) => void;
  setAuditLog: (log: AuditLogEntry[]) => void;
  addChatMessage: (message: ThreadMessageLike) => Promise<void>;
  clearChatMessages: () => Promise<void>;
  loadChatMessages: () => Promise<void>;
  saveChatMessages: () => Promise<void>;
  setChatLoading: (loading: boolean) => void;
  setChatError: (error: string | null) => void;
  retryLastMessage: () => void;

  // Derived Actions with optimistic updates
  createNewNote: () => Promise<void>;
  updateNote: (updatedNote: Note) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  addFolder: (name: string) => Promise<void>;
  updateFolder: (updatedFolder: Folder) => Promise<void>;
  reorderFolders: (draggedId: string, targetId: string) => Promise<void>;
  handlePatchStatusChange: (patchId: string, status: 'approved' | 'rejected') => Promise<void>;
  handleToggleFeatureFlag: (flagId: string) => Promise<void>;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      notes: [],
      folders: [],
      connections: [],
      activeNoteId: null,
      activeFolderId: 'all',
      view: View.Notes,
      theme: 'dark',
      isSettingsOpen: false,
      settings: {
        tasks: { chat: { provider: 'gemini' }, summary: { provider: 'gemini' }, translation: { provider: 'gemini' } },
        keys: { gemini: '', openai: '', anthropic: '', openrouter: '', groq: '', huggingface: '', universal: '' },
        huggingface: { modelId: 'mistralai/Mistral-7B-Instruct-v0.2' },
        universal: { baseUrl: import.meta.env.VITE_UNIVERSAL_BASE_URL || 'http://localhost:11434/v1', modelId: 'llama3', accentColor: '#FF0000' },
      },
      patches: [],
      featureFlags: [],
      auditLog: [],
      isInitialized: false,
      chatMessages: [],
      isChatLoading: false,
      chatError: null,

      // FIXED: Use initialization lock to prevent race conditions
      initialize: async () => {
        try {
          await ensureInitialized(async () => {
            console.log('[Store] Initializing with race condition prevention...');

            const notes = await db.notes.toArray();
            const folders = await db.folders.toArray();
            const connections = await db.connections.toArray();
            const patches = await db.patches.toArray();
            const featureFlags = await db.featureFlags.toArray();
            const auditLog = await db.auditLog.toArray();

            // If DB is empty, seed with initial data
            if (notes.length === 0 && folders.length === 0) {
              await db.notes.bulkAdd(initialNotes);
              await db.folders.bulkAdd(initialFolders);
              await db.patches.bulkAdd(initialPatches);
              await db.featureFlags.bulkAdd(initialFeatureFlags);
              await db.auditLog.bulkAdd(initialAuditLog);

              set({
                notes: initialNotes,
                folders: initialFolders,
                patches: initialPatches,
                featureFlags: initialFeatureFlags,
                auditLog: initialAuditLog,
                activeNoteId: initialNotes.length > 0 ? initialNotes[0].id : null,
              });
            } else {
              set({
                notes,
                folders,
                connections,
                patches,
                featureFlags,
                auditLog,
                activeNoteId: notes.length > 0 ? notes[0].id : null,
              });
            }

            console.log('[Store] Initialization complete');
          });

          set({ isInitialized: true });
        } catch (error) {
          console.error('[Store] Initialization failed:', error);
          set({ isInitialized: false });
          throw error;
        }
      },

      setNotes: (notes) => set({ notes }),
      setFolders: (folders) => set({ folders }),
      setConnections: (connections) => set({ connections }),
      setActiveNoteId: (activeNoteId) => set({ activeNoteId }),
      setActiveFolderId: (activeFolderId) => set({ activeFolderId }),
      setView: (view) => set({ view }),
      setTheme: (theme) => set({ theme }),
      setIsSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),
      setSettings: (settings) => set({ settings }),
      setPatches: (patches) => set({ patches }),
      setFeatureFlags: (featureFlags) => set({ featureFlags }),
      setAuditLog: (auditLog) => set({ auditLog }),

      // Chat actions from chatSlice
      addChatMessage: async (message: ThreadMessageLike) => {
        set((state) => ({
          chatMessages: [...state.chatMessages, message],
          chatError: null, // Clear any previous errors
        }));
        // Save to IndexedDB
        await db.chatMessages.add(message);
      },
      clearChatMessages: async () => {
        set({ chatMessages: [], chatError: null, isChatLoading: false });
        // Clear from IndexedDB
        await db.chatMessages.clear();
      },
      setChatLoading: (loading: boolean) => {
        set({ isChatLoading: loading });
      },
      setChatError: (error: string | null) => {
        set({ chatError: error });
      },
      loadChatMessages: async () => {
        try {
          const messages = await db.chatMessages.toArray();
          set({ chatMessages: messages });
        } catch (error) {
          console.error('[Store] Failed to load chat messages from IndexedDB:', error);
        }
      },
      saveChatMessages: async () => {
        try {
          const { chatMessages } = get();
          await db.chatMessages.clear();
          await db.chatMessages.bulkAdd(chatMessages);
        } catch (error) {
          console.error('[Store] Failed to save chat messages to IndexedDB:', error);
        }
      },
      retryLastMessage: () => {
        const { chatMessages } = get();
        if (chatMessages.length === 0) return;

        const lastUserMessageIndex = chatMessages
          .map((msg, index) => ({ msg, index }))
          .filter(({ msg }) => msg.role === 'user')
          .pop()?.index;

        if (lastUserMessageIndex !== undefined) {
          const messagesToKeep = chatMessages.slice(0, lastUserMessageIndex + 1);
          set({
            chatMessages: messagesToKeep,
            chatError: null,
            isChatLoading: false
          });
          get().saveChatMessages();
        }
      },

      // FIXED: Use optimistic updates with rollback
      createNewNote: async () => {
        const { activeFolderId } = get();
        const newNote: Note = {
          id: `note-${Date.now()}`,
          title: 'Untitled Note',
          content: '',
          summary: '',
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          folderId: (activeFolderId && activeFolderId !== 'all' && activeFolderId !== 'uncategorized') ? activeFolderId : null,
          type: 'text',
          attachments: [],
        };

        await optimisticUpdate(
          // Optimistic local update
          () => set((state) => ({
            notes: [newNote, ...state.notes],
            activeNoteId: newNote.id,
            view: View.Notes,
          })),
          // Database persist
          () => db.notes.add(newNote),
          // Rollback on error
          () => set((state) => ({
            notes: state.notes.filter(n => n.id !== newNote.id),
            activeNoteId: state.notes.length > 0 ? state.notes[0].id : null,
          }))
        );
      },

      updateNote: async (updatedNote) => {
        const noteWithTimestamp = { ...updatedNote, updatedAt: new Date().toISOString() };
        const oldNotes = get().notes;

        await optimisticUpdate(
          () => set((state) => ({
            notes: state.notes.map((note) =>
              note.id === updatedNote.id ? noteWithTimestamp : note
            ),
          })),
          () => db.notes.put(noteWithTimestamp),
          () => set({ notes: oldNotes })
        );
      },

      deleteNote: async (id) => {
        const oldNotes = get().notes;
        const oldActiveId = get().activeNoteId;

        await optimisticUpdate(
          () => set((state) => ({
            notes: state.notes.filter((note) => note.id !== id),
            activeNoteId: state.activeNoteId === id ? null : state.activeNoteId,
          })),
          () => db.notes.delete(id),
          () => set({ notes: oldNotes, activeNoteId: oldActiveId })
        );
      },

      addFolder: async (name) => {
        const { folders } = get();
        if (folders.some((f) => f.name === name)) {
          throw new Error('A folder with this name already exists.');
        }

        const newFolder: Folder = {
          id: `folder-${Date.now()}`,
          name: name,
          createdAt: new Date().toISOString(),
          description: '',
        };

        await optimisticUpdate(
          () => set((state) => ({
            folders: [...state.folders, newFolder],
            activeFolderId: newFolder.id,
          })),
          () => db.folders.add(newFolder),
          () => set((state) => ({
            folders: state.folders.filter(f => f.id !== newFolder.id),
          }))
        );
      },

      updateFolder: async (updatedFolder) => {
        const oldFolders = get().folders;

        await optimisticUpdate(
          () => set((state) => ({
            folders: state.folders.map((f) => (f.id === updatedFolder.id ? updatedFolder : f)),
          })),
          () => db.folders.put(updatedFolder),
          () => set({ folders: oldFolders })
        );
      },

      reorderFolders: async (draggedId, targetId) => {
        const { folders } = get();
        const draggedIndex = folders.findIndex((f) => f.id === draggedId);
        const targetIndex = folders.findIndex((f) => f.id === targetId);
        if (draggedIndex === -1 || targetIndex === -1) return;

        const newFolders = [...folders];
        const [draggedItem] = newFolders.splice(draggedIndex, 1);
        newFolders.splice(targetIndex, 0, draggedItem);

        set({ folders: newFolders });
        // Note: Consider adding sortOrder field for persistence
      },

      handlePatchStatusChange: async (patchId, status) => {
        const newLog: AuditLogEntry = {
          id: `log-${Date.now()}`,
          patchId,
          timestamp: new Date().toISOString(),
          status,
        };

        await db.auditLog.add(newLog);
        await db.patches.update(patchId, { status });

        set((state) => ({
          patches: state.patches.map((p) => (p.id === patchId ? { ...p, status } : p)),
          auditLog: [newLog, ...state.auditLog],
        }));
      },

      handleToggleFeatureFlag: async (flagId) => {
        const flag = get().featureFlags.find(f => f.id === flagId);
        if (!flag) return;

        const updatedFlag = { ...flag, isEnabled: !flag.isEnabled };
        await db.featureFlags.put(updatedFlag);

        set((state) => ({
          featureFlags: state.featureFlags.map((f) =>
            f.id === flagId ? updatedFlag : f
          ),
        }));
      },
    }),
    {
      name: 'cogniflow-storage',
      partialize: (state) => ({
        theme: state.theme,
        settings: state.settings,
        activeFolderId: state.activeFolderId,
        view: state.view,
        // chatMessages are now persisted to IndexedDB, not localStorage
      }),
    }
  )
);

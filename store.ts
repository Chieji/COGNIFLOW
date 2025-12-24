import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Note, Folder, Connection, AiSettings, PatchProposal, FeatureFlag, AuditLogEntry, View, Theme } from './types';
import { initialNotes, initialFolders, initialPatches, initialFeatureFlags, initialAuditLog } from './constants';
import { db } from './db';

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

  // Derived Actions
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
        universal: { baseUrl: 'http://localhost:11434/v1', modelId: 'llama3' },
      },
      patches: [],
      featureFlags: [],
      auditLog: [],
      isInitialized: false,

      initialize: async () => {
        if (get().isInitialized) return;

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
        set({ isInitialized: true });
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
        await db.notes.add(newNote);
        set((state) => ({
          notes: [newNote, ...state.notes],
          activeNoteId: newNote.id,
          view: View.Notes,
        }));
      },

      updateNote: async (updatedNote) => {
        const noteWithTimestamp = { ...updatedNote, updatedAt: new Date().toISOString() };
        await db.notes.put(noteWithTimestamp);
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === updatedNote.id ? noteWithTimestamp : note
          ),
        }));
      },

      deleteNote: async (id) => {
        await db.notes.delete(id);
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
          activeNoteId: state.activeNoteId === id ? null : state.activeNoteId,
        }));
      },

      addFolder: async (name) => {
        const { folders } = get();
        if (folders.some((f) => f.name === name)) {
          alert('A folder with this name already exists.');
          return;
        }
        const newFolder: Folder = {
          id: `folder-${Date.now()}`,
          name: name,
          createdAt: new Date().toISOString(),
          description: '',
        };
        await db.folders.add(newFolder);
        set((state) => ({
          folders: [...state.folders, newFolder],
          activeFolderId: newFolder.id,
        }));
      },

      updateFolder: async (updatedFolder) => {
        await db.folders.put(updatedFolder);
        set((state) => ({
          folders: state.folders.map((f) => (f.id === updatedFolder.id ? updatedFolder : f)),
        }));
      },

      reorderFolders: async (draggedId, targetId) => {
        const { folders } = get();
        const draggedIndex = folders.findIndex((f) => f.id === draggedId);
        const targetIndex = folders.findIndex((f) => f.id === targetId);
        if (draggedIndex === -1 || targetIndex === -1) return;
        
        const newFolders = [...folders];
        const [draggedItem] = newFolders.splice(draggedIndex, 1);
        newFolders.splice(targetIndex, 0, draggedItem);
        
        // In a real app, you might want to update a 'sortOrder' property in DB
        // For now, we'll just clear and re-add to maintain order if needed, 
        // but bulkPut is better if we had a sortOrder.
        set({ folders: newFolders });
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
      }),
    }
  )
);

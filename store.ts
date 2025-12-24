import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Note, Folder, Connection, AiSettings, PatchProposal, FeatureFlag, AuditLogEntry, View, Theme } from './types';
import { initialNotes, initialFolders, initialPatches, initialFeatureFlags, initialAuditLog } from './constants';

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

  // Actions
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
  createNewNote: () => void;
  updateNote: (updatedNote: Note) => void;
  deleteNote: (id: string) => void;
  addFolder: (name: string) => void;
  updateFolder: (updatedFolder: Folder) => void;
  reorderFolders: (draggedId: string, targetId: string) => void;
  handlePatchStatusChange: (patchId: string, status: 'approved' | 'rejected') => void;
  handleToggleFeatureFlag: (flagId: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      notes: initialNotes,
      folders: initialFolders,
      connections: [],
      activeNoteId: initialNotes.length > 0 ? initialNotes[0].id : null,
      activeFolderId: 'all',
      view: View.Notes,
      theme: 'dark',
      isSettingsOpen: false,
      settings: {
        tasks: { chat: { provider: 'gemini' }, summary: { provider: 'gemini' }, translation: { provider: 'gemini' } },
        keys: { gemini: '', openai: '', anthropic: '', openrouter: '', groq: '', huggingface: '' },
        huggingface: { modelId: 'mistralai/Mistral-7B-Instruct-v0.2' },
      },
      patches: initialPatches,
      featureFlags: initialFeatureFlags,
      auditLog: initialAuditLog,

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

      createNewNote: () => {
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
        set((state) => ({
          notes: [newNote, ...state.notes],
          activeNoteId: newNote.id,
          view: View.Notes,
        }));
      },

      updateNote: (updatedNote) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === updatedNote.id ? { ...updatedNote, updatedAt: new Date().toISOString() } : note
          ),
        }));
      },

      deleteNote: (id) => {
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
          activeNoteId: state.activeNoteId === id ? null : state.activeNoteId,
        }));
      },

      addFolder: (name) => {
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
        set((state) => ({
          folders: [...state.folders, newFolder],
          activeFolderId: newFolder.id,
        }));
      },

      updateFolder: (updatedFolder) => {
        set((state) => ({
          folders: state.folders.map((f) => (f.id === updatedFolder.id ? updatedFolder : f)),
        }));
      },

      reorderFolders: (draggedId, targetId) => {
        set((state) => {
          const draggedIndex = state.folders.findIndex((f) => f.id === draggedId);
          const targetIndex = state.folders.findIndex((f) => f.id === targetId);
          if (draggedIndex === -1 || targetIndex === -1) return state;
          const newFolders = [...state.folders];
          const [draggedItem] = newFolders.splice(draggedIndex, 1);
          newFolders.splice(targetIndex, 0, draggedItem);
          return { folders: newFolders };
        });
      },

      handlePatchStatusChange: (patchId, status) => {
        set((state) => {
          const newLog: AuditLogEntry = {
            id: `log-${Date.now()}`,
            patchId,
            timestamp: new Date().toISOString(),
            status,
          };
          return {
            patches: state.patches.map((p) => (p.id === patchId ? { ...p, status } : p)),
            auditLog: [newLog, ...state.auditLog],
          };
        });
      },

      handleToggleFeatureFlag: (flagId) => {
        set((state) => ({
          featureFlags: state.featureFlags.map((f) =>
            f.id === flagId ? { ...f, isEnabled: !f.isEnabled } : f
          ),
        }));
      },
    }),
    {
      name: 'cogniflow-storage',
    }
  )
);

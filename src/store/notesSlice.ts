import { StateCreator } from 'zustand';
import { Note } from '../types';
import { db } from '../db';

export interface NotesSlice {
  notes: Note[];
  selectedNote: Note | null;
  addNote: (note: Note) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  selectNote: (note: Note | null) => void;
}

export const createNotesSlice: StateCreator<NotesSlice> = (set) => ({
  notes: [],
  selectedNote: null,
  addNote: async (note: Note) => {
    if (!note?.id) {
      console.error('[NotesSlice] Cannot add note without valid ID');
      return;
    }
    await db.notes.add(note);
    set((state) => ({ notes: [...state.notes, note] }));
  },
  updateNote: async (id: string, updates: Partial<Note>) => {
    if (!id) {
      console.error('[NotesSlice] Cannot update note without valid ID');
      return;
    }
    await db.notes.update(id, updates);
    set((state) => ({
      notes: state.notes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    }));
  },
  deleteNote: async (id: string) => {
    if (!id) {
      console.error('[NotesSlice] Cannot delete note without valid ID');
      return;
    }
    await db.notes.delete(id);
    set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }));
  },
  selectNote: (note: Note | null) => set({ selectedNote: note }),
});

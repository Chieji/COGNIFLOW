import { useStore } from '../store';

export function useNotes() {
  return {
    notes: useStore((state) => state.notes),
    selectedNote: useStore((state) => state.selectedNote),
    addNote: useStore((state) => state.addNote),
    updateNote: useStore((state) => state.updateNote),
    deleteNote: useStore((state) => state.deleteNote),
    selectNote: useStore((state) => state.selectNote),
  };
}

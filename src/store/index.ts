import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createNotesSlice, NotesSlice } from './notesSlice';
import { createUISlice, UISlice } from './uiSlice';

type StoreState = NotesSlice & UISlice;

export const useStore = create<StoreState>()(
  devtools(
    (...args) => ({
      ...createNotesSlice(...args),
      ...createUISlice(...args),
    }),
    { name: 'COGNIFLOW' }
  )
);

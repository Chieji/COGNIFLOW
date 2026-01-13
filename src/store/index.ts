import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createNotesSlice, NotesSlice } from './notesSlice';
import { createUISlice, UISlice } from './uiSlice';
import { createChatSlice, ChatSlice } from './chatSlice';

type StoreState = NotesSlice & UISlice & ChatSlice;

export const useStore = create<StoreState>()(
  devtools(
    (...args) => ({
      ...createNotesSlice(...args),
      ...createUISlice(...args),
      ...createChatSlice(...args),
    }),
    { name: 'COGNIFLOW' }
  )
);

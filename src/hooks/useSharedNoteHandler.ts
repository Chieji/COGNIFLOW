import { useEffect } from 'react';
import { useStore } from '../store';
import { Note } from '../types';

export const useSharedNoteHandler = () => {
  const { notes, setNotes, setActiveNoteId, isInitialized } = useStore();

  useEffect(() => {
    if (!isInitialized) return;

    const hash = window.location.hash;
    if (hash.startsWith('#/share/')) {
      try {
        const encodedData = hash.substring(8);
        const decodedString = atob(encodedData);
        const sharedNoteData = JSON.parse(decodedString);

        if (sharedNoteData.title && typeof sharedNoteData.content !== 'undefined') {
          const newSharedNote: Note = {
            id: `shared-${Date.now()}`,
            title: `[Shared] ${sharedNoteData.title}`,
            content: sharedNoteData.content,
            summary: '',
            tags: ['shared'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            folderId: null,
            type: 'text',
            attachments: [],
          };
          setNotes([newSharedNote, ...notes]);
          setActiveNoteId(newSharedNote.id);
          window.history.replaceState(null, '', ' ');
        }
      } catch (e) {
        console.error('Failed to parse shared note link:', e);
        window.history.replaceState(null, '', ' ');
      }
    }
  }, [isInitialized, notes, setNotes, setActiveNoteId]);
};

import React from 'react';
import { useNotes } from '../../hooks/useNotes';
import { Note } from '../../types';

interface NoteListSectionProps {
  onNoteClick: (note: Note) => void;
  selectedNoteId?: string;
}

export const NoteListSection: React.FC<NoteListSectionProps> = ({ 
  onNoteClick, 
  selectedNoteId 
}) => {
  const { notes } = useNotes();

  return (
    <div style={{ padding: '0.5rem' }}>
      <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
        Notes ({notes.length})
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {notes.map((note) => (
          <div
            key={note.id}
            onClick={() => onNoteClick(note)}
            style={{
              padding: '0.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
              backgroundColor: note.id === selectedNoteId ? 'var(--accent-color)' : 'transparent',
              color: note.id === selectedNoteId ? 'white' : 'inherit',
            }}
          >
            <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>
              {note.title || 'Untitled'}
            </div>
            <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.25rem' }}>
              {new Date(note.updatedAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

import React, { memo } from 'react';
import { Note } from '../types';

interface NoteCardProps {
  note: Note;
  isSelected?: boolean;
  onClick: () => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, isSelected, onClick }) => (
  <div onClick={onClick} style={{ padding: '1rem', cursor: 'pointer', backgroundColor: isSelected ? 'var(--accent-color)' : 'transparent' }}>
    <h3>{note.title || 'Untitled'}</h3>
    <p>{note.content?.substring(0, 100)}...</p>
  </div>
);

export default memo(NoteCard);

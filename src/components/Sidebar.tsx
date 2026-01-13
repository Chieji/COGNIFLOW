import React from 'react';
import { useStore } from '../store';
import { NoteListSection } from './sidebar/NoteListSection';
import { FolderTree } from './sidebar/FolderTree';
import { SearchBar } from './sidebar/SearchBar';
import { View } from '../types';

const Sidebar: React.FC = () => {
  const { 
    activeView, 
    setActiveView, 
    selectNote, 
    selectFolder,
    selectedNote,
    selectedFolder,
    setSearchQuery,
  } = useStore();

  const views: { id: View; label: string; icon: string }[] = [
    { id: 'notes', label: 'Notes', icon: '📝' },
    { id: 'graph', label: 'Graph', icon: '🕸️' },
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'studio', label: 'Studio', icon: '⚡' },
  ];

  return (
    <div style={{ 
      height: '100%', 
      backgroundColor: 'var(--bg-secondary)', 
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid rgba(255,255,255,0.1)',
    }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>COGNIFLOW</h1>
      </div>
      <div style={{ display: 'flex', padding: '0.5rem', gap: '0.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        {views.map((view) => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id)}
            style={{
              flex: 1,
              padding: '0.5rem',
              backgroundColor: activeView === view.id ? 'var(--accent-color)' : 'transparent',
              color: activeView === view.id ? 'white' : 'inherit',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.75rem',
            }}
          >
            <div>{view.icon}</div>
            <div>{view.label}</div>
          </button>
        ))}
      </div>
      <SearchBar onSearch={setSearchQuery} />
      <div style={{ flex: 1, overflow: 'auto' }}>
        <FolderTree onFolderClick={selectFolder} selectedFolderId={selectedFolder?.id} />
        <NoteListSection onNoteClick={selectNote} selectedNoteId={selectedNote?.id} />
      </div>
    </div>
  );
};

export default Sidebar;

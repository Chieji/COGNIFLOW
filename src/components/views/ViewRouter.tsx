import React from 'react';
import { useStore } from '../../store';
import NoteList from '../NoteList';
import NoteEditor from '../NoteEditor';
import KnowledgeGraph from '../KnowledgeGraph';
import { AssistantChat } from '../AssistantChat';
import DevStudioView from '../DevStudioView';

export const ViewRouter: React.FC = () => {
  const { activeView, selectedNote, notes } = useStore();

  switch (activeView) {
    case 'notes':
      return selectedNote ? <NoteEditor note={selectedNote} /> : <NoteList notes={notes} />;
    case 'graph':
      return <KnowledgeGraph />;
    case 'chat':
      return <AssistantChat />;
    case 'studio':
      return <DevStudioView />;
    default:
      return <div style={{ padding: '2rem', textAlign: 'center' }}>Select a view</div>;
  }
};

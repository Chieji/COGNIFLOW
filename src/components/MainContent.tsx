import React from 'react';
import { useStore } from '../store';
import { View, Note, AiAction } from '../types';
import NoteList from './NoteList';
import NoteEditor from './NoteEditor';
import KnowledgeGraph from './KnowledgeGraph';
import { AssistantChat } from './AssistantChat';
import DevStudioView from './DevStudioView';
import { BrainCircuitIcon } from './icons';

interface MainContentProps {
  handleAiAction: (action: AiAction) => string;
}

export const MainContent: React.FC<MainContentProps> = ({ handleAiAction }) => {
  const {
    notes,
    connections,
    activeNoteId,
    activeFolderId,
    view,
    settings,
    patches,
    featureFlags,
    auditLog,
    setConnections,
    setActiveNoteId,
    deleteNote,
    updateNote,
    updateFolder,
    addFolder,
    setView,
    handlePatchStatusChange,
    handleToggleFeatureFlag,
  } = useStore();

  const activeNote = React.useMemo(() => notes.find((note) => note.id === activeNoteId), [notes, activeNoteId]);

  const filteredNotes = React.useMemo(() => {
    if (!activeFolderId || activeFolderId === 'all') return notes;
    if (activeFolderId === 'uncategorized') return notes.filter((n) => !n.folderId);
    return notes.filter((n) => n.folderId === activeFolderId);
  }, [notes, activeFolderId]);

  const onAskAI = (note: Note) => {
    setActiveNoteId(note.id);
    setView(View.Chat);
  };

  if (view === View.Notes) {
    return (
      <div className="flex flex-1 min-h-0">
        <NoteList
          notes={filteredNotes}
          activeNoteId={activeNoteId}
          setActiveNoteId={setActiveNoteId}
          deleteNote={deleteNote}
          isHiddenMobile={!!activeNote}
          folders={useStore.getState().folders}
          activeFolderId={activeFolderId}
          updateFolder={updateFolder}
          addFolder={addFolder}
        />
        <div className={`flex-1 ${!activeNote ? 'hidden md:flex' : 'flex'}`}>
          {activeNote ? (
            <NoteEditor note={activeNote} updateNote={(id, updates) => updateNote(id, updates)} settings={settings} onAskAI={onAskAI} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <BrainCircuitIcon className="w-16 h-16 mb-4 text-gray-400 dark:text-gray-500" />
              <h3 className="text-xl font-semibold">Select a note to view or edit</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Or, create a new note to start capturing your thoughts.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === View.Graph) {
    return (
      <KnowledgeGraph
        notes={notes}
        connections={connections}
        setConnections={setConnections}
        settings={settings}
        setActiveNoteId={setActiveNoteId}
        setView={setView}
      />
    );
  }

  if (view === View.Chat) {
    return <AssistantChat settings={settings} notes={notes} folders={useStore.getState().folders} onAiAction={handleAiAction} currentNote={activeNote} />;
  }

  if (view === View.DevStudio) {
    return (
      <DevStudioView
        patches={patches}
        featureFlags={featureFlags}
        auditLog={auditLog}
        onPatchStatusChange={handlePatchStatusChange}
        onToggleFeatureFlag={handleToggleFeatureFlag}
      />
    );
  }

  return null;
};

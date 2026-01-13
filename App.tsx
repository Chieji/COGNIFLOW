import React, { useEffect, useMemo } from 'react';
import { View, Note, AiAction } from './types';
import Sidebar from './components/Sidebar';
import NoteList from './components/NoteList';
import NoteEditor from './components/NoteEditor';
import KnowledgeGraph from './components/KnowledgeGraph';
import SettingsModal from './components/SettingsModal';
import { AssistantChat } from './components/AssistantChat';
import DevStudioView from './components/DevStudioView';
import { BrainCircuitIcon } from './components/icons';
import { useStore } from './store';
import { OfflineIndicator } from './components/OfflineIndicator';

const App: React.FC = () => {
  const {
    notes,
    folders,
    connections,
    activeNoteId,
    activeFolderId,
    view,
    theme,
    isSettingsOpen,
    settings,
    patches,
    featureFlags,
    auditLog,
    setNotes,
    setFolders,
    setConnections,
    setActiveNoteId,
    setActiveFolderId,
    setView,
    setTheme,
    setIsSettingsOpen,
    setSettings,
    setPatches,
    setFeatureFlags,
    setAuditLog,
    createNewNote,
    updateNote,
    deleteNote,
    addFolder,
    updateFolder,
    reorderFolders,
    handlePatchStatusChange,
    handleToggleFeatureFlag,
    initialize,
    isInitialized,
  } = useStore();


  useEffect(() => {
    if (settings.accentColor) {
      document.documentElement.style.setProperty('--user-accent-color', settings.accentColor);
    }
  }, [settings.accentColor]);

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    // Handle shared note URL on initial load
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
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleAiAction = (action: AiAction): string => {
    console.log('Executing AI Action:', action);
    switch (action.tool) {
      case 'get_note_content': {
        const { note_id } = action.args;
        const note = notes.find((n) => n.id === note_id);
        if (!note) return `Error: Note with ID '${note_id}' not found.`;
        return `Here is the content of the note titled "${note.title}":\n\n${note.content}`;
      }
      case 'set_note_metadata': {
        const { note_id, language, type } = action.args;
        const note = notes.find((n) => n.id === note_id);
        if (!note) return `Error: Note with ID '${note_id}' not found.`;
        updateNote({ ...note, language: language || note.language, type: type || note.type });
        return `Successfully updated metadata for note ${note_id}.`;
      }
      case 'create_note': {
        const { title, content, folder_id } = action.args;
        const confirmationMessage = `The AI wants to create a new note with the following details:\n\nTitle: ${title}\n\nContent:\n${content.substring(0, 200)}${content.length > 200 ? '...' : ''}\n\nDo you want to proceed?`;
        if (!window.confirm(confirmationMessage)) return 'Note creation cancelled by user.';
        if (folder_id && !folders.some((f) => f.id === folder_id)) return `Error: Folder with ID '${folder_id}' does not exist.`;
        const newNote: Note = {
          id: `note-${Date.now()}`,
          title,
          content,
          summary: '',
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          folderId: folder_id || null,
          type: 'text',
          attachments: [],
        };
        setNotes([newNote, ...notes]);
        return `Successfully created note with ID ${newNote.id}.`;
      }
      case 'create_folder': {
        const { name } = action.args;
        if (folders.some((f) => f.name === name)) return `Error: A folder named '${name}' already exists.`;
        addFolder(name);
        return `Successfully created folder.`;
      }
      case 'delete_folder': {
        const { folder_id } = action.args;
        if (!folders.some((f) => f.id === folder_id)) return `Error: Folder with ID '${folder_id}' not found.`;
        setNotes(notes.map((n) => (n.folderId === folder_id ? { ...n, folderId: null } : n)));
        setFolders(folders.filter((f) => f.id !== folder_id));
        if (activeFolderId === folder_id) setActiveFolderId('all');
        return `Successfully deleted folder ${folder_id} and moved its notes.`;
      }
      case 'update_folder_description': {
        const { folder_id, description } = action.args;
        const folder = folders.find((f) => f.id === folder_id);
        if (!folder) return `Error: Folder with ID '${folder_id}' not found.`;
        updateFolder({ ...folder, description });
        return `Successfully updated description for folder ${folder_id}.`;
      }
      case 'propose_code_patch': {
        const { title, description, code_diff, tests } = action.args;
        const newPatch: PatchProposal = {
          id: `patch-${Date.now()}`,
          title,
          description,
          codeDiff: code_diff,
          tests,
          status: 'pending',
          createdAt: new Date().toISOString(),
          modelUsed: 'gemini',
        };
        setPatches([newPatch, ...patches]);
        return `Successfully proposed a new patch. You can review it in the Dev Studio.`;
      }
      case 'update_note_title': {
        const { note_id, new_title } = action.args;
        const note = notes.find((n) => n.id === note_id);
        if (!note) return `Error: Note with ID '${note_id}' not found.`;
        updateNote({ ...note, title: new_title });
        return `Successfully updated title for note ${note_id}.`;
      }
      case 'move_note_to_folder': {
        const { note_id, folder_id } = action.args;
        if (folder_id && !folders.some((f) => f.id === folder_id)) return `Error: Folder with ID '${folder_id}' does not exist.`;
        const note = notes.find((n) => n.id === note_id);
        if (!note) return `Error: Note with ID '${note_id}' not found.`;
        updateNote({ ...note, folderId: folder_id || null });
        return `Successfully moved note.`;
      }
      case 'list_folders': {
        return `Here is a list of available folders: ${JSON.stringify(folders.map((f) => ({ id: f.id, name: f.name })))}`;
      }
      case 'update_note': {
        const { note_id, content } = action.args;
        const note = notes.find((n) => n.id === note_id);
        if (!note) return `Error: Note with ID '${note_id}' not found.`;
        updateNote({ ...note, content: note.content + '\n\n' + content });
        return `Successfully appended content to note ${note_id}.`;
      }
      case 'write_file': {
        const { note_id, content } = action.args;
        const note = notes.find((n) => n.id === note_id);
        if (!note) return `Error: Note with ID '${note_id}' not found.`;
        updateNote({ ...note, content: content });
        return `Successfully wrote content to note ${note_id}.`;
      }
      case 'cleanup_note_content': {
        const { note_id } = action.args;
        const note = notes.find((n) => n.id === note_id);
        if (!note) return `Error: Note with ID '${note_id}' not found.`;

        // For now, we'll use a simple cleanup. In a real implementation, 
        // this could call an AI service to clean up the content
        const cleanedContent = note.content
          .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();

        updateNote({ ...note, content: cleanedContent });
        return `Successfully cleaned up content for note "${note.title}".`;
      }
      case 'organize_notes_by_topic': {
        const { note_ids } = action.args;
        // This is a complex operation that would require AI analysis
        // For now, we'll create a simple organization suggestion
        return `I would need to analyze the ${note_ids.length} notes to suggest organization. This feature is under development.`;
      }
      case 'create_note_from_conversation': {
        const { title, content, tags, folder_id } = action.args;
        const confirmationMessage = `The AI wants to create a note from our conversation:\n\nTitle: ${title}\n\nContent:\n${content.substring(0, 200)}${content.length > 200 ? '...' : ''}\n\nDo you want to proceed?`;
        if (!window.confirm(confirmationMessage)) return 'Note creation cancelled by user.';

        if (folder_id && !folders.some((f) => f.id === folder_id)) return `Error: Folder with ID '${folder_id}' does not exist.`;

        const newNote: Note = {
          id: `note-${Date.now()}`,
          title,
          content,
          summary: '',
          tags: tags || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          folderId: folder_id || null,
          type: 'text',
          attachments: [],
        };
        setNotes([newNote, ...notes]);
        return `Successfully created note "${title}" from our conversation.`;
      }
      default:
        return `Error: Unknown tool '${action.tool}'.`;
    }
  };

  const onAskAI = (note: Note) => {
    setActiveNoteId(note.id);
    setView(View.Chat);
  };


  const onExport = (format: 'json' | 'markdown' | 'pdf' = 'json') => {
    if (format === 'json') {
      const data = { notes, folders, connections, settings, patches, featureFlags, auditLog };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cogniflow-export-${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'markdown') {
      let content = '# Cogniflow Export\n\n';
      notes.forEach(note => {
        content += `## ${note.title}\n\n`;
        content += `*Tags: ${note.tags.join(', ')}*\n`;
        content += `*Created: ${new Date(note.createdAt).toLocaleString()}*\n\n`;
        content += `${note.content}\n\n`;
        content += `---\n\n`;
      });
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cogniflow-export-${new Date().toISOString()}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      alert("PDF export is coming soon!");
    }
  };


  const onImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const result = event.target?.result;
          if (typeof result !== 'string') throw new Error('File could not be read.');
          const data = JSON.parse(result);
          if (!data.notes || !data.folders || !data.settings) throw new Error('Invalid Cogniflow export file format.');
          if (window.confirm('This will replace all your current data. Are you sure?')) {
            setNotes(data.notes || []);
            setFolders(data.folders || []);
            setConnections(data.connections || []);
            setSettings(data.settings || settings);
            setPatches(data.patches || []);
            setFeatureFlags(data.featureFlags || []);
            setAuditLog(data.auditLog || []);
            alert('Data imported successfully!');
          }
        } catch (error) {
          alert(`Error importing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const activeNote = useMemo(() => notes.find((note) => note.id === activeNoteId), [notes, activeNoteId]);

  const filteredNotes = useMemo(() => {
    if (!activeFolderId || activeFolderId === 'all') return notes;
    if (activeFolderId === 'uncategorized') return notes.filter((n) => !n.folderId);
    return notes.filter((n) => n.folderId === activeFolderId);
  }, [notes, activeFolderId]);

  return (
    <div className="flex h-screen w-screen bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text font-sans">
      <Sidebar
        view={view}
        setView={setView}
        theme={theme}
        setTheme={setTheme}
        createNewNote={createNewNote}
        folders={folders}
        notes={notes}
        addFolder={addFolder}
        activeFolderId={activeFolderId}
        setActiveFolderId={setActiveFolderId}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onExport={onExport}
        onImport={onImport}
        reorderFolders={reorderFolders}
      />
      <main className="flex-1 flex flex-col min-w-0">
        {view === View.Notes && (
          <div className="flex flex-1 min-h-0">
            <NoteList
              notes={filteredNotes}
              activeNoteId={activeNoteId}
              setActiveNoteId={setActiveNoteId}
              deleteNote={deleteNote}
              isHiddenMobile={!!activeNote}
              folders={folders}
              activeFolderId={activeFolderId}
              updateFolder={updateFolder}
              addFolder={addFolder}
            />
            <div className={`flex-1 ${!activeNote ? 'hidden md:flex' : 'flex'}`}>
              {activeNote ? (
                <NoteEditor note={activeNote} updateNote={updateNote} settings={settings} onAskAI={onAskAI} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <BrainCircuitIcon className="w-16 h-16 mb-4 text-gray-400 dark:text-gray-500" />
                  <h3 className="text-xl font-semibold">Select a note to view or edit</h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">Or, create a new note to start capturing your thoughts.</p>
                </div>
              )}
            </div>
          </div>
        )}
        {view === View.Graph && (
          <KnowledgeGraph
            notes={notes}
            connections={connections}
            setConnections={setConnections}
            settings={settings}
            setActiveNoteId={setActiveNoteId}
            setView={setView}
          />
        )}
        {view === View.Chat && <AssistantChat settings={settings} notes={notes} folders={folders} onAiAction={handleAiAction} currentNote={activeNote} />}
        {view === View.DevStudio && (
          <DevStudioView
            patches={patches}
            featureFlags={featureFlags}
            auditLog={auditLog}
            onPatchStatusChange={handlePatchStatusChange}
            onToggleFeatureFlag={handleToggleFeatureFlag}
          />
        )}
      </main>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={settings} onSave={setSettings} />
      <OfflineIndicator />
    </div>
  );
};

export default App;

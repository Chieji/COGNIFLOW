import { useStore } from '../store';
import { AiAction, Note, PatchProposal } from '../types';

export const handleAiAction = (action: AiAction): string => {
  const { notes, folders, patches, setNotes, setFolders, setPatches, updateNote, addFolder, updateFolder, setActiveFolderId } = useStore.getState();

  console.log('Executing AI Action:', action);
  switch (action.tool) {
    case 'get_note_content': {
      const { note_id } = action.args as { note_id: string };
      const note = notes.find((n) => n.id === note_id);
      if (!note) return `Error: Note with ID '${note_id}' not found.`;
      return `Here is the content of the note titled "${note.title}":\n\n${note.content}`;
    }
    case 'set_note_metadata': {
      const { note_id, language, type } = action.args as { note_id: string, language?: string, type?: 'text' | 'code' | 'link' };
      const note = notes.find((n) => n.id === note_id);
      if (!note) return `Error: Note with ID '${note_id}' not found.`;
      updateNote(note.id, { language: language || note.language, type: type || note.type });
      return `Successfully updated metadata for note ${note_id}.`;
    }
    case 'create_note': {
      const { title, content, folder_id } = action.args as { title: string, content: string, folder_id?: string };
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
      const { name } = action.args as { name: string };
      if (folders.some((f) => f.name === name)) return `Error: A folder named '${name}' already exists.`;
      addFolder(name);
      return `Successfully created folder.`;
    }
    case 'delete_folder': {
      const { folder_id } = action.args as { folder_id: string };
      const activeFolderId = useStore.getState().activeFolderId;
      if (!folders.some((f) => f.id === folder_id)) return `Error: Folder with ID '${folder_id}' not found.`;
      setNotes(notes.map((n) => (n.folderId === folder_id ? { ...n, folderId: null } : n)));
      setFolders(folders.filter((f) => f.id !== folder_id));
      if (activeFolderId === folder_id) setActiveFolderId('all');
      return `Successfully deleted folder ${folder_id} and moved its notes.`;
    }
    case 'update_folder_description': {
      const { folder_id, description } = action.args as { folder_id: string, description: string };
      const folder = folders.find((f) => f.id === folder_id);
      if (!folder) return `Error: Folder with ID '${folder_id}' not found.`;
      updateFolder(folder.id, { description });
      return `Successfully updated description for folder ${folder_id}.`;
    }
    case 'propose_code_patch': {
      const { title, description, code_diff, tests } = action.args as { title: string, description: string, code_diff: string, tests: string };
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
      const { note_id, new_title } = action.args as { note_id: string, new_title: string };
      const note = notes.find((n) => n.id === note_id);
      if (!note) return `Error: Note with ID '${note_id}' not found.`;
      updateNote(note.id, { title: new_title });
      return `Successfully updated title for note ${note_id}.`;
    }
    case 'move_note_to_folder': {
      const { note_id, folder_id } = action.args as { note_id: string, folder_id?: string };
      if (folder_id && !folders.some((f) => f.id === folder_id)) return `Error: Folder with ID '${folder_id}' does not exist.`;
      const note = notes.find((n) => n.id === note_id);
      if (!note) return `Error: Note with ID '${note_id}' not found.`;
      updateNote(note.id, { folderId: folder_id || null });
      return `Successfully moved note.`;
    }
    case 'list_folders': {
      return `Here is a list of available folders: ${JSON.stringify(folders.map((f) => ({ id: f.id, name: f.name })))}`;
    }
    case 'update_note': {
      const { note_id, content } = action.args as { note_id: string, content: string };
      const note = notes.find((n) => n.id === note_id);
      if (!note) return `Error: Note with ID '${note_id}' not found.`;
      updateNote(note.id, { content: note.content + '\n\n' + content });
      return `Successfully appended content to note ${note_id}.`;
    }
    case 'write_file': {
      const { note_id, content } = action.args as { note_id: string, content: string };
      const note = notes.find((n) => n.id === note_id);
      if (!note) return `Error: Note with ID '${note_id}' not found.`;
      updateNote(note.id, { content: content });
      return `Successfully wrote content to note ${note_id}.`;
    }
    case 'cleanup_note_content': {
        const { note_id } = action.args as { note_id: string };
        const note = notes.find((n) => n.id === note_id);
        if (!note) return `Error: Note with ID '${note_id}' not found.`;

        const cleanedContent = note.content
          .replace(/\n{3,}/g, '\n\n')
          .replace(/\s+/g, ' ')
          .trim();

        updateNote(note.id, { content: cleanedContent });
        return `Successfully cleaned up content for note "${note.title}".`;
    }
    case 'organize_notes_by_topic': {
        const { note_ids } = action.args as { note_ids: string[] };
        return `I would need to analyze the ${note_ids.length} notes to suggest organization. This feature is under development.`;
    }
    case 'create_note_from_conversation': {
        const { title, content, tags, folder_id } = action.args as { title: string, content: string, tags?: string[], folder_id?: string };
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
      return `Error: Unknown tool '${(action as any).tool}'.`;
  }
};

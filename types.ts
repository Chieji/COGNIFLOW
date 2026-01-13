export interface Attachment {
  id: string;
  type: 'image' | 'audio' | 'video' | 'file';
  url: string; // data URL or blob URL
  name: string;
  mimeType: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  summary: string;
  tags: string[];
  createdAt: string;
  updatedAt:string;
  folderId: string | null;
  type: 'text' | 'code' | 'link';
  language?: string;
  attachments: Attachment[];
}

export interface Folder {
  id:string;
  name: string;
  createdAt: string;
  description: string;
}

export interface Connection {
  source: string; // Note ID
  target: string; // Note ID
}

export enum View {
  Notes = 'NOTES',
  Graph = 'GRAPH',
  Chat = 'CHAT',
  DevStudio = 'DEV_STUDIO',
  Search = 'SEARCH',
  RSS = 'RSS',
  Email = 'EMAIL',
}

export type Theme = 'light' | 'dark';

export type AiProvider = 'gemini' | 'openai' | 'anthropic' | 'openrouter' | 'groq' | 'huggingface' | 'universal';

export interface AiSettings {
  tasks: {
    chat: { provider: AiProvider };
    summary: { provider: AiProvider };
    translation: { provider: AiProvider };
  };
  keys: {
    gemini: string;
    openai: string;
    anthropic: string;
    openrouter: string;
    groq: string;
    huggingface: string;
    universal: string;
  };
  huggingface: {
    modelId: string;
  };
  accentColor?: string;
  universal: {
    baseUrl: string;
    modelId: string;
  };
  accentColor?: string;
}

export interface Citation {
  uri: string;
  title: string;
}

export type PatchStatus = 'pending' | 'approved' | 'rejected';

export interface PatchProposal {
    id: string;
    title: string;
    description: string;
    codeDiff: string;
    tests: string;
    status: PatchStatus;
    createdAt: string;
    modelUsed: string;
}

export interface FeatureFlag {
    id: string;
    name: string;
    description: string;
    isEnabled: boolean;
}

export interface AuditLogEntry {
    id: string;
    patchId: string;
    timestamp: string;
    status: 'approved' | 'rejected';
}

// Represents a function the AI can call
export type AiTool = 'create_note' | 'update_note' | 'add_tags_to_note' | 'propose_code_patch' | 'create_folder' | 'update_folder_description' | 'delete_folder' | 'explain_note_connections' | 'get_note_content' | 'set_note_metadata' | 'update_note_title' | 'move_note_to_folder' | 'list_folders' | 'write_file';

// FIXED: Replaced 'any' with proper union types for all possible tool arguments
export type AiToolArgs = 
  | CreateNoteArgs
  | UpdateNoteArgs
  | AddTagsArgs
  | ProposeCodePatchArgs
  | CreateFolderArgs
  | UpdateFolderDescriptionArgs
  | DeleteFolderArgs
  | ExplainConnectionsArgs
  | GetNoteContentArgs
  | SetNoteMetadataArgs
  | UpdateNoteTitleArgs
  | MoveNoteToFolderArgs
  | ListFoldersArgs
  | WriteFileArgs;

// Define argument interfaces for each tool
export interface CreateNoteArgs {
  title: string;
  content: string;
  tags?: string[];
  folderId?: string;
  type?: 'text' | 'code' | 'link';
  language?: string;
}

export interface UpdateNoteArgs {
  noteId: string;
  title?: string;
  content?: string;
  tags?: string[];
  type?: 'text' | 'code' | 'link';
}

export interface AddTagsArgs {
  noteId: string;
  tags: string[];
}

export interface ProposeCodePatchArgs {
  title: string;
  description: string;
  codeDiff: string;
  tests?: string;
}

export interface CreateFolderArgs {
  name: string;
  description?: string;
}

export interface UpdateFolderDescriptionArgs {
  folderId: string;
  description: string;
}

export interface DeleteFolderArgs {
  folderId: string;
}

export interface ExplainConnectionsArgs {
  noteId: string;
}

export interface GetNoteContentArgs {
  noteId: string;
}

export interface SetNoteMetadataArgs {
  noteId: string;
  metadata: Record<string, string | number | boolean>;
}

export interface UpdateNoteTitleArgs {
  noteId: string;
  title: string;
}

export interface MoveNoteToFolderArgs {
  noteId: string;
  folderId: string | null;
}

export interface ListFoldersArgs {
  // No arguments needed
}

export interface WriteFileArgs {
  path: string;
  content: string;
}

// Represents an action the app should take based on AI output
export interface AiAction {
  tool: AiTool;
  args: AiToolArgs;  // FIXED: Now properly typed instead of 'any'
}

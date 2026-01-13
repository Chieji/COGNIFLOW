import Dexie, { Table } from 'dexie';
import { Note, Folder, Connection, PatchProposal, FeatureFlag, AuditLogEntry, ChatMessage } from './types';
import { NoteVersion } from './types/history';

export class CogniflowDatabase extends Dexie {
  notes!: Table<Note>;
  folders!: Table<Folder>;
  connections!: Table<Connection>;
  patches!: Table<PatchProposal>;
  featureFlags!: Table<FeatureFlag>;
  auditLog!: Table<AuditLogEntry>;
  versions!: Table<NoteVersion>;
  chatMessages!: Table<ChatMessage>;

  constructor() {
    super('CogniflowDatabase');
    this.version(2).stores({
      notes: 'id, title, folderId, createdAt, updatedAt, *tags, [folderId+updatedAt], [folderId+createdAt]',
      folders: 'id, name, createdAt, parentId',
      connections: '++id, source, target, [source+target]',
      patches: 'id, status, createdAt, [status+createdAt]',
      featureFlags: 'id, isEnabled',
      auditLog: 'id, patchId, timestamp, [patchId+timestamp]',
      versions: '++id, noteId, timestamp, [noteId+timestamp]'
    });
    this.version(3).stores({
      notes: 'id, title, folderId, createdAt, updatedAt, *tags, [folderId+updatedAt], [folderId+createdAt]',
      folders: 'id, name, createdAt, parentId',
      connections: '++id, source, target, [source+target]',
      patches: 'id, status, createdAt, [status+createdAt]',
      featureFlags: 'id, isEnabled',
      auditLog: 'id, patchId, timestamp, [patchId+timestamp]',
      versions: '++id, noteId, timestamp, [noteId+timestamp]',
      chatMessages: '++id, threadId, role, content, timestamp'
    });
  }
}

export const db = new CogniflowDatabase();

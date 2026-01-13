import Dexie, { Table } from 'dexie';
import { Note, Folder, Connection, PatchProposal, FeatureFlag, AuditLogEntry } from './types';

export class CogniflowDatabase extends Dexie {
  notes!: Table<Note>;
  folders!: Table<Folder>;
  connections!: Table<Connection>;
  patches!: Table<PatchProposal>;
  featureFlags!: Table<FeatureFlag>;
  auditLog!: Table<AuditLogEntry>;

  constructor() {
    super('CogniflowDatabase');
    this.version(1).stores({
      notes: 'id, title, folderId, createdAt, updatedAt, *tags, [folderId+updatedAt], [folderId+createdAt]',
      folders: 'id, name, createdAt, parentId',
      connections: '++id, source, target, [source+target]',
      patches: 'id, status, createdAt, [status+createdAt]',
      featureFlags: 'id, isEnabled',
      auditLog: 'id, patchId, timestamp, [patchId+timestamp]'
    });
  }
}

export const db = new CogniflowDatabase();

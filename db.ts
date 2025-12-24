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
      notes: 'id, title, folderId, createdAt, updatedAt, *tags',
      folders: 'id, name, createdAt',
      connections: '++id, source, target',
      patches: 'id, status, createdAt',
      featureFlags: 'id, isEnabled',
      auditLog: 'id, patchId, timestamp'
    });
  }
}

export const db = new CogniflowDatabase();

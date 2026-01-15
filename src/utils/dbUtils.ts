import { db } from '../db';

/**
 * Transaction wrapper with retry logic and race condition prevention
 * 
 * Usage:
 * await withTransaction(async (tx) => {
 *   const note = await tx.notes.get(noteId);
 *   note.title = 'Updated';
 *   await tx.notes.put(note);
 * });
 */
export async function withTransaction<T>(
  callback: (tx: typeof db) => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await db.transaction('rw', db.notes, db.folders, db.connections, db.patches, db.featureFlags, db.auditLog, async () => {
        return await callback(db);
      });
    } catch (error) {
      if (attempt === maxRetries - 1) {
        console.error('[DB] Transaction failed after', maxRetries, 'attempts:', error);
        throw error;
      }

      // Exponential backoff
      const delay = Math.min(100 * Math.pow(2, attempt), 2000);
      console.warn(`[DB] Transaction attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Transaction failed: max retries exceeded');
}

/**
 * Optimistic update helper - applies change immediately, rollback on error
 */
export async function optimisticUpdate<T>(
  localUpdate: () => void,
  dbUpdate: () => Promise<T>,
  rollback: () => void
): Promise<T> {
  // Apply optimistic update
  localUpdate();

  try {
    // Persist to database
    const result = await dbUpdate();
    return result;
  } catch (error) {
    // Rollback on failure
    console.error('[DB] Optimistic update failed, rolling back:', error);
    rollback();
    throw error;
  }
}

/**
 * Initialization lock to prevent race conditions during app startup
 */
let initializationPromise: Promise<void> | null = null;
let isInitialized = false;

export async function ensureInitialized(initFn: () => Promise<void>): Promise<void> {
  if (isInitialized) return;

  if (!initializationPromise) {
    initializationPromise = initFn().then(() => {
      isInitialized = true;
    });
  }

  return initializationPromise;
}

export function resetInitialization(): void {
  initializationPromise = null;
  isInitialized = false;
}

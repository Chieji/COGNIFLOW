/**
 * File System Access API Bridge
 * 
 * This utility provides a safe interface to the File System Access API,
 * allowing the Dev Studio to read and write files to the user's local filesystem.
 * 
 * Reference: https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API
 * 
 * Permissions:
 * - User must explicitly grant permission via browser dialog
 * - Permissions are persistent across sessions
 * - User can revoke permissions at any time
 */

/**
 * Represents a file handle obtained from the File System Access API
 */
export interface FileHandle {
  name: string;
  kind: 'file';
  getFile(): Promise<File>;
  createWritable(): Promise<FileSystemWritableFileStream>;
}

/**
 * Represents a directory handle
 */
export interface DirectoryHandle {
  name: string;
  kind: 'directory';
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileHandle>;
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<DirectoryHandle>;
  entries(): AsyncIterable<[string, FileHandle | DirectoryHandle]>;
  removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>;
}

/**
 * Check if the File System Access API is supported
 */
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

/**
 * Request directory access from the user
 */
export async function requestDirectoryAccess(): Promise<DirectoryHandle> {
  if (!isFileSystemAccessSupported()) {
    throw new Error('File System Access API is not supported in this browser');
  }

  try {
    const handle = await (window as any).showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'desktop',
    });
    return handle;
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw new Error('User cancelled directory selection');
    }
    throw error;
  }
}

/**
 * Read a file from the given directory
 */
export async function readFile(
  directoryHandle: DirectoryHandle,
  filePath: string
): Promise<string> {
  const parts = filePath.split('/').filter(Boolean);
  let currentHandle: any = directoryHandle;

  // Navigate to the file
  for (let i = 0; i < parts.length - 1; i++) {
    currentHandle = await currentHandle.getDirectoryHandle(parts[i]);
  }

  const fileName = parts[parts.length - 1];
  const fileHandle = await currentHandle.getFileHandle(fileName);
  const file = await fileHandle.getFile();
  return await file.text();
}

/**
 * Write a file to the given directory
 */
export async function writeFile(
  directoryHandle: DirectoryHandle,
  filePath: string,
  content: string
): Promise<void> {
  const parts = filePath.split('/').filter(Boolean);
  let currentHandle: any = directoryHandle;

  // Navigate/create directories as needed
  for (let i = 0; i < parts.length - 1; i++) {
    currentHandle = await currentHandle.getDirectoryHandle(parts[i], { create: true });
  }

  const fileName = parts[parts.length - 1];
  const fileHandle = await currentHandle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();

  await writable.write(content);
  await writable.close();
}

/**
 * Parse a unified diff format into chunks
 * 
 * Example diff:
 * --- a/src/file.ts
 * +++ b/src/file.ts
 * @@ -10,5 +10,6 @@
 *  context line
 * -removed line
 * +added line
 *  context line
 */
export interface DiffChunk {
  file: string;
  hunks: Array<{
    startLine: number;
    lineCount: number;
    newStartLine: number;
    newLineCount: number;
    lines: Array<{ type: 'context' | 'add' | 'remove'; content: string }>;
  }>;
}

export function parseDiff(diffText: string): DiffChunk[] {
  const chunks: DiffChunk[] = [];
  const lines = diffText.split('\n');
  let currentFile: string | null = null;
  let currentChunk: DiffChunk | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // File header
    if (line.startsWith('--- a/')) {
      currentFile = line.substring(6);
      currentChunk = { file: currentFile, hunks: [] };
      chunks.push(currentChunk);
    }

    // Hunk header
    if (line.startsWith('@@')) {
      const match = line.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
      if (match && currentChunk) {
        const hunk = {
          startLine: parseInt(match[1], 10),
          lineCount: parseInt(match[2] || '1', 10),
          newStartLine: parseInt(match[3], 10),
          newLineCount: parseInt(match[4] || '1', 10),
          lines: [] as Array<{ type: 'context' | 'add' | 'remove'; content: string }>,
        };

        // Parse hunk lines
        i++;
        while (i < lines.length && !lines[i].startsWith('@@') && !lines[i].startsWith('---')) {
          const hunkLine = lines[i];
          if (hunkLine.startsWith('-')) {
            hunk.lines.push({ type: 'remove', content: hunkLine.substring(1) });
          } else if (hunkLine.startsWith('+')) {
            hunk.lines.push({ type: 'add', content: hunkLine.substring(1) });
          } else if (hunkLine.startsWith(' ')) {
            hunk.lines.push({ type: 'context', content: hunkLine.substring(1) });
          }
          i++;
        }
        i--; // Back up one since the loop will increment

        if (currentChunk) {
          currentChunk.hunks.push(hunk);
        }
      }
    }
  }

  return chunks;
}

/**
 * Apply a parsed diff to a file
 */
export function applyDiffToContent(content: string, chunk: DiffChunk): string {
  const lines = content.split('\n');
  let offset = 0;

  for (const hunk of chunk.hunks) {
    const startLine = hunk.startLine - 1 + offset;
    let currentLine = startLine;
    let removeCount = 0;
    let addCount = 0;

    // Count removals and additions
    for (const diffLine of hunk.lines) {
      if (diffLine.type === 'remove') {
        removeCount++;
      } else if (diffLine.type === 'add') {
        addCount++;
      }
    }

    // Remove old lines
    lines.splice(startLine, removeCount);

    // Insert new lines
    const newLines: string[] = [];
    for (const diffLine of hunk.lines) {
      if (diffLine.type === 'add') {
        newLines.push(diffLine.content);
      }
    }

    lines.splice(startLine, 0, ...newLines);
    offset += addCount - removeCount;
  }

  return lines.join('\n');
}

/**
 * Apply a patch to files in a directory
 */
export async function applyPatch(
  directoryHandle: DirectoryHandle,
  diffText: string,
  onProgress?: (message: string) => void
): Promise<{ success: boolean; appliedFiles: string[]; errors: string[] }> {
  const chunks = parseDiff(diffText);
  const appliedFiles: string[] = [];
  const errors: string[] = [];

  for (const chunk of chunks) {
    try {
      onProgress?.(`Reading ${chunk.file}...`);
      const originalContent = await readFile(directoryHandle, chunk.file);

      onProgress?.(`Applying changes to ${chunk.file}...`);
      const newContent = applyDiffToContent(originalContent, chunk);

      onProgress?.(`Writing ${chunk.file}...`);
      await writeFile(directoryHandle, chunk.file, newContent);

      appliedFiles.push(chunk.file);
      onProgress?.(`✓ Applied changes to ${chunk.file}`);
    } catch (error) {
      const errorMsg = `Failed to apply patch to ${chunk.file}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      onProgress?.(errorMsg);
    }
  }

  return {
    success: errors.length === 0,
    appliedFiles,
    errors,
  };
}

/**
 * Create a backup of a file before modification
 */
export async function backupFile(
  directoryHandle: DirectoryHandle,
  filePath: string
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${filePath}.backup.${timestamp}`;

  try {
    const content = await readFile(directoryHandle, filePath);
    await writeFile(directoryHandle, backupPath, content);
    return backupPath;
  } catch (error) {
    throw new Error(`Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verify that a patch can be applied without errors
 */
export async function verifyPatch(
  directoryHandle: DirectoryHandle,
  diffText: string
): Promise<{ valid: boolean; errors: string[] }> {
  const chunks = parseDiff(diffText);
  const errors: string[] = [];

  for (const chunk of chunks) {
    try {
      await readFile(directoryHandle, chunk.file);
    } catch (error) {
      errors.push(`File not found: ${chunk.file}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

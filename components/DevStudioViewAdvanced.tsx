import React, { useState, useMemo } from 'react';
import { PatchProposal, FeatureFlag, AuditLogEntry, PatchStatus } from '../types';
import CodeDiffViewer from './CodeDiffViewer';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon, 
  ToggleLeftIcon, 
  ToggleRightIcon, 
  GitBranchIcon, 
  ListIcon,
  DownloadIcon,
  AlertIcon,
  RefreshIcon
} from './icons';
import { applyPatch, requestDirectoryAccess, backupFile } from '../utils/fileSystemBridge';

interface DevStudioViewAdvancedProps {
  patches: PatchProposal[];
  featureFlags: FeatureFlag[];
  auditLog: AuditLogEntry[];
  onPatchStatusChange: (patchId: string, status: 'approved' | 'rejected') => void;
  onToggleFeatureFlag: (flagId: string) => void;
  onPatchApplied?: (patchId: string) => void;
}

type DevStudioTab = 'patches' | 'flags' | 'audit' | 'history';

interface PatchHistory {
  id: string;
  patchId: string;
  appliedAt: Date;
  filePath: string;
  originalContent: string;
  newContent: string;
}

const StatusBadge: React.FC<{ status: PatchStatus }> = ({ status }) => {
  const config = {
    pending: { Icon: ClockIcon, color: 'text-yellow-400', label: 'Pending' },
    approved: { Icon: CheckCircleIcon, color: 'text-green-400', label: 'Approved' },
    rejected: { Icon: XCircleIcon, color: 'text-red-400', label: 'Rejected' },
  };
  const { Icon, color, label } = config[status];
  return (
    <span className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${color} bg-gray-500/10`}>
      <Icon className="w-4 h-4" />
      {label}
    </span>
  );
};

const DevStudioViewAdvanced: React.FC<DevStudioViewAdvancedProps> = ({
  patches,
  featureFlags,
  auditLog,
  onPatchStatusChange,
  onToggleFeatureFlag,
  onPatchApplied,
}) => {
  const [activeTab, setActiveTab] = useState<DevStudioTab>('patches');
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [patchHistory, setPatchHistory] = useState<PatchHistory[]>([]);
  const [applyingPatchId, setApplyingPatchId] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);

  const sortedPatches = useMemo(() => {
    return [...patches].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [patches]);

  const auditLogWithPatchInfo = useMemo(() => {
    return auditLog
      .map((log) => {
        const patch = patches.find((p) => p.id === log.patchId);
        return { ...log, patchTitle: patch?.title || 'Unknown Patch' };
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [auditLog, patches]);

  /**
   * Request access to the file system
   */
  const handleRequestAccess = async () => {
    try {
      const handle = await requestDirectoryAccess();
      setDirectoryHandle(handle);
      setApplySuccess('✅ Directory access granted! You can now apply patches.');
      setTimeout(() => setApplySuccess(null), 3000);
    } catch (error) {
      setApplyError(`❌ Directory access denied: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setApplyError(null), 5000);
    }
  };

  /**
   * Apply a patch to the local filesystem
   */
  const handleApplyPatch = async (patch: PatchProposal) => {
    if (!directoryHandle) {
      setApplyError('❌ No directory access. Click "Request Access" first.');
      return;
    }

    setApplyingPatchId(patch.id);
    setApplyError(null);
    setApplySuccess(null);

    try {
      // Parse the diff to extract file path and changes
      const diffLines = patch.codeDiff.split('\n');
      const filePathMatch = diffLines.find((line) => line.startsWith('--- a/') || line.startsWith('--- '));
      
      if (!filePathMatch) {
        throw new Error('Could not extract file path from diff');
      }

      const filePath = filePathMatch.replace(/^--- [ab]\//, '').trim();

      // Create a backup before applying
      await backupFile(directoryHandle, filePath);

      // Apply the patch
      const result = await applyPatch(directoryHandle, filePath, patch.codeDiff);

      if (result.success) {
        // Record in history
        const historyEntry: PatchHistory = {
          id: `${patch.id}-${Date.now()}`,
          patchId: patch.id,
          appliedAt: new Date(),
          filePath,
          originalContent: result.originalContent || '',
          newContent: result.newContent || '',
        };
        setPatchHistory((prev) => [historyEntry, ...prev]);

        // Update patch status
        onPatchStatusChange(patch.id, 'approved');
        onPatchApplied?.(patch.id);

        setApplySuccess(`✅ Patch applied successfully to ${filePath}`);
        setTimeout(() => setApplySuccess(null), 5000);
      } else {
        throw new Error(result.error || 'Failed to apply patch');
      }
    } catch (error) {
      setApplyError(`❌ Error applying patch: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setApplyError(null), 5000);
    } finally {
      setApplyingPatchId(null);
    }
  };

  /**
   * Undo a patch by restoring from history
   */
  const handleUndoPatch = async (historyEntry: PatchHistory) => {
    if (!directoryHandle) {
      setApplyError('❌ No directory access.');
      return;
    }

    try {
      // Restore the original content
      const fileHandle = await directoryHandle.getFileHandle(historyEntry.filePath);
      const writable = await fileHandle.createWritable();
      await writable.write(historyEntry.originalContent);
      await writable.close();

      // Remove from history
      setPatchHistory((prev) => prev.filter((h) => h.id !== historyEntry.id));

      setApplySuccess(`✅ Patch undone. ${historyEntry.filePath} restored.`);
      setTimeout(() => setApplySuccess(null), 3000);
    } catch (error) {
      setApplyError(`❌ Error undoing patch: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setApplyError(null), 5000);
    }
  };

  const renderPatches = () => (
    <div className="space-y-6">
      {!directoryHandle && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-start gap-3">
          <AlertIcon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-blue-300 mb-2">File System Access Required</h4>
            <p className="text-sm text-blue-200 mb-3">
              To apply patches directly to your files, you need to grant access to your project directory.
            </p>
            <button
              onClick={handleRequestAccess}
              className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors text-sm font-medium"
            >
              Request Directory Access
            </button>
          </div>
        </div>
      )}

      {sortedPatches.map((patch) => (
        <div key={patch.id} className="bg-dark-primary border border-dark-secondary rounded-lg overflow-hidden">
          <div className="p-4 bg-dark-surface">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">{patch.title}</h3>
              <StatusBadge status={patch.status} />
            </div>
            <p className="text-gray-400 text-sm mt-1">
              Proposed by <span className="font-semibold">{patch.modelUsed}</span> on{' '}
              {new Date(patch.createdAt).toLocaleString()}
            </p>
            <p className="text-gray-300 mt-3">{patch.description}</p>
          </div>

          <div className="p-4">
            <h4 className="font-semibold mb-2 text-gray-300">Code Diff Preview:</h4>
            <CodeDiffViewer diff={patch.codeDiff} />
          </div>

          <div className="p-4">
            <h4 className="font-semibold mb-2 text-gray-300">Test Plan:</h4>
            <p className="text-sm text-gray-400 whitespace-pre-wrap font-mono">{patch.tests}</p>
          </div>

          {patch.status === 'pending' && (
            <div className="p-4 bg-dark-surface border-t border-dark-secondary flex justify-end gap-4">
              <button
                onClick={() => onPatchStatusChange(patch.id, 'rejected')}
                className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
              >
                Reject
              </button>
              <button
                onClick={() => handleApplyPatch(patch)}
                disabled={!directoryHandle || applyingPatchId === patch.id}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  directoryHandle
                    ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                    : 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                }`}
              >
                {applyingPatchId === patch.id ? (
                  <>
                    <RefreshIcon className="w-4 h-4 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <DownloadIcon className="w-4 h-4" />
                    Apply Patch
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderFeatureFlags = () => (
    <div className="space-y-4">
      {featureFlags.map((flag) => (
        <div key={flag.id} className="bg-dark-primary border border-dark-secondary rounded-lg p-4 flex justify-between items-center">
          <div>
            <h3 className="font-bold">{flag.name}</h3>
            <p className="text-sm text-gray-400">{flag.description}</p>
          </div>
          <button onClick={() => onToggleFeatureFlag(flag.id)} className="flex items-center gap-2">
            {flag.isEnabled ? (
              <ToggleRightIcon className="w-10 h-10 text-green-400" />
            ) : (
              <ToggleLeftIcon className="w-10 h-10 text-gray-500" />
            )}
            <span className={`font-semibold ${flag.isEnabled ? 'text-green-400' : 'text-gray-500'}`}>
              {flag.isEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </button>
        </div>
      ))}
    </div>
  );

  const renderAuditLog = () => (
    <div className="bg-dark-primary border border-dark-secondary rounded-lg">
      <table className="w-full text-left">
        <thead className="border-b border-dark-secondary">
          <tr>
            <th className="p-4 text-sm font-semibold text-gray-400">Patch</th>
            <th className="p-4 text-sm font-semibold text-gray-400">Status</th>
            <th className="p-4 text-sm font-semibold text-gray-400">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {auditLogWithPatchInfo.map((log) => (
            <tr key={log.id} className="border-b border-dark-secondary last:border-b-0">
              <td className="p-4">{log.patchTitle}</td>
              <td className="p-4">
                <span className={`font-semibold ${log.status === 'approved' ? 'text-green-400' : 'text-red-400'}`}>
                  {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                </span>
              </td>
              <td className="p-4 text-gray-400">{new Date(log.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderPatchHistory = () => (
    <div className="space-y-4">
      {patchHistory.length === 0 ? (
        <div className="bg-dark-primary border border-dark-secondary rounded-lg p-6 text-center">
          <p className="text-gray-400">No patches applied yet. Apply a patch to see it here.</p>
        </div>
      ) : (
        patchHistory.map((entry) => (
          <div key={entry.id} className="bg-dark-primary border border-dark-secondary rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-semibold text-green-400">{entry.filePath}</h4>
                <p className="text-sm text-gray-400">Applied {new Date(entry.appliedAt).toLocaleString()}</p>
              </div>
              <button
                onClick={() => handleUndoPatch(entry)}
                className="px-3 py-1 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors text-sm"
              >
                Undo
              </button>
            </div>
            <div className="text-xs font-mono bg-dark-surface rounded p-2 max-h-32 overflow-y-auto">
              <p className="text-gray-500 mb-1">Original:</p>
              <p className="text-gray-400 whitespace-pre-wrap break-words">{entry.originalContent.substring(0, 200)}...</p>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const TABS = [
    { id: 'patches' as DevStudioTab, label: 'Patch Dashboard', Icon: GitBranchIcon },
    { id: 'flags' as DevStudioTab, label: 'Feature Flags', Icon: ToggleRightIcon },
    { id: 'history' as DevStudioTab, label: 'Patch History', Icon: RefreshIcon },
    { id: 'audit' as DevStudioTab, label: 'Audit Log', Icon: ListIcon },
  ];

  return (
    <div className="p-6 md:p-8 flex-1 flex flex-col h-full">
      <h2 className="text-3xl font-bold mb-2">Developer Studio (Advanced)</h2>
      <p className="text-gray-400 mb-6">
        Manage AI-driven evolution of COGNIFLOW. Review, preview, and apply patches with one click.
      </p>

      {applyError && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
          {applyError}
        </div>
      )}

      {applySuccess && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-300 text-sm">
          {applySuccess}
        </div>
      )}

      <div className="border-b border-dark-secondary mb-6">
        <nav className="flex space-x-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 font-medium text-sm rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-light-accent text-light-accent'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <tab.Icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        {activeTab === 'patches' && renderPatches()}
        {activeTab === 'flags' && renderFeatureFlags()}
        {activeTab === 'history' && renderPatchHistory()}
        {activeTab === 'audit' && renderAuditLog()}
      </div>
    </div>
  );
};

export default DevStudioViewAdvanced;

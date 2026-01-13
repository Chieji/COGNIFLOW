/**
 * Enhanced Dev Studio View with File System Access API Integration
 * 
 * This component extends the original DevStudioView to enable:
 * - Applying patches directly to the local filesystem
 * - Creating backups before patch application
 * - Verifying patches before execution
 * - Real-time progress tracking
 */

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
} from './icons';
import {
  isFileSystemAccessSupported,
  requestDirectoryAccess,
  applyPatch,
  backupFile,
  verifyPatch,
  type DirectoryHandle,
} from '../utils/fileSystemBridge';

interface DevStudioViewEnhancedProps {
  patches: PatchProposal[];
  featureFlags: FeatureFlag[];
  auditLog: AuditLogEntry[];
  onPatchStatusChange: (patchId: string, status: 'approved' | 'rejected') => void;
  onToggleFeatureFlag: (flagId: string) => void;
}

type DevStudioTab = 'patches' | 'flags' | 'audit';
type PatchExecutionState = 'idle' | 'verifying' | 'backing-up' | 'applying' | 'success' | 'error';

interface PatchExecutionProgress {
  state: PatchExecutionState;
  message: string;
  progress: number; // 0-100
  error?: string;
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

const DevStudioViewEnhanced: React.FC<DevStudioViewEnhancedProps> = ({
  patches,
  featureFlags,
  auditLog,
  onPatchStatusChange,
  onToggleFeatureFlag,
}) => {
  const [activeTab, setActiveTab] = useState<DevStudioTab>('patches');
  const [directoryHandle, setDirectoryHandle] = useState<DirectoryHandle | null>(null);
  const [executingPatchId, setExecutingPatchId] = useState<string | null>(null);
  const [executionProgress, setExecutionProgress] = useState<PatchExecutionProgress>({
    state: 'idle',
    message: '',
    progress: 0,
  });

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
   * Request directory access from the user
   */
  const handleRequestDirectoryAccess = async () => {
    try {
      const handle = await requestDirectoryAccess();
      setDirectoryHandle(handle);
      setExecutionProgress({
        state: 'idle',
        message: `✓ Directory access granted: ${handle.name}`,
        progress: 100,
      });
    } catch (error) {
      setExecutionProgress({
        state: 'error',
        message: 'Failed to request directory access',
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Apply a patch to the local filesystem
   */
  const handleApplyPatch = async (patch: PatchProposal) => {
    if (!directoryHandle) {
      setExecutionProgress({
        state: 'error',
        message: 'No directory selected. Please request directory access first.',
        progress: 0,
      });
      return;
    }

    setExecutingPatchId(patch.id);
    setExecutionProgress({
      state: 'verifying',
      message: 'Verifying patch...',
      progress: 10,
    });

    try {
      // Step 1: Verify the patch
      const verification = await verifyPatch(directoryHandle, patch.codeDiff);
      if (!verification.valid) {
        throw new Error(`Patch verification failed: ${verification.errors.join(', ')}`);
      }

      setExecutionProgress({
        state: 'backing-up',
        message: 'Creating backup...',
        progress: 30,
      });

      // Step 2: Create backups of affected files
      const backupPaths: string[] = [];
      const diffLines = patch.codeDiff.split('\n');
      const affectedFiles = new Set<string>();

      for (const line of diffLines) {
        if (line.startsWith('--- a/')) {
          affectedFiles.add(line.substring(6));
        }
      }

      for (const file of affectedFiles) {
        try {
          const backupPath = await backupFile(directoryHandle, file);
          backupPaths.push(backupPath);
        } catch (error) {
          console.warn(`Failed to backup ${file}:`, error);
        }
      }

      setExecutionProgress({
        state: 'applying',
        message: 'Applying patch...',
        progress: 60,
      });

      // Step 3: Apply the patch
      const result = await applyPatch(directoryHandle, patch.codeDiff, (message) => {
        setExecutionProgress((prev) => ({
          ...prev,
          message,
          progress: Math.min(prev.progress + 5, 95),
        }));
      });

      if (!result.success) {
        throw new Error(`Patch application failed: ${result.errors.join(', ')}`);
      }

      setExecutionProgress({
        state: 'success',
        message: `✓ Patch applied successfully to ${result.appliedFiles.length} file(s)`,
        progress: 100,
      });

      // Mark patch as approved
      onPatchStatusChange(patch.id, 'approved');

      // Reset after 3 seconds
      setTimeout(() => {
        setExecutingPatchId(null);
        setExecutionProgress({
          state: 'idle',
          message: '',
          progress: 0,
        });
      }, 3000);
    } catch (error) {
      setExecutionProgress({
        state: 'error',
        message: 'Patch application failed',
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      setExecutingPatchId(null);
    }
  };

  /**
   * Render the patches tab with execution controls
   */
  const renderPatches = () => (
    <div className="space-y-6">
      {/* Directory Access Control */}
      <div className="bg-dark-primary border border-dark-secondary rounded-lg p-4">
        <h3 className="font-semibold mb-3">File System Access</h3>
        {isFileSystemAccessSupported() ? (
          <div className="space-y-3">
            {directoryHandle ? (
              <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-green-400">✓ Directory Access Granted</p>
                  <p className="text-xs text-gray-400 mt-1">Working directory: {directoryHandle.name}</p>
                </div>
                <button
                  onClick={() => setDirectoryHandle(null)}
                  className="px-3 py-1 text-xs bg-red-500/20 text-red-300 rounded hover:bg-red-500/30 transition-colors"
                >
                  Revoke
                </button>
              </div>
            ) : (
              <button
                onClick={handleRequestDirectoryAccess}
                className="w-full px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors text-sm font-medium"
              >
                Request Directory Access
              </button>
            )}
          </div>
        ) : (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-xs text-yellow-300">
              ⚠ File System Access API is not supported in this browser. Patch execution is unavailable.
            </p>
          </div>
        )}
      </div>

      {/* Execution Progress */}
      {executingPatchId && (
        <div className="bg-dark-primary border border-dark-secondary rounded-lg p-4">
          <h3 className="font-semibold mb-3">Patch Execution Progress</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm">{executionProgress.message}</p>
              <span className="text-xs text-gray-400">{executionProgress.progress}%</span>
            </div>
            <div className="w-full bg-dark-secondary rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  executionProgress.state === 'error'
                    ? 'bg-red-500'
                    : executionProgress.state === 'success'
                      ? 'bg-green-500'
                      : 'bg-blue-500'
                }`}
                style={{ width: `${executionProgress.progress}%` }}
              />
            </div>
            {executionProgress.error && (
              <p className="text-xs text-red-400 mt-2">{executionProgress.error}</p>
            )}
          </div>
        </div>
      )}

      {/* Patches List */}
      {sortedPatches.map((patch) => (
        <div key={patch.id} className="bg-dark-primary border border-dark-secondary rounded-lg overflow-hidden">
          <div className="p-4 bg-dark-surface">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h3 className="font-bold text-lg">{patch.title}</h3>
                <p className="text-sm text-gray-400 mt-1">{patch.description}</p>
              </div>
              <StatusBadge status={patch.status} />
            </div>
            <p className="text-xs text-gray-500 mt-2">Model: {patch.modelUsed} | Created: {new Date(patch.createdAt).toLocaleString()}</p>
          </div>

          <div className="p-4 border-t border-dark-secondary">
            <h4 className="font-semibold text-sm mb-2">Code Diff</h4>
            <CodeDiffViewer codeDiff={patch.codeDiff} />
          </div>

          <div className="p-4 border-t border-dark-secondary">
            <h4 className="font-semibold text-sm mb-2">Tests</h4>
            <pre className="bg-dark-surface p-2 rounded text-xs overflow-x-auto text-gray-300">{patch.tests}</pre>
          </div>

          {patch.status === 'pending' && (
            <div className="p-4 border-t border-dark-secondary flex gap-2">
              {directoryHandle && isFileSystemAccessSupported() && (
                <button
                  onClick={() => handleApplyPatch(patch)}
                  disabled={executingPatchId !== null}
                  className="flex-1 px-4 py-2 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                >
                  Apply Patch
                </button>
              )}
              <button
                onClick={() => onPatchStatusChange(patch.id, 'approved')}
                className="flex-1 px-4 py-2 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-colors font-medium text-sm"
              >
                Approve
              </button>
              <button
                onClick={() => onPatchStatusChange(patch.id, 'rejected')}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors font-medium text-sm"
              >
                Reject
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
          <button
            onClick={() => onToggleFeatureFlag(flag.id)}
            className="flex items-center gap-2"
          >
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

  const TABS = [
    { id: 'patches' as DevStudioTab, label: 'Patch Dashboard', Icon: GitBranchIcon },
    { id: 'flags' as DevStudioTab, label: 'Feature Flags', Icon: ToggleRightIcon },
    { id: 'audit' as DevStudioTab, label: 'Audit Log', Icon: ListIcon },
  ];

  return (
    <div className="p-6 md:p-8 flex-1 flex flex-col h-full">
      <h2 className="text-3xl font-bold mb-2">Developer Studio</h2>
      <p className="text-gray-400 mb-6">Manage AI-driven evolution of Cogniflow. Review and approve patch proposals.</p>

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
        {activeTab === 'audit' && renderAuditLog()}
      </div>
    </div>
  );
};

export default DevStudioViewEnhanced;

import React, { useState, useMemo } from 'react';
import { PatchProposal, FeatureFlag, AuditLogEntry, PatchStatus } from '../types';
import CodeDiffViewer from './CodeDiffViewer';
import { CheckCircleIcon, XCircleIcon, ClockIcon, ToggleLeftIcon, ToggleRightIcon, GitBranchIcon, ListIcon } from './icons';

interface DevStudioViewProps {
    patches: PatchProposal[];
    featureFlags: FeatureFlag[];
    auditLog: AuditLogEntry[];
    onPatchStatusChange: (patchId: string, status: 'approved' | 'rejected') => void;
    onToggleFeatureFlag: (flagId: string) => void;
}

type DevStudioTab = 'patches' | 'flags' | 'audit';

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

const DevStudioView: React.FC<DevStudioViewProps> = ({ patches, featureFlags, auditLog, onPatchStatusChange, onToggleFeatureFlag }) => {
    const [activeTab, setActiveTab] = useState<DevStudioTab>('patches');
    
    const sortedPatches = useMemo(() => {
        return [...patches].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [patches]);
    
    const auditLogWithPatchInfo = useMemo(() => {
        return auditLog.map(log => {
            const patch = patches.find(p => p.id === log.patchId);
            return {...log, patchTitle: patch?.title || 'Unknown Patch'};
        }).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [auditLog, patches]);

    const renderPatches = () => (
        <div className="space-y-6">
            {sortedPatches.map(patch => (
                <div key={patch.id} className="bg-dark-primary border border-dark-secondary rounded-lg overflow-hidden">
                    <div className="p-4 bg-dark-surface">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold">{patch.title}</h3>
                            <StatusBadge status={patch.status} />
                        </div>
                        <p className="text-gray-400 text-sm mt-1">
                            Proposed by <span className="font-semibold">{patch.modelUsed}</span> on {new Date(patch.createdAt).toLocaleString()}
                        </p>
                        <p className="text-gray-300 mt-3">{patch.description}</p>
                    </div>
                    <div className="p-4">
                        <h4 className="font-semibold mb-2 text-gray-300">Code Diff:</h4>
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
                                onClick={() => onPatchStatusChange(patch.id, 'approved')}
                                className="px-4 py-2 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-colors"
                             >
                                 Approve
                             </button>
                         </div>
                    )}
                </div>
            ))}
        </div>
    );

    const renderFeatureFlags = () => (
        <div className="space-y-4">
            {featureFlags.map(flag => (
                <div key={flag.id} className="bg-dark-primary border border-dark-secondary rounded-lg p-4 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold">{flag.name}</h3>
                        <p className="text-sm text-gray-400">{flag.description}</p>
                    </div>
                    <button onClick={() => onToggleFeatureFlag(flag.id)} className="flex items-center gap-2">
                        {flag.isEnabled 
                            ? <ToggleRightIcon className="w-10 h-10 text-green-400" /> 
                            : <ToggleLeftIcon className="w-10 h-10 text-gray-500" />
                        }
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
                    {auditLogWithPatchInfo.map(log => (
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
                    {TABS.map(tab => (
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

export default DevStudioView;

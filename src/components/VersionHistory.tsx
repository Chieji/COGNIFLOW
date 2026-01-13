import React, { useEffect, useState } from 'react';
import { db } from '../db';
import { NoteVersion } from '../types/history';
import { HistoryIcon, RotateCcwIcon } from './icons';

interface VersionHistoryProps {
    noteId: string;
    onRestore: (content: string, title: string) => void;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({ noteId, onRestore }) => {
    const [versions, setVersions] = useState<NoteVersion[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            db.versions
                .where('noteId')
                .equals(noteId)
                .reverse()
                .sortBy('timestamp')
                .then(setVersions);
        }
    }, [noteId, isOpen]);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center text-xs text-gray-500 hover:text-blue-500 transition-colors"
                title="View History"
            >
                <HistoryIcon className="w-4 h-4 mr-1" />
                History
            </button>
        );
    }

    return (
        <div className="absolute top-12 right-4 w-80 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-primary rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
            <div className="p-3 border-b border-gray-200 dark:border-dark-primary flex justify-between items-center bg-gray-50 dark:bg-dark-secondary sticky top-0">
                <h3 className="font-semibold text-sm">Version History</h3>
                <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-2 space-y-2">
                {versions.length === 0 ? (
                    <p className="text-xs text-center text-gray-500 py-4">No previous versions</p>
                ) : (
                    versions.map((version) => (
                        <div key={version.id} className="p-3 bg-gray-50 dark:bg-dark-secondary rounded border border-gray-100 dark:border-dark-primary hover:border-blue-300 transition-colors group">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-xs text-gray-500">{new Date(version.timestamp).toLocaleString()}</span>
                                <button
                                    onClick={() => {
                                        if (window.confirm('Restore this version? Current changes will be saved as a new version.')) {
                                            onRestore(version.content, version.title);
                                            setIsOpen(false);
                                        }
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-blue-500 hover:bg-blue-100 rounded"
                                    title="Restore"
                                >
                                    <RotateCcwIcon className="w-3 h-3" />
                                </button>
                            </div>
                            <div className="text-xs font-medium mb-1 truncate">{version.title}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 font-mono bg-white dark:bg-dark-bg p-1 rounded">
                                {version.content}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

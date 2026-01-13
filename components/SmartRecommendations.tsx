import React, { useState } from 'react';
import { Note } from '../types';
import { getSmartRecommendations } from '../services/geminiService';
import { SparklesIcon, LoaderIcon } from './icons';

interface SmartRecommendationsProps {
    note: Note;
    allNotes: Note[];
    apiKey: string;
    onUpdateNote: (note: Note) => void;
    onNavigateToNote: (noteId: string) => void;
}

export const SmartRecommendations: React.FC<SmartRecommendationsProps> = ({
    note,
    allNotes,
    apiKey,
    onUpdateNote,
    onNavigateToNote
}) => {
    const [loading, setLoading] = useState(false);
    const [recommendations, setRecommendations] = useState<{
        relatedNoteIds: string[];
        suggestedTags: string[];
        nextSteps: string[];
    } | null>(null);

    const handleGetRecommendations = async () => {
        setLoading(true);
        try {
            const result = await getSmartRecommendations(note, allNotes, apiKey);
            setRecommendations(result);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const addTag = (tag: string) => {
        if (!note.tags.includes(tag)) {
            onUpdateNote({ ...note, tags: [...note.tags, tag] });
        }
    };

    return (
        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center text-gray-800 dark:text-gray-200">
                    <SparklesIcon className="w-5 h-5 mr-2 text-yellow-500" />
                    AI Recommendations
                </h3>
                <button
                    onClick={handleGetRecommendations}
                    disabled={loading}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg text-sm hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors disabled:opacity-50"
                >
                    {loading ? <LoaderIcon className="w-4 h-4 animate-spin" /> : 'Refresh'}
                </button>
            </div>

            {recommendations && (
                <div className="space-y-6">
                    {/* Suggested Tags */}
                    {recommendations.suggestedTags.length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Suggested Tags</h4>
                            <div className="flex flex-wrap gap-2">
                                {recommendations.suggestedTags.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => addTag(tag)}
                                        disabled={note.tags.includes(tag)}
                                        className={`px-3 py-1 text-xs font-medium rounded-full border transition-all ${note.tags.includes(tag)
                                                ? 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 cursor-default'
                                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 text-gray-700 dark:text-gray-300 hover:shadow-sm'
                                            }`}
                                    >
                                        {note.tags.includes(tag) ? '✓ ' : '+ '}{tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Related Notes */}
                    {recommendations.relatedNoteIds.length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Related Notes</h4>
                            <div className="space-y-2">
                                {recommendations.relatedNoteIds.map(id => {
                                    const relatedNote = allNotes.find(n => n.id === id);
                                    if (!relatedNote) return null;
                                    return (
                                        <button
                                            key={id}
                                            onClick={() => onNavigateToNote(id)}
                                            className="block w-full text-left p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-transparent hover:border-blue-100 dark:hover:border-blue-800 transition-all text-sm group"
                                        >
                                            <span className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">{relatedNote.title}</span>
                                            {relatedNote.summary && (
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{relatedNote.summary}</p>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Next Steps */}
                    {recommendations.nextSteps.length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Suggested Next Steps</h4>
                            <ul className="space-y-2">
                                {recommendations.nextSteps.map((step, i) => (
                                    <li key={i} className="text-sm text-gray-600 dark:text-gray-300 flex items-start">
                                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 mr-2 flex-shrink-0"></span>
                                        {step}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

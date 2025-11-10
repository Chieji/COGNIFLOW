import React, { useState, useMemo, useEffect } from 'react';
import { Note, Folder } from '../types';
import { TrashIcon, FileTextIcon, FileCodeIcon, LinkIcon, FolderIcon, TagIcon, ListIcon, PlusIcon } from './icons';

interface NoteListProps {
  notes: Note[];
  activeNoteId: string | null;
  setActiveNoteId: (id: string) => void;
  deleteNote: (id: string) => void;
  isHiddenMobile: boolean;
  folders: Folder[];
  activeFolderId: string | null;
  updateFolder: (folder: Folder) => void;
  addFolder: (name: string) => void;
}

type SortOption = 'date' | 'title';
type FilterOption = 'all' | 'text' | 'code' | 'link';

const NoteTypeIcon: React.FC<{type: Note['type']}> = ({type}) => {
    switch(type) {
        case 'code': return <FileCodeIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />;
        case 'link': return <LinkIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />;
        default: return <FileTextIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />;
    }
}


const NoteList: React.FC<NoteListProps> = ({ notes, activeNoteId, setActiveNoteId, deleteNote, isHiddenMobile, folders, activeFolderId, updateFolder, addFolder }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sort, setSort] = useState<SortOption>('date');
  const [filter, setFilter] = useState<FilterOption>('all');

  const activeFolder = useMemo(() => {
    if (!activeFolderId || activeFolderId === 'all' || activeFolderId === 'uncategorized') {
      return null;
    }
    return folders.find(f => f.id === activeFolderId);
  }, [folders, activeFolderId]);

  const [description, setDescription] = useState(activeFolder?.description || '');
  
  useEffect(() => {
    if(activeFolder) {
        setDescription(activeFolder.description);
    }
  }, [activeFolder]);

  useEffect(() => {
    if(!activeFolder) return;
    const handler = setTimeout(() => {
      if (activeFolder.description !== description) {
        updateFolder({ ...activeFolder, description });
      }
    }, 500); // Debounce saves

    return () => {
      clearTimeout(handler);
    };
  }, [description, activeFolder, updateFolder]);

  const filteredAndSortedNotes = useMemo(() => {
    const filtered = notes
      .filter(note => {
          const searchMatch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
              note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
          const filterMatch = filter === 'all' || note.type === filter;
          return searchMatch && filterMatch;
      });

    return filtered.sort((a, b) => {
        if (sort === 'title') {
            return a.title.localeCompare(b.title);
        }
        // default is 'date'
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [notes, searchTerm, sort, filter]);
  
  const handleDelete = (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    if(window.confirm("Are you sure you want to delete this note?")) {
        deleteNote(noteId);
    }
  };

  const handleNewFolder = () => {
    const folderName = prompt("Enter new folder name:");
    if (folderName) {
      addFolder(folderName);
    }
  };

  return (
    <div className={`w-full md:w-80 lg:w-96 border-r border-light-primary dark:border-dark-primary flex-shrink-0 flex flex-col bg-light-secondary/40 dark:bg-dark-primary/40 ${isHiddenMobile ? 'hidden' : 'flex'}`}>
      <div className="p-4 border-b border-light-primary dark:border-dark-primary">
        {activeFolder ? (
          <div className="mb-4">
            <div className="flex justify-between items-center">
                 <h2 className="text-xl font-bold flex items-center gap-2">
                    <FolderIcon className="w-6 h-6 text-gray-500" />
                    <span>{activeFolder.name}</span>
                </h2>
                <button
                    onClick={handleNewFolder}
                    className="p-1 rounded-md hover:bg-light-primary dark:hover:bg-dark-secondary"
                    title="New Folder"
                    >
                    <PlusIcon className="w-5 h-5" />
                </button>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              className="w-full text-sm mt-2 p-2 bg-transparent border border-light-primary dark:border-dark-secondary rounded-lg focus:outline-none focus:ring-1 focus:ring-light-accent resize-none"
              rows={2}
            />
          </div>
        ) : (
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    {activeFolderId === 'uncategorized' 
                        ? <><TagIcon className="w-6 h-6 text-gray-500" /><span>Uncategorized</span></>
                        : <><ListIcon className="w-6 h-6 text-gray-500" /><span>All Notes</span></>
                    }
                </h2>
                <button
                    onClick={handleNewFolder}
                    className="p-1 rounded-md hover:bg-light-primary dark:hover:bg-dark-secondary"
                    title="New Folder"
                    >
                    <PlusIcon className="w-5 h-5" />
                </button>
            </div>
        )}
        <div className="space-y-3">
            <input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 bg-light-bg dark:bg-dark-bg border border-light-primary dark:border-dark-secondary rounded-lg focus:outline-none focus:ring-1 focus:ring-light-accent"
            />
            <div className="flex gap-2">
                <select value={filter} onChange={e => setFilter(e.target.value as FilterOption)} className="w-full px-3 py-2 text-sm bg-light-bg dark:bg-dark-bg border border-light-primary dark:border-dark-secondary rounded-lg focus:outline-none focus:ring-1 focus:ring-light-accent">
                    <option value="all">All Types</option>
                    <option value="text">Text</option>
                    <option value="code">Code</option>
                    <option value="link">Link</option>
                </select>
                <select value={sort} onChange={e => setSort(e.target.value as SortOption)} className="w-full px-3 py-2 text-sm bg-light-bg dark:bg-dark-bg border border-light-primary dark:border-dark-secondary rounded-lg focus:outline-none focus:ring-1 focus:ring-light-accent">
                    <option value="date">Sort by Date</option>
                    <option value="title">Sort by Title</option>
                </select>
            </div>
        </div>
      </div>
      <ul className="overflow-y-auto flex-1 p-2">
        {filteredAndSortedNotes.map(note => (
          <li key={note.id}>
            <button
              onClick={() => setActiveNoteId(note.id)}
              className={`w-full text-left p-3 rounded-lg transition-colors mb-1 group ${
                activeNoteId === note.id ? 'bg-light-surface dark:bg-dark-surface shadow-sm' : 'hover:bg-light-surface/50 dark:hover:bg-dark-surface/50'
              }`}
            >
                <div className="flex items-start gap-3">
                    <NoteTypeIcon type={note.type} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-md text-ellipsis overflow-hidden whitespace-nowrap pr-2">{note.title}</h3>
                        <button onClick={(e) => handleDelete(e, note.id)} className="text-gray-400 hover:text-red-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {note.content.split('\n')[0] || note.summary}
                      </p>
                    </div>
                </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NoteList;

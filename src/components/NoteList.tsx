import React, { useState, useMemo, useEffect } from 'react';
import { Note, Folder } from '../types';
import { TrashIcon, FileTextIcon, FileCodeIcon, LinkIcon, FolderIcon, TagIcon, ListIcon, SearchIcon } from './icons';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';

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
        case 'code': return <FileCodeIcon className="w-4 h-4 text-blue-400" />;
        case 'link': return <LinkIcon className="w-4 h-4 text-green-400" />;
        default: return <FileTextIcon className="w-4 h-4 text-gray-400" />;
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

  return (
    <div className={`w-full md:w-80 lg:w-96 border-r border-white/5 flex-shrink-0 flex flex-col bg-dark-surface/30 backdrop-blur-md ${isHiddenMobile ? 'hidden' : 'flex'}`}>
      <Card className="m-4 mb-0 border-0 bg-transparent">
        <CardHeader className="space-y-4 pb-4">
          {activeFolder ? (
            <div>
              <div className="flex justify-between items-center mb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <FolderIcon className="w-5 h-5 text-dark-accent" />
                  <span>{activeFolder.name}</span>
                </CardTitle>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description..."
                className="w-full text-sm p-0 bg-transparent border-none focus:ring-0 text-gray-500 placeholder-gray-600 resize-none leading-relaxed"
                rows={2}
              />
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                {activeFolderId === 'uncategorized'
                  ? <><TagIcon className="w-5 h-5 text-gray-500" /><span>Uncategorized</span></>
                  : <><ListIcon className="w-5 h-5 text-gray-500" /><span>All Notes</span></>
                }
              </CardTitle>
            </div>
          )}

          <div className="space-y-3">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white/5 border-white/5 text-sm text-white placeholder-gray-500 focus-visible:ring-dark-accent/50"
              />
            </div>

            <div className="flex gap-2">
              <Select value={filter} onValueChange={(value) => setFilter(value as FilterOption)}>
                <SelectTrigger className="w-full text-xs font-medium bg-white/5 border-white/5 text-gray-400 focus:text-white">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="code">Code</SelectItem>
                  <SelectItem value="link">Link</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={(value) => setSort(value as SortOption)}>
                <SelectTrigger className="w-full text-xs font-medium bg-white/5 border-white/5 text-gray-400 focus:text-white">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

      <CardContent className="p-2">
        <div className="overflow-y-auto flex-1 space-y-1">
          {filteredAndSortedNotes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No notes found
            </div>
          ) : (
            filteredAndSortedNotes.map(note => (
              <Card
                key={note.id}
                onClick={() => setActiveNoteId(note.id)}
                className={`w-full transition-all group cursor-pointer border ${
                  activeNoteId === note.id
                    ? 'bg-white/10 border-white/5 shadow-lg'
                    : 'hover:bg-white/5 hover:border-white/5 border-transparent'
                }`}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 p-1.5 rounded-lg ${activeNoteId === note.id ? 'bg-dark-accent/20' : 'bg-white/5'}`}>
                      <NoteTypeIcon type={note.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className={`font-semibold text-sm truncate pr-2 ${activeNoteId === note.id ? 'text-white' : 'text-gray-300'}`}>
                          {note.title}
                        </h3>
                        {activeNoteId === note.id && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(e, note.id);
                            }}
                            className="text-gray-500 hover:text-red-400 transition-colors p-0.5 rounded cursor-pointer"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] font-medium">
                          {note.type}
                        </Badge>
                        <span className="text-[10px] text-gray-600 font-medium">
                          {new Date(note.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                        {note.content.split('\n')[0] || note.summary || "No content"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
    </div>
  );
};

export default NoteList;

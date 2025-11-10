import React, { useState } from 'react';
import { View, Theme, Folder, Note } from '../types';
import { EditIcon, GraphIcon, SunIcon, MoonIcon, PlusIcon, SettingsIcon, FolderIcon, ChevronDownIcon, MessageSquareIcon, DownloadIcon, StarIcon, GitBranchIcon, SearchIcon, RssIcon, MailIcon, TagIcon, ListIcon } from './icons';

interface SidebarProps {
  view: View;
  setView: (view: View) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  createNewNote: () => void;
  folders: Folder[];
  notes: Note[];
  addFolder: (name: string) => void;
  activeFolderId: string | null;
  setActiveFolderId: (id: string | null) => void;
  onOpenSettings: () => void;
  onExport: () => void;
  reorderFolders: (draggedId: string, targetId: string) => void;
}

const Logo = () => (
    <img 
        src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAACXBIWXMAACE4AAAhOAFFljFgAAAAEXRFWHRTb2Z0d2FyZQBTbmlwYXN0ZV0Xzt0AAAPJSURBVHic7dJBDQAgDAAxtI+9QY+gU70xJ4cC/7f5HwMAgP4nAQCAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAALwA0w4AAbJbT/cAAAAASUVORK5CYII=" 
        alt="Cogniflow Logo" 
        className="w-8 h-8 flex-shrink-0"
    />
);

const Sidebar: React.FC<SidebarProps> = ({ 
    view, setView, theme, setTheme, createNewNote, folders, notes, addFolder, 
    activeFolderId, setActiveFolderId, onOpenSettings, onExport, reorderFolders 
}) => {
  const [isFoldersExpanded, setIsFoldersExpanded] = useState(true);
  const [isTagsExpanded, setIsTagsExpanded] = useState(false);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const handleNewFolder = () => {
    const folderName = prompt("Enter new folder name:");
    if (folderName) {
      addFolder(folderName);
    }
  };

  const navItems = [
    { view: View.Notes, icon: EditIcon, label: 'Write' },
    { view: View.Chat, icon: MessageSquareIcon, label: 'Chat' },
    { view: View.Graph, icon: GraphIcon, label: 'Graph' },
    { view: View.Search, icon: SearchIcon, label: 'Search' },
    { view: View.DevStudio, icon: GitBranchIcon, label: 'Dev Studio' },
  ];
  
  const placeholderItems = [
    { icon: RssIcon, label: 'RSS' },
    { icon: MailIcon, label: 'Email' },
  ]

  const getNoteCount = (folderId: string | null) => {
    if (folderId === 'all' || folderId === null) return notes.length;
    if (folderId === 'uncategorized') return notes.filter(n => !n.folderId).length;
    return notes.filter(note => note.folderId === folderId).length;
  }
  
  const handleDrop = (e: React.DragEvent<HTMLLIElement>, targetId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('folderId');
    if (draggedId && draggedId !== targetId) {
        reorderFolders(draggedId, targetId);
    }
  };

  return (
    <div className="bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text flex flex-col p-3 transition-all duration-300 w-72 border-r border-light-primary dark:border-dark-primary">
      <div className="flex items-center w-full mb-4 px-2">
        <Logo />
        <h1 className="ml-2 text-xl font-bold truncate">Cogniflow</h1>
      </div>
      
      <nav className="w-full flex-1 overflow-y-auto pr-1">
        <ul>
          <li className="px-2 mb-2">
            <button 
                onClick={createNewNote}
                className="flex items-center w-full bg-light-accent text-white dark:text-dark-bg px-3 py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
                <PlusIcon className="w-5 h-5"/>
                <span className="ml-3 font-semibold">New Note</span>
            </button>
          </li>
          {navItems.map(item => (
            <li key={item.view} className="px-2">
              <button 
                onClick={() => setView(item.view)}
                className={`flex items-center w-full p-2 my-1 rounded-lg transition-colors ${ view === item.view ? 'bg-light-secondary dark:bg-dark-primary font-semibold' : 'hover:bg-light-secondary dark:hover:bg-dark-primary' }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="ml-4">{item.label}</span>
              </button>
            </li>
          ))}
           {placeholderItems.map(item => (
            <li key={item.label} className="px-2 opacity-50">
              <button 
                onClick={() => {}}
                className="flex items-center w-full p-2 my-1 rounded-lg hover:bg-light-secondary dark:hover:bg-dark-primary"
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="ml-4">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-6">
            <button onClick={() => setIsFoldersExpanded(!isFoldersExpanded)} className="flex items-center justify-between w-full p-2 rounded-lg text-sm font-semibold text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                    <FolderIcon className="w-5 h-5"/>
                    <span>Folders</span>
                </div>
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isFoldersExpanded ? '' : '-rotate-90'}`} />
            </button>
            {isFoldersExpanded && (
                <ul className="mt-1 space-y-1 text-sm">
                     <li className={`mx-2 rounded-md ${activeFolderId === 'all' || activeFolderId === null ? 'bg-light-secondary dark:bg-dark-primary font-semibold' : ''}`}>
                        <button onClick={() => setActiveFolderId('all')} className="flex items-center justify-between w-full px-2 py-1.5">
                            <span className="truncate flex items-center gap-2"><ListIcon className="w-4 h-4" /> All Notes</span>
                            <span className="text-xs text-gray-400">{getNoteCount('all')}</span>
                        </button>
                    </li>
                    <li className={`mx-2 rounded-md ${activeFolderId === 'uncategorized' ? 'bg-light-secondary dark:bg-dark-primary font-semibold' : ''}`}>
                        <button onClick={() => setActiveFolderId('uncategorized')} className="flex items-center justify-between w-full px-2 py-1.5">
                            <span className="truncate flex items-center gap-2"><TagIcon className="w-4 h-4" /> Uncategorized</span>
                            <span className="text-xs text-gray-400">{getNoteCount('uncategorized')}</span>
                        </button>
                    </li>
                    {folders.map(folder => (
                         <li 
                            key={folder.id} 
                            draggable="true"
                            onDragStart={(e) => e.dataTransfer.setData('folderId', folder.id)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDrop(e, folder.id)}
                            className={`mx-2 rounded-md cursor-grab transition-colors ${activeFolderId === folder.id ? 'bg-light-secondary dark:bg-dark-primary font-semibold' : 'hover:bg-light-secondary/50 dark:hover:bg-dark-primary/50'}`}
                        >
                            <div onClick={() => setActiveFolderId(folder.id)} className="flex items-center justify-between w-full px-2 py-1.5">
                                <span className="truncate ml-6">{folder.name}</span>
                                <span className="text-xs text-gray-400">{getNoteCount(folder.id)}</span>
                            </div>
                        </li>
                    ))}
                     <li>
                        <button onClick={handleNewFolder} className="flex items-center w-full px-4 py-1.5 text-gray-500 hover:text-light-text dark:hover:text-dark-text">
                            <PlusIcon className="w-4 h-4 mr-2" />
                            New Folder
                        </button>
                    </li>
                </ul>
            )}
        </div>
        
        <div className="mt-4">
            <button onClick={() => setIsTagsExpanded(!isTagsExpanded)} className="flex items-center justify-between w-full p-2 rounded-lg text-sm font-semibold text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                    <TagIcon className="w-5 h-5"/>
                    <span>Tags</span>
                </div>
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isTagsExpanded ? '' : '-rotate-90'}`} />
            </button>
            {isTagsExpanded && (
                 <ul className="mt-1 space-y-1 text-sm opacity-50">
                    <li className="mx-2 rounded-md">
                        <button className="flex items-center justify-between w-full px-2 py-1.5">
                            <span>notes</span>
                            <span className="text-xs text-gray-400">1</span>
                        </button>
                    </li>
                    <li className="mx-2 rounded-md">
                        <button className="flex items-center justify-between w-full px-2 py-1.5">
                            <span>popup.js</span>
                            <span className="text-xs text-gray-400">0</span>
                        </button>
                    </li>
                    <li>
                        <button className="flex items-center w-full px-4 py-1.5 text-gray-500">
                            <PlusIcon className="w-4 h-4 mr-2" />
                            New Tag
                        </button>
                    </li>
                 </ul>
            )}
        </div>

      </nav>

      <div className="w-full mt-auto text-sm">
        <button 
            onClick={onOpenSettings}
            className="flex items-center w-full p-2 my-1 rounded-lg transition-colors hover:bg-light-secondary dark:hover:bg-dark-primary"
        >
            <SettingsIcon className="w-5 h-5 flex-shrink-0" />
            <span className="ml-4 font-semibold">Settings</span>
        </button>
        <button 
          onClick={toggleTheme}
          className="flex items-center w-full p-2 my-1 rounded-lg transition-colors hover:bg-light-secondary dark:hover:bg-dark-primary"
        >
          {theme === 'light' ? <MoonIcon className="w-5 h-5 flex-shrink-0" /> : <SunIcon className="w-5 h-5 flex-shrink-0" />}
          <span className="ml-4 font-semibold">
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

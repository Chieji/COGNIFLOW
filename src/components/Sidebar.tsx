import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { View } from '../types';
import {
  EditIcon, GraphIcon, SunIcon, MoonIcon, PlusIcon, SettingsIcon,
  FolderIcon, ChevronDownIcon, MessageSquareIcon, GitBranchIcon,
  SearchIcon, ListIcon, DownloadIcon, BrainCircuitIcon
} from './icons';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useStore } from '../store';

interface SidebarProps {
  onOpenSettings: () => void;
  onExport: (format?: 'json' | 'markdown' | 'pdf') => void;
  onImport: () => void;
}

const Logo = () => (
  <div className="relative group">
    <div className="absolute inset-0 bg-dark-accent/20 blur-xl rounded-full group-hover:bg-dark-accent/40 transition-all duration-500" />
    <BrainCircuitIcon className="w-8 h-8 text-dark-accent relative z-10 transform group-hover:scale-110 transition-transform duration-300" />
  </div>
);

const Sidebar: React.FC<SidebarProps> = ({ onOpenSettings, onExport, onImport }) => {
  const {
    view, setView, theme, setTheme, createNewNote, folders, notes, addFolder,
    activeFolderId, setActiveFolderId, reorderFolders
  } = useStore();

  const [isFoldersExpanded, setIsFoldersExpanded] = useState(true);
  const { isInstallable, install } = usePWAInstall();

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
    { view: View.DevStudio, icon: GitBranchIcon, label: 'Dev' },
  ];

  const getNoteCount = (folderId: string | null) => {
    if (folderId === 'all' || folderId === null) return notes.length;
    if (folderId === 'uncategorized') return notes.filter(n => !n.folderId).length;
    return notes.filter(note => note.folderId === folderId).length;
  }

  const handleDrop = (e: React.DragEvent<HTMLElement>, targetId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('folderId');
    if (draggedId && draggedId !== targetId) {
      reorderFolders(draggedId, targetId);
    }
  };

  return (
    <motion.div 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="bg-light-surface/50 dark:bg-dark-surface/50 backdrop-blur-xl border-r border-light-primary/20 dark:border-white/5 flex flex-col w-64 h-full flex-shrink-0"
    >
      <div className="p-4 flex items-center gap-3">
        <Logo />
        <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-light-text to-light-text-secondary dark:from-white dark:to-white/60 bg-clip-text text-transparent">
          Cogniflow
        </h1>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 space-y-6">
        {/* Main Actions */}
        <div className="space-y-1">
          <button
            onClick={createNewNote}
            className="w-full flex items-center gap-3 px-3 py-2.5 bg-dark-accent hover:bg-dark-accent-hover text-white rounded-lg shadow-lg shadow-red-500/20 transition-all group"
          >
            <PlusIcon className="w-5 h-5 transition-transform group-hover:rotate-90" />
            <span className="font-medium">New Note</span>
          </button>
        </div>

        {/* Navigation */}
        <div className="space-y-0.5">
          <p className="px-3 text-xs font-medium text-light-text-secondary/50 dark:text-white/30 uppercase tracking-wider mb-2">Menu</p>
          {navItems.map(item => (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                view === item.view 
                  ? 'bg-white/10 dark:bg-white/5 text-dark-accent font-medium' 
                  : 'text-light-text-secondary dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-light-text dark:hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Folders */}
        <div className="space-y-1">
          <button 
            onClick={() => setIsFoldersExpanded(!isFoldersExpanded)}
            className="w-full flex items-center justify-between px-3 text-xs font-medium text-light-text-secondary/50 dark:text-white/30 uppercase tracking-wider hover:text-light-text dark:hover:text-white transition-colors"
          >
            <span>Folders</span>
            <ChevronDownIcon className={`w-3 h-3 transition-transform ${isFoldersExpanded ? '' : '-rotate-90'}`} />
          </button>
          
          {isFoldersExpanded && (
            <div className="space-y-0.5 mt-1">
              <button 
                onClick={() => setActiveFolderId('all')}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors ${
                   activeFolderId === 'all' ? 'bg-white/10 dark:bg-white/5 text-light-text dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-light-text dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ListIcon className="w-4 h-4 opacity-70" />
                  <span>All Notes</span>
                </div>
                <span className="text-xs opacity-50">{getNoteCount('all')}</span>
              </button>
              
              {folders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => setActiveFolderId(folder.id)}
                  onDrop={(e) => handleDrop(e as any, folder.id)}
                  onDragOver={(e) => e.preventDefault()}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    activeFolderId === folder.id ? 'bg-white/10 dark:bg-white/5 text-light-text dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-light-text dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FolderIcon className="w-4 h-4 opacity-70" />
                    <span className="truncate max-w-[120px]">{folder.name}</span>
                  </div>
                  <span className="text-xs opacity-50">{getNoteCount(folder.id)}</span>
                </button>
              ))}

              <button 
                onClick={handleNewFolder}
                className="w-full flex items-center gap-3 px-3 py-1.5 text-sm text-gray-500 dark:text-gray-500 hover:text-dark-accent transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                <span>New Folder</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-light-primary/20 dark:border-white/5 space-y-1">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <SettingsIcon className="w-4 h-4" />
          <span>Settings</span>
        </button>
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          {theme === 'light' ? <MoonIcon className="w-4 h-4" /> : <SunIcon className="w-4 h-4" />}
          <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
        </button>
        {isInstallable && (
          <button
            onClick={install}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-dark-accent hover:bg-dark-accent/10 transition-colors"
          >
            <DownloadIcon className="w-4 h-4" />
            <span>Install App</span>
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default Sidebar;

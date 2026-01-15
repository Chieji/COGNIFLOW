import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { View } from '../types';
import {
  EditIcon, GraphIcon, SunIcon, MoonIcon, PlusIcon, SettingsIcon,
  FolderIcon, ChevronDownIcon, MessageSquareIcon, GitBranchIcon,
  SearchIcon, RssIcon, MailIcon, TagIcon, ListIcon, UploadIcon, DownloadIcon
} from './icons';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useStore } from '../store';

interface SidebarProps {
  onOpenSettings: () => void;
  onExport: (format?: 'json' | 'markdown' | 'pdf') => void;
  onImport: () => void;
}

const Logo = () => (
  <motion.svg
    className="w-8 h-8 text-light-accent dark:text-dark-accent"
    viewBox="0 0 1536.000000 1024.000000"
    fill="none"
    animate={{ rotate: 360 }}
    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
  >
    {/* ... (path data omitted for brevity) ... */}
  </motion.svg>
);

const Sidebar: React.FC<SidebarProps> = ({ onOpenSettings, onExport, onImport }) => {
  const {
    view, setView, theme, setTheme, createNewNote, folders, notes, addFolder,
    activeFolderId, setActiveFolderId, reorderFolders
  } = useStore();

  const [isFoldersExpanded, setIsFoldersExpanded] = useState(true);
  const [isTagsExpanded, setIsTagsExpanded] = useState(false);
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
              <PlusIcon className="w-5 h-5" />
              <span className="ml-3 font-semibold">New Note</span>
            </button>
          </li>
          {navItems.map(item => (
            <li key={item.view} className="px-2">
              <button
                onClick={() => setView(item.view)}
                className={`flex items-center w-full p-2 my-1 rounded-lg transition-colors ${view === item.view ? 'bg-light-secondary dark:bg-dark-primary font-semibold' : 'hover:bg-light-secondary dark:hover:bg-dark-primary'}`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="ml-4">{item.label}</span>
              </button>
            </li>
          ))}
          {placeholderItems.map(item => (
            <li key={item.label} className="px-2 opacity-50">
              <button
                onClick={() => { }}
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
              <FolderIcon className="w-5 h-5" />
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
              <TagIcon className="w-5 h-5" />
              <span>Tags</span>
            </div>
            <ChevronDownIcon className={`w-5 h-5 transition-transform ${isTagsExpanded ? '' : '-rotate-90'}`} />
          </button>
          {isTagsExpanded && (
            <ul className="mt-1 space-y-1 text-sm opacity-50">
              {/* ... (tag list placeholder) ... */}
            </ul>
          )}
        </div>
      </nav>

      <div className="w-full mt-auto text-sm">
        <button
          onClick={onImport}
          className="flex items-center w-full p-2 my-1 rounded-lg transition-colors hover:bg-light-secondary dark:hover:bg-dark-primary"
        >
          <UploadIcon className="w-5 h-5 flex-shrink-0" />
          <span className="ml-4 font-semibold">Import Data</span>
        </button>
        <div className="relative group">
          <button
            onClick={() => onExport()}
            className="flex items-center w-full p-2 my-1 rounded-lg transition-colors hover:bg-light-secondary dark:hover:bg-dark-primary"
          >
            <DownloadIcon className="w-5 h-5 flex-shrink-0" />
            <span className="ml-4 font-semibold">Export Data</span>
          </button>
          <div className="absolute left-full bottom-0 ml-2 w-32 bg-white dark:bg-dark-secondary rounded-lg shadow-lg hidden group-hover:block border border-gray-200 dark:border-gray-700 p-1">
            <button onClick={() => onExport('json')} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded">JSON (Backup)</button>
            <button onClick={() => onExport('markdown')} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded">Markdown</button>
          </div>
        </div>
        {isInstallable && (
          <button
            onClick={install}
            className="flex items-center w-full p-2 my-1 rounded-lg transition-colors hover:bg-light-secondary dark:hover:bg-dark-primary"
          >
            <DownloadIcon className="w-5 h-5 flex-shrink-0" />
            <span className="ml-4 font-semibold">Install App</span>
          </button>
        )}
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

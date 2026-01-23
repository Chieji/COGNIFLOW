import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { View } from '../types';
import {
  EditIcon, GraphIcon, SunIcon, MoonIcon, PlusIcon, SettingsIcon,
  FolderIcon, ChevronDownIcon, MessageSquareIcon, GitBranchIcon,
  SearchIcon, ListIcon, DownloadIcon, BrainCircuitIcon,
  MoreVerticalIcon, LogoutIcon, UserIcon
} from './icons';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useStore } from '../store';
import { Card, CardContent, CardHeader } from './ui/card';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface SidebarEnhancedProps {
  onOpenSettings: () => void;
  onExport: (format?: 'json' | 'markdown' | 'pdf') => void;
  onImport: () => void;
}

const Logo: React.FC = () => (
  <div className="relative group flex items-center gap-3">
    <div className="relative">
      <img
        src="/logo.svg"
        alt="Cogniflow Logo"
        className="w-10 h-10 transition-transform group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full group-hover:bg-blue-500/30 transition-all duration-500" />
    </div>
    <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-white/60 bg-clip-text text-transparent">
      Cogniflow
    </h1>
  </div>
);

const SidebarEnhanced: React.FC<SidebarEnhancedProps> = ({ onOpenSettings, onExport, onImport }) => {
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
  };

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
      className="w-64 h-full flex-shrink-0 flex flex-col bg-card border-r"
    >
      <Card className="m-0 rounded-none border-0 shadow-none">
        <CardHeader className="p-4 pb-3">
          <Logo />
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden px-2 py-0">
          <nav className="flex flex-col h-full space-y-4">
            <div className="space-y-1">
              <button
                onClick={createNewNote}
                className="w-full flex items-center gap-3 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg shadow-lg shadow-blue-500/20 transition-all group"
              >
                <PlusIcon className="w-5 h-5 transition-transform group-hover:rotate-90" />
                <span className="font-medium">New Note</span>
              </button>
            </div>

            <Separator />

            <div className="space-y-0.5">
              <p className="px-3 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider mb-2">Menu</p>
              {navItems.map(item => (
                <button
                  key={item.view}
                  onClick={() => setView(item.view)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                    view === item.view
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            <Separator />

            <div className="space-y-1">
              <button
                onClick={() => setIsFoldersExpanded(!isFoldersExpanded)}
                className="w-full flex items-center justify-between px-3 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider hover:text-foreground transition-colors"
              >
                <span>Folders</span>
                <ChevronDownIcon className={`w-3 h-3 transition-transform ${isFoldersExpanded ? '' : '-rotate-90'}`} />
              </button>

              {isFoldersExpanded && (
                <div className="space-y-0.5 mt-1">
                  <button
                    onClick={() => setActiveFolderId('all')}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors ${
                       activeFolderId === 'all' ? 'bg-muted text-foreground' : 'text-muted-foreground/70 hover:text-foreground hover:bg-muted/50'
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
                        activeFolderId === folder.id ? 'bg-muted text-foreground' : 'text-muted-foreground/70 hover:text-foreground hover:bg-muted/50'
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
                    className="w-full flex items-center gap-3 px-3 py-1.5 text-sm text-muted-foreground/70 hover:text-blue-600 transition-colors"
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span>New Folder</span>
                  </button>
                </div>
              )}
            </div>
          </nav>
        </CardContent>

        <Separator />

        <div className="p-3 space-y-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
                <SettingsIcon className="w-4 h-4" />
                <span>Settings</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={onOpenSettings}>
                <SettingsIcon className="w-4 h-4 mr-2" />
                Preferences
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onExport('json')}>
                <DownloadIcon className="w-4 h-4 mr-2" />
                Export Notes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onImport}>
                <DownloadIcon className="w-4 h-4 mr-2 rotate-180" />
                Import Notes
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-muted-foreground">
            <div className="flex items-center gap-3">
              {theme === 'light' ? <MoonIcon className="w-4 h-4" /> : <SunIcon className="w-4 h-4" />}
              <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
            </div>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={toggleTheme}
            />
          </div>

          {isInstallable && (
            <button
              onClick={install}
              className="w-full flex items-center justify-center gap-3 px-3 py-2 rounded-lg text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
            >
              <DownloadIcon className="w-4 h-4" />
              <span>Install App</span>
            </button>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default SidebarEnhanced;

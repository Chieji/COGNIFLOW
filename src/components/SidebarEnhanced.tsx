/**
 * COGNIFLOW Enhanced Sidebar Component
 * Enterprise-grade sidebar with Shadcn UI components
 * 
 * Features:
 * - Professional navigation with hover states
 * - Collapsible folder management
 * - Theme toggle with smooth transitions
 * - PWA install prompt
 * - Responsive design
 * 
 * @version 2.0.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { View } from '../types';
import {
  EditIcon, GraphIcon, SunIcon, MoonIcon, PlusIcon, SettingsIcon,
  FolderIcon, ChevronDownIcon, MessageSquareIcon, GitBranchIcon,
  SearchIcon, DownloadIcon, ChevronRightIcon, MoreVerticalIcon
} from './icons';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useStore } from '../store';

interface SidebarProps {
  onOpenSettings: () => void;
  onExport: (format?: 'json' | 'markdown' | 'pdf') => void;
  onImport: () => void;
}

/**
 * Enhanced Logo Component with gradient background
 */
const Logo = () => (
  <div className="relative group flex-shrink-0">
    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-xl rounded-full group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-all duration-500" />
    <img 
      src="/cogniflow-icon.png" 
      alt="Cogniflow Logo" 
      className="w-10 h-10 relative z-10 transform group-hover:scale-110 transition-transform duration-300 rounded-lg shadow-lg"
    />
  </div>
);

/**
 * Navigation Item Component
 */
interface NavItemProps {
  view: View;
  currentView: View;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ view, currentView, icon: Icon, label, onClick }) => {
  const isActive = currentView === view;
  
  return (
    <motion.button
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
        isActive 
          ? 'bg-primary text-primary-foreground shadow-md' 
          : 'hover:bg-accent hover:text-accent-foreground text-muted-foreground'
      )}
    >
      {/* Active indicator */}
      {isActive && (
        <motion.div
          layoutId="activeNav"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-foreground rounded-r-full"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
      
      <Icon className={cn(
        'w-5 h-5 transition-transform',
        isActive && 'scale-110'
      )} />
      <span className="font-medium">{label}</span>
      
      {/* Hover indicator */}
      {!isActive && (
        <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRightIcon className="w-4 h-4" />
        </div>
      )}
    </motion.button>
  );
};

/**
 * Folder Item Component
 */
interface FolderItemProps {
  id: string;
  name: string;
  count: number;
  isActive: boolean;
  onSelect: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

const FolderItem: React.FC<FolderItemProps> = ({
  id,
  name,
  count,
  isActive,
  onSelect,
  onDragStart,
  onDrop
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      draggable
      onDragStart={onDragStart}
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
      className={cn(
        'flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-all',
        isActive 
          ? 'bg-accent text-accent-foreground' 
          : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground'
      )}
      onClick={onSelect}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <FolderIcon className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm font-medium truncate">{name}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn(
          'text-xs px-2 py-0.5 rounded-full',
          isActive 
            ? 'bg-background text-foreground' 
            : 'bg-muted text-muted-foreground'
        )}>
          {count}
        </span>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded">
          <MoreVerticalIcon className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
};

/**
 * Main Sidebar Component
 */
const SidebarEnhanced: React.FC<SidebarProps> = ({ onOpenSettings, onExport, onImport }) => {
  const {
    view, setView, theme, setTheme, createNewNote, folders, notes, addFolder,
    activeFolderId, setActiveFolderId, reorderFolders
  } = useStore();

  const [isFoldersExpanded, setIsFoldersExpanded] = useState(true);
  const { isInstallable, install } = usePWAInstall();

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const handleNewFolder = () => {
    const folderName = prompt("Enter new folder name:");
    if (folderName?.trim()) {
      addFolder(folderName.trim());
    }
  };

  const navItems = [
    { view: View.Notes, icon: EditIcon, label: 'Notes' },
    { view: View.Chat, icon: MessageSquareIcon, label: 'AI Chat' },
    { view: View.Graph, icon: GraphIcon, label: 'Knowledge Graph' },
    { view: View.Search, icon: SearchIcon, label: 'Search' },
    { view: View.DevStudio, icon: GitBranchIcon, label: 'Dev Studio' },
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
      className="bg-card border-r border-border flex flex-col w-64 h-full flex-shrink-0 shadow-sm"
    >
      {/* Header with Logo and Brand */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <Logo />
          <div className="flex-1">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Cogniflow
            </h1>
            <p className="text-xs text-muted-foreground">AI Knowledge Studio</p>
          </div>
        </div>

        {/* New Note Button */}
        <Button 
          onClick={createNewNote}
          className="w-full gap-2 shadow-md"
          size="default"
        >
          <PlusIcon className="w-4 h-4" />
          <span>New Note</span>
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Main Navigation */}
        <div className="space-y-1">
          <h2 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Navigation
          </h2>
          {navItems.map((item) => (
            <NavItem
              key={item.view}
              view={item.view}
              currentView={view}
              icon={item.icon}
              label={item.label}
              onClick={() => setView(item.view)}
            />
          ))}
        </div>

        {/* Folders Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-3">
            <button
              onClick={() => setIsFoldersExpanded(!isFoldersExpanded)}
              className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors group"
            >
              <motion.div
                animate={{ rotate: isFoldersExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRightIcon className="w-3 h-3" />
              </motion.div>
              <span>Folders</span>
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                {folders.length}
              </span>
            </button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNewFolder}
              className="h-6 w-6"
            >
              <PlusIcon className="w-3 h-3" />
            </Button>
          </div>

          <AnimatePresence>
            {isFoldersExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-1 overflow-hidden"
              >
                {/* All Notes */}
                <FolderItem
                  id="all"
                  name="All Notes"
                  count={getNoteCount('all')}
                  isActive={activeFolderId === 'all'}
                  onSelect={() => setActiveFolderId('all')}
                  onDragStart={() => {}}
                  onDrop={() => {}}
                />

                {/* User Folders */}
                {folders.map((folder) => (
                  <FolderItem
                    key={folder.id}
                    id={folder.id}
                    name={folder.name}
                    count={getNoteCount(folder.id)}
                    isActive={activeFolderId === folder.id}
                    onSelect={() => setActiveFolderId(folder.id)}
                    onDragStart={(e) => e.dataTransfer.setData('folderId', folder.id)}
                    onDrop={(e) => handleDrop(e, folder.id)}
                  />
                ))}

                {/* Uncategorized */}
                <FolderItem
                  id="uncategorized"
                  name="Uncategorized"
                  count={getNoteCount('uncategorized')}
                  isActive={activeFolderId === 'uncategorized'}
                  onSelect={() => setActiveFolderId('uncategorized')}
                  onDragStart={() => {}}
                  onDrop={() => {}}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Footer Actions */}
      <div className="p-3 border-t border-border space-y-2">
        {/* PWA Install */}
        {isInstallable && (
          <Button
            variant="outline"
            size="sm"
            onClick={install}
            className="w-full gap-2"
          >
            <DownloadIcon className="w-4 h-4" />
            <span>Install App</span>
          </Button>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="flex-1"
          >
            {theme === 'light' ? (
              <MoonIcon className="w-4 h-4" />
            ) : (
              <SunIcon className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSettings}
            className="flex-1"
          >
            <SettingsIcon className="w-4 h-4" />
          </Button>
        </div>

        {/* User Info (Optional) */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-sm font-semibold">
              U
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">User</p>
              <p className="text-xs text-muted-foreground truncate">Free Plan</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SidebarEnhanced;

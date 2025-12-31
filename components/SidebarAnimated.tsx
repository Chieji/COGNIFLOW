import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { View, Theme, Folder, Note } from '../types';
import { 
  EditIcon, GraphIcon, SunIcon, MoonIcon, PlusIcon, SettingsIcon, 
  FolderIcon, ChevronDownIcon, MessageSquareIcon, GitBranchIcon, 
  SearchIcon, XIcon 
} from './icons';

interface SidebarAnimatedProps {
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
  onImport: () => void;
  reorderFolders: (draggedId: string, targetId: string) => void;
}

const Logo = () => (
  <motion.svg 
    className="w-8 h-8 text-light-accent dark:text-dark-accent" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    animate={{ rotate: 360 }}
    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
  >
    <path d="M12 2a10 10 0 1 0 10 10" />
    <path d="M12 2a10 10 0 1 0-5.5 18.33" />
    <path d="M12 2a10 10 0 1 1-5.5 18.33" />
    <path d="M2 12a10 10 0 1 1 10 10" />
    <path d="M2 12a10 10 0 1 0 10-10" />
    <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
  </motion.svg>
);

const SidebarAnimated: React.FC<SidebarAnimatedProps> = ({
  view,
  setView,
  theme,
  setTheme,
  createNewNote,
  folders,
  notes,
  addFolder,
  activeFolderId,
  setActiveFolderId,
  onOpenSettings,
  onExport,
  onImport,
  reorderFolders,
}) => {
  const [isFoldersExpanded, setIsFoldersExpanded] = useState(true);
  const [isTagsExpanded, setIsTagsExpanded] = useState(false);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const handleNewFolder = () => {
    const folderName = prompt('Enter new folder name:');
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

  const getNoteCount = (folderId: string | null) => {
    if (folderId === 'all' || folderId === null) return notes.length;
    if (folderId === 'uncategorized') return notes.filter((n) => !n.folderId).length;
    return notes.filter((note) => note.folderId === folderId).length;
  };

  const handleDrop = (e: React.DragEvent<HTMLLIElement>, targetId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('folderId');
    if (draggedId && draggedId !== targetId) {
      reorderFolders(draggedId, targetId);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { type: 'spring', stiffness: 100, damping: 15 },
    },
  };

  const buttonHoverVariants = {
    hover: {
      x: 4,
      boxShadow: '0 0 20px rgba(0, 217, 255, 0.3)',
    },
  };

  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className="glass-dark flex flex-col p-3 w-72 border-r border-dark-secondary overflow-hidden"
    >
      {/* Header */}
      <motion.div
        className="flex items-center w-full mb-6 px-2"
        variants={itemVariants}
      >
        <Logo />
        <motion.span
          className="ml-3 text-lg font-bold text-gradient"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          COGNIFLOW
        </motion.span>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        className="flex gap-2 mb-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.button
          onClick={createNewNote}
          variants={itemVariants}
          whileHover="hover"
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-accent hover:bg-cyan-500/20 text-dark-accent transition-all"
        >
          <PlusIcon className="w-4 h-4" />
          <span className="text-sm">New</span>
        </motion.button>

        <motion.button
          onClick={toggleTheme}
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-3 py-2 rounded-lg bg-dark-primary hover:bg-dark-secondary transition-colors"
        >
          {theme === 'dark' ? (
            <SunIcon className="w-4 h-4 text-yellow-400" />
          ) : (
            <MoonIcon className="w-4 h-4 text-blue-400" />
          )}
        </motion.button>

        <motion.button
          onClick={onOpenSettings}
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-3 py-2 rounded-lg bg-dark-primary hover:bg-dark-secondary transition-colors"
        >
          <SettingsIcon className="w-4 h-4" />
        </motion.button>
      </motion.div>

      {/* Navigation */}
      <motion.nav
        className="space-y-1 mb-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {navItems.map((item) => (
          <motion.button
            key={item.view}
            onClick={() => setView(item.view)}
            variants={itemVariants}
            whileHover="hover"
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
              view === item.view
                ? 'bg-gradient-accent text-dark-bg font-semibold'
                : 'text-dark-text-secondary hover:text-dark-accent'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-sm">{item.label}</span>
          </motion.button>
        ))}
      </motion.nav>

      {/* Folders Section */}
      <motion.div
        className="flex-1 overflow-y-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.button
          onClick={() => setIsFoldersExpanded(!isFoldersExpanded)}
          className="w-full flex items-center justify-between px-2 py-2 text-sm font-semibold text-dark-text-secondary hover:text-dark-accent transition-colors"
          variants={itemVariants}
        >
          <span className="flex items-center gap-2">
            <FolderIcon className="w-4 h-4" />
            Folders
          </span>
          <motion.div
            animate={{ rotate: isFoldersExpanded ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <ChevronDownIcon className="w-4 h-4" />
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {isFoldersExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
              className="space-y-1"
            >
              {folders.map((folder, index) => (
                <motion.li
                  key={folder.id}
                  onClick={() => setActiveFolderId(folder.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, folder.id)}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('folderId', folder.id)}
                  variants={itemVariants}
                  whileHover="hover"
                  className={`list-none px-3 py-2 rounded-lg cursor-pointer transition-all ${
                    activeFolderId === folder.id
                      ? 'bg-dark-accent/20 text-dark-accent font-semibold'
                      : 'text-dark-text-secondary hover:text-dark-accent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm truncate">{folder.name}</span>
                    <motion.span
                      className="text-xs px-2 py-0.5 rounded-full bg-dark-secondary/50"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {getNoteCount(folder.id)}
                    </motion.span>
                  </div>
                </motion.li>
              ))}

              <motion.button
                onClick={handleNewFolder}
                variants={itemVariants}
                whileHover={{ x: 4 }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-dark-accent hover:bg-dark-primary/50 rounded-lg transition-all"
              >
                <PlusIcon className="w-4 h-4" />
                New Folder
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Footer */}
      <motion.div
        className="flex gap-2 pt-4 border-t border-dark-secondary"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.button
          onClick={onExport}
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex-1 px-2 py-2 text-xs rounded-lg bg-dark-primary hover:bg-dark-secondary transition-colors"
        >
          Export
        </motion.button>
        <motion.button
          onClick={onImport}
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex-1 px-2 py-2 text-xs rounded-lg bg-dark-primary hover:bg-dark-secondary transition-colors"
        >
          Import
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default SidebarAnimated;

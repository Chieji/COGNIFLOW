import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { View, Theme, Folder, Note } from '../types';
import {
  EditIcon, GraphIcon, SunIcon, MoonIcon, PlusIcon, SettingsIcon,
  FolderIcon, ChevronDownIcon, MessageSquareIcon, GitBranchIcon,
  SearchIcon, RssIcon, MailIcon, TagIcon, ListIcon, UploadIcon, DownloadIcon
} from './icons';
import { usePWAInstall } from '../hooks/usePWAInstall';

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
  onExport: (format?: 'json' | 'markdown' | 'pdf') => void;
  onImport: () => void;
  reorderFolders: (draggedId: string, targetId: string) => void;
}

const Logo = () => (
  <motion.svg
    className="w-8 h-8 text-light-accent dark:text-dark-accent"
    viewBox="0 0 1536.000000 1024.000000"
    fill="none"
    animate={{ rotate: 360 }}
    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
  >
    <path d="M0 5120 l0 -5120 7680 0 7680 0 0 5120 0 5120 -7680 0 -7680 0 0 -5120z m3177 2104 c354 -52 694 -239 895 -492 76 -96 99 -133 160 -255 42 -84 55 -101 86 -115 233 -106 392 -372 354 -593 l-12 -70 44 -62 c128 -181 182 -416 142 -616 -27 -131 -72 -218 -168 -326 l-45 -50 -5 -100 c-6 -114 -27 -183 -83 -275 -54 -89 -136 -173 -230 -235 -156 -104 -304 -156 -515 -180 -74 -8 -144 -17 -156 -21 -44 -12 -54 17 -54 148 l0 120 70 105 70 106 -21 33 c-16 26 -20 48 -18 95 3 68 5 65 -112 160 l-45 37 -13 173 c-7 96 -15 187 -18 202 -5 25 -24 37 -153 102 -81 41 -158 75 -171 77 -33 4 -274 -241 -265 -269 8 -23 255 -276 365 -373 l84 -74 -7 -185 c-3 -102 -9 -303 -12 -447 -7 -285 -11 -263 55 -307 52 -34 70 -65 77 -132 5 -58 4 -62 -33 -110 -48 -62 -73 -75 -148 -75 -59 0 -59 0 -112 56 l-53 56 0 70 0 71 50 50 51 50 9 351 c6 193 11 369 12 391 6 132 9 126 -109 224 -115 95 -303 290 -342 354 -22 36 -23 41 -9 70 9 18 76 95 151 173 l136 140 -5 45 c-3 24 -12 101 -21 172 l-16 127 -36 0 c-43 0 -140 -48 -327 -161 -106 -64 -135 -87 -153 -119 -13 -23 -35 -52 -49 -65 l-26 -25 26 -80 26 -80 -38 -58 c-21 -31 -52 -70 -69 -86 l-30 -29 -118 14 -118 14 -17 35 c-9 19 -27 69 -39 112 l-22 76 59 82 59 82 70 -6 c38 -4 88 -9 111 -12 35 -5 42 -3 52 18 52 102 90 138 247 231 192 115 233 136 296 151 119 27 115 23 127 122 13 95 19 106 119 215 51 54 163 139 185 139 13 0 9 53 -9 137 l-17 77 68 61 c101 93 100 93 212 66 l96 -23 18 -44 c20 -45 60 -174 60 -191 0 -11 -77 -113 -95 -125 -5 -4 -25 -8 -43 -8 -18 0 -56 -8 -86 -19 -46 -16 -56 -17 -79 -4 -24 12 -31 11 -69 -8 -39 -20 -252 -209 -244 -216 2 -2 -5 -42 -14 -90 l-18 -86 82 6 c353 27 391 34 567 105 24 9 27 17 31 72 4 57 8 64 49 105 59 59 118 76 182 51 97 -37 137 -95 137 -199 0 -61 -1 -64 -43 -105 -72 -70 -148 -80 -234 -31 l-54 31 -58 -26 c-32 -14 -66 -26 -75 -26 -9 0 -16 -3 -16 -7 1 -24 54 -102 115 -169 86 -93 101 -122 110 -199 7 -55 26 -95 46 -95 5 0 15 15 22 33 19 44 39 59 134 102 l82 37 43 -34 c24 -19 60 -45 81 -57 59 -36 70 -59 65 -143 -4 -65 -9 -80 -48 -143 -25 -38 -48 -72 -52 -75 -7 -5 -219 -3 -223 2 -25 35 -101 126 -113 136 -25 19 -50 15 -198 -32 -77 -25 -148 -46 -159 -48 -13 -3 -19 -10 -17 -23 1 -11 8 -82 14 -158 l11 -138 39 -27 c22 -15 52 -37 66 -48 26 -21 29 -21 58 -5 17 9 45 26 64 38 31 20 35 21 84 6 54 -16 125 -53 144 -75 9 -12 52 -184 52 -211 0 -20 -142 -155 -169 -160 -15 -3 -56 1 -91 9 -72 16 -82 12 -122 -55 -12 -20 -30 -46 -40 -58 -13 -14 -22 -42 -25 -84 l-6 -62 79 7 c238 21 459 119 598 266 111 118 153 229 143 380 l-6 89 34 21 c67 41 159 181 190 289 60 203 -10 451 -176 626 l-48 51 27 54 c85 172 -27 393 -258 509 l-91 46 -39 93 c-56 132 -118 221 -240 344 -193 192 -401 302 -690 364 -119 25 -373 26 -490 1 -299 -64 -552 -199 -760 -407 -213 -213 -356 -467 -421 -750 -26 -111 -36 -362 -20 -485 16 -120 70 -281 128 -385 64 -114 201 -252 293 -297 129 -62 201 -78 345 -78 100 0 142 4 182 18 29 10 62 16 73 12 38 -12 373 -288 456 -375 44 -47 85 -94 91 -105 7 -13 8 -53 2 -120 -12 -141 -15 -355 -5 -388 7 -23 4 -33 -14 -53 -31 -32 -70 -31 -104 2 -29 30 -32 48 -11 84 10 18 14 59 15 140 0 63 5 157 10 208 l10 94 -100 95 c-83 79 -196 174 -328 277 -22 18 -30 18 -81 7 -166 -37 -272 -34 -431 10 -122 -28 -239 -70 -343 -128 -49 -27 -95 -61 -107 -74 -7 -8 -8 -42 -4 -90 4 -42 10 -82 14 -87 3 -5 24 -8 46 -8 22 0 43 -3 46 -7 3 -3 -5 -37 -17 -75 -12 -38 -27 -85 -33 -103 l-10 -30 -37 0 -37 0 -23 78 c-12 43 -28 97 -35 119 -7 22 -16 40 -20 40 -4 0 -8 -43 -8 -95z m2761 23 c9 -40 19 -88 22 -107 9 -43 15 -30 44 87 22 89 23 92 51 92 25 0 30 -5 40 -42 50 -190 48 -187 69 -88 28 129 28 130 60 130 17 0 30 -5 30 -10 0 -6 -16 -76 -36 -156 l-37 -145 -35 3 -36 3 -27 105 -27 105 -10 -40 c-6 -22 -19 -70 -28 -107 -18 -66 -19 -68 -51 -68 -29 0 -33 4 -42 38 -31 119 -62 239 -67 255 -4 14 1 17 29 17 l35 0 19 -90z m-3540 -55 c-1 -28 -1 -28 -82 -31 l-82 -3 0 31 0 30 83 0 83 0 -2 -27z m4156 -488 c26 -32 -13 -81 -47 -59 -35 22 -23 74 17 74 10 0 23 -7 30 -15z m-5090 -210 l0 -215 -30 0 c-21 0 -30 5 -30 17 0 15 -1 15 -19 -1 -31 -28 -85 -31 -124 -7 -81 50 -90 206 -16 277 37 36 104 41 138 10 l21 -19 0 76 0 77 30 0 30 0 0 -215z m457 187 c108 -56 127 -271 32 -359 -37 -33 -73 -43 -163 -43 l-83 0 -1 207 c0 114 2 212 5 217 11 16 166 0 210 -22z m1153 -187 l0 -215 -35 0 -35 0 0 215 0 215 35 0 35 0 0 -215z m2441 176 c22 -21 39 -43 39 -48 0 -5 -12 -15 -26 -21 -23 -11 -28 -9 -50 18 -46 53 -134 33 -134 -30 0 -35 10 -42 92 -69 86 -28 118 -63 118 -128 0 -38 -5 -50 -33 -78 -69 -69 -215 -54 -257 25 -8 16 -6 22 14 35 23 15 25 14 54 -15 53 -53 152 -34 152 29 0 37 -23 56 -95 76 -79 23 -115 59 -115 115 0 87 47 129 144 130 55 0 61 -2 97 -39z m899 -176 l0 -215 -30 0 c-20 0 -30 5 -30 15 0 20 -5 19 -40 -6 -22 -17 -37 -20 -66 -16 -69 11 -106 68 -107 161 0 69 19 117 60 143 35 23 96 23 122 -1 l21 -19 0 76 0 77 35 0 35 0 0 -215z m-1410 135 c0 -38 2 -40 30 -40 25 0 30 -4 30 -25 0 -21 -5 -25 -30 -25 l-31 0 3 -102 3 -103 28 -3 c21 -3 27 -9 27 -28 0 -22 -4 -24 -42 -24 -70 0 -78 15 -78 147 l0 113 -25 0 c-20 0 -30 5 -30 25 0 20 5 25 26 25 24 0 26 3 22 40 -3 39 -3 40 29 40 32 0 33 -1 33 -40z m710 0 c0 -38 2 -40 30 -40 25 0 30 -4 30 -25 0 -21 -5 -25 -30 -25 l-31 0 3 -102 3 -103 28 -3 c21 -3 27 -9 27 -28 0 -25 -10 -29 -60 -25 -49 4 -60 32 -60 152 l0 109 -25 0 c-20 0 -25 5 -25 25 0 20 5 25 26 25 24 0 26 3 22 40 -3 39 -3 40 29 40 32 0 33 -1 33 -40z m-4974 -45 c51 -21 64 -61 64 -195 l0 -110 -30 0 c-20 0 -30 5 -30 15 0 20 -5 19 -40 -6 -58 -43 -150 2 -150 72 0 47 45 85 119 100 51 11 61 16 61 34 0 12 -5 26 -12 33 -19 19 -73 14 -93 -8 -20 -22 -33 -24 -54 -11 -34 22 47 90 107 91 12 0 38 -7 58 -15z m343 1 c42 -22 51 -55 51 -186 l0 -120 -30 0 -30 0 0 108 c0 121 -12 152 -57 152 -54 0 -63 -22 -63 -147 l0 -113 -35 0 -35 0 0 156 0 155 33 -3 c24 -2 31 -7 29 -20 -2 -15 3 -14 34 7 42 29 64 31 103 11z m1182 -9 c41 -28 57 -59 61 -118 l3 -44 -100 -2 c-99 -1 -100 -1 -97 -25 9 -58 75 -84 125 -48 22 17 34 20 45 13 27 -16 24 -30 -10 -54 -44 -32 -124 -33 -165 -3 -46 34 -80 91 -80 148 0 58 37 126 80 147 45 23 77 23 117 -2z m598 5 c43 -21 71 -73 71 -129 l0 -43 -100 0 c-111 0 -120 -6 -76 -56 29 -34 84 -38 116 -9 19 17 22 17 37 2 14 -13 14 -19 3 -32 -38 -46 -108 -57 -169 -25 -54 27 -80 74 -69 161 4 73 17 108 73 130 38 24 70 24 114 1z m471 0 c47 -26 73 -80 73 -153 -1 -71 -23 -114 -73 -140 -67 -36 -146 -13 -182 52 -29 52 -22 168 12 205 50 53 112 66 170 36z m361 -18 c51 -49 62 -167 22 -235 -19 -32 -68 -59 -106 -59 -13 0 -36 9 -51 21 l-26 20 0 -80 0 -81 -30 0 -30 0 0 220 0 220 30 0 c24 0 30 -4 30 -22 1 -21 1 -21 11 -5 26 44 105 45 150 1z m306 12 l28 -24 28 24 c30 26 52 29 91 14 44 -16 56 -56 56 -190 l0 -120 -35 0 -35 0 0 118 c0 78 -4 122 -12 130 -17 17 -48 15 -70 -5 -15 -14 -18 -32 -18 -130 l0 -113 -32 0 -33 0 3 102 c3 117 -8 151 -50 156 -46 5 -58 -27 -58 -150 l0 -108 -30 0 -30 0 0 155 0 155 36 0 c29 0 35 -3 35 -22 0 -19 2 -20 13 -6 34 43 83 48 124 14z m2012 7 c77 -56 81 -203 7 -271 -56 -51 -161 -32 -201 37 -25 44 -25 149 1 194 36 63 134 83 193 40z m-4365 -102 l32 -115 16 55 c9 30 24 83 33 118 17 61 18 62 52 62 28 0 33 -3 27 -17 -3 -10 -25 -80 -48 -155 l-42 -138 -37 0 -37 0 -30 98 c-17 53 -39 123 -50 155 l-20 58 36 -3 37 -3 31 -115z m3425 2 c0 -127 5 -142 49 -142 57 0 71 33 71 159 l0 101 30 0 30 0 0 -155 0 -155 -30 0 c-24 0 -30 4 -30 21 l0 21 -18 -22 c-26 -32 -90 -38 -124 -10 -37 28 -48 75 -48 198 l0 102 35 0 35 0 0 -118z m660 -37 l0 -155 -32 0 -33 0 0 155 0 155 33 0 32 0 0 -155z" fill="currentColor" stroke="none" />
  </motion.svg>
);


const Sidebar: React.FC<SidebarProps> = ({
  view, setView, theme, setTheme, createNewNote, folders, notes, addFolder,
  activeFolderId, setActiveFolderId, onOpenSettings, onExport, onImport, reorderFolders
}) => {
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
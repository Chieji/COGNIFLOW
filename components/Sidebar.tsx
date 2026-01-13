import React, { useState } from 'react';
import { View, Theme, Folder, Note } from '../types';
import { EditIcon, GraphIcon, SunIcon, MoonIcon, PlusIcon, SettingsIcon, FolderIcon, ChevronDownIcon, MessageSquareIcon, DownloadIcon, UploadIcon, GitBranchIcon, SearchIcon, RssIcon, MailIcon, TagIcon, ListIcon } from './icons';
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
  <svg className="w-8 h-8 text-light-accent dark:text-dark-accent" viewBox="0 0 1536.000000 1024.000000" fill="none">
    <path d="M0 5120 l0 -5120 7680 0 7680 0 0 5120 0 5120 -7680 0 -7680 0 0 -5120z m3177 2104 c354 -52 694 -239 895 -492 76 -96 99 -133 160 -255 42 -84 55 -101 86 -115 233 -106 392 -372 354 -593 l-12 -70 44 -62 c128 -181 182 -416 142 -616 -27 -131 -72 -218 -168 -326 l-45 -50 -5 -100 c-6 -114 -27 -183 -83 -275 -54 -89 -136 -173 -230 -235 -156 -104 -304 -156 -515 -180 -74 -8 -144 -17 -156 -21 -44 -12 -54 17 -54 148 l0 120 70 105 70 106 -21 33 c-16 26 -20 48 -18 95 3 68 5 65 -112 160 l-45 37 -13 173 c-7 96 -15 187 -18 202 -5 25 -24 37 -153 102 -81 41 -158 75 -171 77 -33 4 -274 -241 -265 -269 8 -23 255 -276 365 -373 l84 -74 -7 -185 c-3 -102 -9 -303 -12 -447 -7 -285 -11 -263 55 -307 52 -34 70 -65 77 -132 5 -58 4 -62 -33 -110 -48 -62 -73 -75 -148 -75 -59 0 -59 0 -112 56 l-53 56 0 70 0 71 50 50 51 50 9 351 c6 193 11 369 12 391 6 132 9 126 -109 224 -115 95 -303 290 -342 354 -22 36 -23 41 -9 70 9 18 76 95 151 173 l136 140 -5 45 c-3 24 -12 101 -21 172 l-16 127 -36 0 c-43 0 -140 -48 -327 -161 -106 -64 -135 -87 -153 -119 -13 -23 -35 -52 -49 -65 l-26 -25 26 -80 26 -80 -38 -58 c-21 -31 -52 -70 -69 -86 l-30 -29 -118 14 -118 14 -17 35 c-9 19 -27 69 -39 112 l-22 76 59 82 59 82 70 -6 c38 -4 88 -9 111 -12 35 -5 42 -3 52 18 52 102 90 138 247 231 192 115 233 136 296 151 119 27 115 23 127 122 13 95 19 106 119 215 51 54 163 139 185 139 13 0 9 53 -9 137 l-17 77 68 61 c101 93 100 93 212 66 l96 -23 18 -44 c20 -45 60 -174 60 -191 0 -11 -77 -113 -95 -125 -5 -4 -25 -8 -43 -8 -18 0 -56 -8 -86 -19 -46 -16 -56 -17 -79 -4 -24 12 -31 11 -69 -8 -39 -20 -252 -209 -244 -216 2 -2 -5 -42 -14 -90 l-18 -86 82 6 c353 27 391 34 567 105 24 9 27 17 31 72 4 57 8 64 49 105 59 59 118 76 182 51 97 -37 137 -95 137 -199 0 -61 -1 -64 -43 -105 -72 -70 -148 -80 -234 -31 l-54 31 -58 -26 c-32 -14 -66 -26 -75 -26 -9 0 -16 -3 -16 -7 1 -24 54 -102 115 -169 86 -93 101 -122 110 -199 7 -55 26 -95 46 -95 5 0 15 15 22 33 19 44 39 59 134 102 l82 37 43 -34 c24 -19 60 -45 81 -57 59 -36 70 -59 65 -143 -4 -65 -9 -80 -48 -143 -25 -38 -48 -72 -52 -75 -7 -5 -219 -3 -223 2 -25 35 -101 126 -113 136 -25 19 -50 15 -198 -32 -77 -25 -148 -46 -159 -48 -13 -3 -19 -10 -17 -23 1 -11 8 -82 14 -158 l11 -138 39 -27 c22 -15 52 -37 66 -48 26 -21 29 -21 58 -5 17 9 45 26 64 38 31 20 35 21 84 6 54 -16 125 -53 144 -75 9 -12 52 -184 52 -211 0 -20 -142 -155 -169 -160 -15 -3 -56 1 -91 9 -72 16 -82 12 -122 -55 -12 -20 -30 -46 -40 -58 -13 -14 -22 -42 -25 -84 l-6 -62 79 7 c238 21 459 119 598 266 111 118 153 229 143 380 l-6 89 34 21 c67 41 159 181 190 289 60 203 -10 451 -176 626 l-48 51 27 54 c85 172 -27 393 -258 509 l-91 46 -39 93 c-56 132 -118 221 -240 344 -193 192 -401 302 -690 364 -119 25 -373 26 -490 1 -299 -64 -552 -199 -760 -407 -213 -213 -356 -467 -421 -750 -26 -111 -36 -362 -20 -485 16 -120 70 -281 128 -385 64 -114 201 -252 293 -297 129 -62 201 -78 345 -78 100 0 142 4 182 18 29 10 62 16 73 12 38 -12 373 -288 456 -375 44 -47 85 -94 91 -105 7 -13 8 -53 2 -120 -12 -141 -15 -355 -5 -388 7 -23 4 -33 -14 -53 -31 -32 -70 -31 -104 2 -29 30 -32 48 -11 84 10 18 14 59 15 140 0 63 5 157 10 208 l10 94 -100 95 c-83 79 -196 174 -328 277 -22 18 -30 18 -81 7 -166 -37 -272 -34 -431 10 -122 -28 -239 -70 -343 -128 -49 -27 -95 -61 -107 -74 -7 -8 -8 -42 -4 -90 4 -42 10 -82 14 -87 3 -5 24 -8 46 -8 22 0 43 -3 46 -7 3 -3 -5 -37 -17 -75 -12 -38 -27 -85 -33 -103 l-10 -30 -37 0 -37 0 -23 78 c-12 43 -28 97 -35 119 -7 22 -16 40 -20 40 -4 0 -8 -43 -8 -95z m2761 23 c9 -40 19 -88 22 -107 9 -43 15 -30 44 87 22 89 23 92 51 92 25 0 30 -5 40 -42 50 -190 48 -187 69 -88 28 129 28 130 60 130 17 0 30 -5 30 -10 0 -6 -16 -76 -36 -156 l-37 -145 -35 3 -36 3 -27 105 -27 105 -10 -40 c-6 -22 -19 -70 -28 -107 -18 -66 -19 -68 -51 -68 -29 0 -33 4 -42 38 -31 119 -62 239 -67 255 -4 14 1 17 29 17 l35 0 19 -90z m-3540 -55 c-1 -28 -1 -28 -82 -31 l-82 -3 0 31 0 30 83 0 83 0 -2 -27z m4156 -488 c26 -32 -13 -81 -47 -59 -35 22 -23 74 17 74 10 0 23 -7 30 -15z m-5090 -210 l0 -215 -30 0 c-21 0 -30 5 -30 17 0 15 -1 15 -19 -1 -31 -28 -85 -31 -124 -7 -81 50 -90 206 -16 277 37 36 104 41 138 10 l21 -19 0 76 0 77 30 0 30 0 0 -215z m457 187 c108 -56 127 -271 32 -359 -37 -33 -73 -43 -163 -43 l-83 0 -1 207 c0 114 2 212 5 217 11 16 166 0 210 -22z m1153 -187 l0 -215 -35 0 -35 0 0 215 0 215 35 0 35 0 0 -215z m2441 176 c22 -21 39 -43 39 -48 0 -5 -12 -15 -26 -21 -23 -11 -28 -9 -50 18 -46 53 -134 33 -134 -30 0 -35 10 -42 92 -69 86 -28 118 -63 118 -128 0 -38 -5 -50 -33 -78 -69 -69 -215 -54 -257 25 -8 16 -6 22 14 35 23 15 25 14 54 -15 53 -53 152 -34 152 29 0 37 -23 56 -95 76 -79 23 -115 59 -115 115 0 87 47 129 144 130 55 0 61 -2 97 -39z m899 -176 l0 -215 -30 0 -30 0 0 208 c0 115 3 212 7 215 3 4 19 7 35 7 l28 0 0 -215z m640 23 c0 -106 3 -203 6 -215 6 -21 3 -23 -31 -23 -29 0 -36 3 -31 15 7 20 -1 19 -31 -5 -34 -26 -83 -25 -118 2 -82 64 -71 249 15 291 45 22 85 11 104 -12 20 -24 24 -16 21 46 -5 78 0 90 38 90 l30 0 0 -215z m1736 405 c4 -9 23 -88 43 -178 80 -349 126 -537 131 -537 3 0 15 37 27 83 70 276 154 605 159 625 6 22 10 23 103 20 l96 -3 95 -357 c52 -196 97 -359 100 -362 3 -3 44 158 91 357 l86 362 96 3 c67 2 97 -1 97 -8 0 -7 -54 -215 -121 -463 -66 -249 -125 -469 -130 -490 l-10 -38 -107 3 -107 3 -63 235 c-34 129 -75 285 -91 345 -16 61 -32 103 -34 95 -3 -8 -40 -141 -82 -295 -42 -154 -83 -304 -92 -332 l-14 -53 -107 0 -107 0 -59 223 c-102 384 -196 751 -196 765 0 20 189 17 196 -3z m-6935 -1560 l-2 -75 38 26 c45 30 85 27 123 -11 24 -24 25 -32 28 -155 l4 -130 -34 0 -33 0 0 98 c1 122 -12 162 -54 162 -54 0 -63 -22 -63 -147 l0 -113 -35 0 -35 0 0 215 0 215 92 -3 93 -3 220 -327z m855 -168 l0 -500 -97 0 -98 0 3 500 2 500 95 0 95 0 0 -500z m880 415 l0 -500 -35 0 -35 0 0 500 0 500 95 0 95 0 0 -500z m390 -335 l0 -420 225 0 225 0 0 -80 0 -80 -320 0 -320 0 0 500 0 500 95 0 95 0 0 -420z m1736 405 c-32 -18 -49 -46 -59 -98 -6 -36 -4 -41 42 -88 42 -43 52 -49 76 -43 75 17 113 60 113 125 0 29 -8 44 -37 73 -21 20 -44 36 -53 36 -8 0 -24 2 -35 5 -11 3 -32 -2 -47 -10z" fill="currentColor" stroke="none" />
    <path d="M3511 6395 c-37 -42 -40 -85 -11 -132 17 -29 25 -33 61 -33 35 0 47 6 76 36 36 39 38 56 10 113 -10 19 -66 47 -103 51 -1 0 -16 -16 -33 -35z" fill="currentColor" stroke="none" />
    <path d="M3960 5942 c-15 -12 -24 -33 -27 -64 -5 -45 -5 -47 36 -73 39 -24 45 -25 77 -13 40 14 49 27 59 79 6 32 3 39 -25 62 -37 32 -87 35 -120 9z" fill="currentColor" stroke="none" />
    <path d="M3485 5643 c-134 -11 -331 -36 -336 -41 -7 -8 29 -260 40 -282 9 -18 23 -25 165 -87 60 -26 135 -64 168 -85 67 -43 54 -43 251 9 l98 26 -6 38 c-20 115 -41 157 -128 252 -46 50 -94 111 -106 135 -23 46 -23 46 -146 35z" fill="currentColor" stroke="none" />
    <path d="M4148 5265 c-32 -18 -49 -46 -59 -98 -6 -36 -4 -41 42 -88 42 -43 52 -49 76 -43 75 17 113 60 113 125 0 29 -8 44 -37 73 -21 20 -44 36 -53 36 -8 0 -24 2 -35 5 -11 3 -32 -2 -47 -10z" fill="currentColor" stroke="none" />
    <path d="M2201 5185 c-25 -28 -30 -41 -25 -63 15 -61 23 -71 64 -82 52 -14 74 -7 105 34 l25 33 -19 45 c-16 39 -24 46 -56 52 -20 4 -42 9 -49 12 -7 3 -27 -11 -45 -31z" fill="currentColor" stroke="none" />
    <path d="M3862 4510 c-51 -36 -57 -47 -53 -90 3 -42 32 -75 77 -90 30 -10 39 -8 79 17 43 26 45 30 40 63 -2 19 -5 45 -5 57 0 17 -12 29 -49 47 l-49 25 -40 -29z" fill="currentColor" stroke="none" />
    <path d="M3268 3464 c-58 -31 -63 -79 -13 -123 43 -38 55 -38 94 -5 23 19 31 34 31 59 0 25 -8 40 -31 59 -35 30 -44 31 -81 10z" fill="currentColor" stroke="none" />
    <path d="M2815 6745 l-37 -44 23 -46 c28 -56 28 -56 90 -60 48 -4 50 -3 75 35 26 39 26 39 9 89 -17 53 -17 53 -92 65 -29 5 -36 0 -68 -39z" fill="currentColor" stroke="none" />
    <path d="M2473 6070 c-49 -29 -55 -88 -17 -147 12 -19 23 -23 70 -23 l55 0 19 46 c32 73 27 100 -20 124 -49 25 -67 25 -107 0z" fill="currentColor" stroke="none" />
    <path d="M1800 5618 c-32 -51 -33 -72 -10 -117 l21 -42 62 3 62 3 21 45 c23 48 20 69 -13 115 -15 20 -27 24 -71 25 -48 0 -54 -2 -72 -32z" fill="currentColor" stroke="none" />
    <path d="M6797 6166 c-66 -18 -115 -61 -151 -131 -26 -53 -30 -72 -34 -168 -8 -180 34 -284 135 -344 63 -37 165 -39 228 -6 47 25 96 75 119 121 47 93 43 299 -8 400 -55 108 -173 160 -289 128z" fill="currentColor" stroke="none" />
    <path d="M11999 6167 c-129 -36 -196 -166 -187 -361 4 -83 9 -112 32 -161 33 -72 48 -89 105 -123 60 -35 165 -37 227 -5 61 33 111 93 130 160 22 77 23 229 0 305 -41 142 -173 222 -307 185z" fill="currentColor" stroke="none" />
    <path d="M9358 4669 c-24 -13 -41 -83 -33 -130 7 -42 43 -79 76 -79 11 0 28 9 39 20 28 28 29 158 2 183 -21 19 -58 22 -84 6z" fill="currentColor" stroke="none" />
    <path d="M11733 4653 c-28 -42 -24 -135 7 -168 28 -30 63 -32 90 -5 26 26 29 143 4 178 -23 33 -78 30 -101 -5z" fill="currentColor" stroke="none" />
    <path d="M6737 4682 c-15 -50 -27 -96 -27 -101 0 -7 23 -11 56 -11 l56 0 -7 29 c-3 16 -16 62 -28 102 l-22 72 -28 -91z" fill="currentColor" stroke="none" />
    <path d="M7421 4704 l-2 -77 57 5 c44 4 62 10 76 28 25 31 23 66 -7 95 -19 20 -34 25 -73 25 l-49 0 -2 -76z" fill="currentColor" stroke="none" />
    <path d="M6232 4667 c-6 -7 -15 -25 -21 -40 l-11 -27 70 0 c77 0 87 11 54 58 -17 25 -74 31 -92 9z" fill="currentColor" stroke="none" />
    <path d="M7774 4672 c-22 -14 -34 -52 -34 -107 0 -46 4 -60 25 -80 49 -50 105 -19 113 63 5 59 -2 94 -24 116 -16 17 -61 21 -80 8z" fill="currentColor" stroke="none" />
    <path d="M8496 4658 c-33 -47 -23 -58 53 -58 67 0 69 1 64 23 -15 58 -86 79 -117 35z" fill="currentColor" stroke="none" />
    <path d="M9026 4658 c-33 -46 -22 -58 49 -58 62 0 65 1 65 23 0 54 -84 79 -114 35z" fill="currentColor" stroke="none" />
    <path d="M10523 4653 c-12 -18 -18 -46 -18 -84 0 -47 5 -62 24 -83 63 -67 136 9 118 121 -8 48 -33 73 -73 73 -25 0 -38 -7 -51 -27z" fill="currentColor" stroke="none" />
    <path d="M11416 4658 c-33 -46 -22 -58 49 -58 62 0 65 1 65 23 0 54 -84 79 -114 35z" fill="currentColor" stroke="none" />
    <path d="M12071 4654 c-32 -41 -30 -136 4 -169 32 -33 68 -32 94 1 30 38 30 145 1 174 -29 29 -74 26 -99 -6z" fill="currentColor" stroke="none" />
    <path d="M12414 4672 c-13 -8 -34 -46 -34 -61 0 -7 27 -11 71 -11 61 0 70 2 65 16 -3 9 -6 19 -6 24 0 30 -66 52 -96 32z" fill="currentColor" stroke="none" />
    <path d="M13536 4570 c-83 -25 -89 -110 -7 -110 28 0 61 47 61 86 0 36 -5 38 -54 24z" fill="currentColor" stroke="none" />
    <path d="M13817 4662 c-26 -29 -24 -155 3 -182 27 -27 62 -25 91 6 20 21 24 36 24 83 0 75 -22 111 -69 111 -19 0 -40 -8 -49 -18z" fill="currentColor" stroke="none" />
    <path d="M6213 3950 c-40 -16 -56 -54 -51 -120 5 -65 17 -85 60 -95 21 -5 33 -1 52 19 23 22 26 34 26 91 0 57 -3 69 -25 90 -26 27 -30 28 -62 15z" fill="currentColor" stroke="none" />
    <path d="M6670 3900 l0 -150 43 0 c84 0 127 50 127 148 0 103 -40 152 -122 152 l-48 0 0 -150z" fill="currentColor" stroke="none" />
    <path d="M11152 3949 c-32 -12 -55 -73 -49 -128 6 -57 46 -96 85 -86 40 10 51 34 52 111 0 55 -4 74 -17 86 -26 22 -45 26 -71 17z" fill="currentColor" stroke="none" />
    <path d="M5589 3841 c-53 -17 -69 -31 -69 -61 0 -35 28 -53 65 -44 31 8 45 32 45 78 0 38 -1 39 -41 27z" fill="currentColor" stroke="none" />
    <path d="M7071 3947 c-14 -6 -31 -27 -38 -44 l-13 -33 70 0 c67 0 70 1 70 24 0 15 -11 33 -26 45 -31 24 -32 25 -63 8z" fill="currentColor" stroke="none" />
    <path d="M7667 3938 c-14 -13 -28 -33 -32 -45 -6 -22 -4 -23 65 -23 l72 0 -7 28 c-13 55 -60 74 -98 40z" fill="currentColor" stroke="none" />
    <path d="M8142 3949 c-56 -21 -67 -152 -17 -196 33 -29 47 -29 82 1 25 22 28 30 28 89 0 88 -35 127 -93 106z" fill="currentColor" stroke="none" />
    <path d="M8473 3949 c-32 -12 -43 -40 -43 -109 0 -51 4 -65 25 -85 30 -31 47 -31 81 -2 23 20 28 34 32 83 3 49 0 64 -17 85 -24 31 -48 39 -78 28z" fill="currentColor" stroke="none" />
    <path d="M9273 3950 c-23 -10 -43 -39 -43 -64 0 -13 13 -16 69 -16 68 0 68 0 63 25 -2 14 -16 34 -30 45 -28 22 -28 22 -59 10z" fill="currentColor" stroke="none" />
    <path d="M11629 3946 c-31 -15 -49 -52 -49 -103 0 -56 16 -89 51 -104 40 -16 75 8 89 62 25 94 -27 177 -91 145z" fill="currentColor" stroke="none" />
  </svg>
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
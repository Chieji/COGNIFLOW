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
    viewBox="0 0 1536.000000 1024.000000" 
    fill="none" 
    animate={{ rotate: 360 }}
    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
  >
    <path d="M0 5120 l0 -5120 7680 0 7680 0 0 5120 0 5120 -7680 0 -7680 0 0 -5120z m3177 2104 c354 -52 694 -239 895 -492 76 -96 99 -133 160 -255 42 -84 55 -101 86 -115 233 -106 392 -372 354 -593 l-12 -70 44 -62 c128 -181 182 -416 142 -616 -27 -131 -72 -218 -168 -326 l-45 -50 -5 -100 c-6 -114 -27 -183 -83 -275 -54 -89 -136 -173 -230 -235 -156 -104 -304 -156 -515 -180 -74 -8 -144 -17 -156 -21 -44 -12 -54 17 -54 148 l0 120 70 105 70 106 -21 33 c-16 26 -20 48 -18 95 3 68 5 65 -112 160 l-45 37 -13 173 c-7 96 -15 187 -18 202 -5 25 -24 37 -153 102 -81 41 -158 75 -171 77 -33 4 -274 -241 -265 -269 8 -23 255 -276 365 -373 l84 -74 -7 -185 c-3 -102 -9 -303 -12 -447 -7 -285 -11 -263 55 -307 52 -34 70 -65 77 -132 5 -58 4 -62 -33 -110 -48 -62 -73 -75 -148 -75 -59 0 -59 0 -112 56 l-53 56 0 70 0 71 50 50 51 50 9 351 c6 193 11 369 12 391 6 132 9 126 -109 224 -115 95 -303 290 -342 354 -22 36 -23 41 -9 70 9 18 76 95 151 173 l136 140 -5 45 c-3 24 -12 101 -21 172 l-16 127 -36 0 c-43 0 -140 -48 -327 -161 -106 -64 -135 -87 -153 -119 -13 -23 -35 -52 -49 -65 l-26 -25 26 -80 26 -80 -38 -58 c-21 -31 -52 -70 -69 -86 l-30 -29 -118 14 -118 14 -17 35 c-9 19 -27 69 -39 112 l-22 76 59 82 59 82 70 -6 c38 -4 88 -9 111 -12 35 -5 42 -3 52 18 52 102 90 138 247 231 192 115 233 136 296 151 119 27 115 23 127 122 13 95 19 106 119 215 51 54 163 139 185 139 13 0 9 53 -9 137 l-17 77 68 61 c101 93 100 93 212 66 l96 -23 18 -44 c20 -45 60 -174 60 -191 0 -11 -77 -113 -95 -125 -5 -4 -25 -8 -43 -8 -18 0 -56 -8 -86 -19 -46 -16 -56 -17 -79 -4 -24 12 -31 11 -69 -8 -39 -20 -252 -209 -244 -216 2 -2 -5 -42 -14 -90 l-18 -86 82 6 c353 27 391 34 567 105 24 9 27 17 31 72 4 57 8 64 49 105 59 59 118 76 182 51 97 -37 137 -95 137 -199 0 -61 -1 -64 -43 -105 -72 -70 -148 -80 -234 -31 l-54 31 -58 -26 c-32 -14 -66 -26 -75 -26 -9 0 -16 -3 -16 -7 1 -24 54 -102 115 -169 86 -93 101 -122 110 -199 7 -55 26 -95 46 -95 5 0 15 15 22 33 19 44 39 59 134 102 l82 37 43 -34 c24 -19 60 -45 81 -57 59 -36 70 -59 65 -143 -4 -65 -9 -80 -48 -143 -25 -38 -48 -72 -52 -75 -7 -5 -219 -3 -223 2 -25 35 -101 126 -113 136 -25 19 -50 15 -198 -32 -77 -25 -148 -46 -159 -48 -13 -3 -19 -10 -17 -23 1 -11 8 -82 14 -158 l11 -138 39 -27 c22 -15 52 -37 66 -48 26 -21 29 -21 58 -5 17 9 45 26 64 38 31 20 35 21 84 6 54 -16 125 -53 144 -75 9 -12 52 -184 52 -211 0 -20 -142 -155 -169 -160 -15 -3 -56 1 -91 9 -72 16 -82 12 -122 -55 -12 -20 -30 -46 -40 -58 -13 -14 -22 -42 -25 -84 l-6 -62 79 7 c238 21 459 119 598 266 111 118 153 229 143 380 l-6 89 34 21 c67 41 159 181 190 289 60 203 -10 451 -176 626 l-48 51 27 54 c85 172 -27 393 -258 509 l-91 46 -39 93 c-56 132 -118 221 -240 344 -193 192 -401 302 -690 364 -119 25 -373 26 -490 1 -299 -64 -552 -199 -760 -407 -213 -213 -356 -467 -421 -750 -26 -111 -36 -362 -20 -485 16 -120 70 -281 128 -385 64 -114 201 -252 293 -297 129 -62 201 -78 345 -78 100 0 142 4 182 18 29 10 62 16 73 12 38 -12 373 -288 456 -375 44 -47 85 -94 91 -105 7 -13 8 -53 2 -120 -12 -141 -15 -355 -5 -388 7 -23 4 -33 -14 -53 -31 -32 -70 -31 -104 2 -29 30 -32 48 -11 84 10 18 14 59 15 140 0 63 5 157 10 208 l10 94 -100 95 c-83 79 -196 174 -328 277 -22 18 -30 18 -81 7 -166 -37 -272 -34 -431 10 -276 76 -490 300 -602 629 -144 425 -42 955 264 1360 82 110 205 238 302 316 322 259 758 379 1163 318z m-234 -334 c54 -10 71 -18 86 -39 25 -34 91 -176 91 -194 0 -7 -20 -40 -45 -71 -25 -32 -45 -64 -45 -72 0 -7 -16 -16 -37 -19 -21 -4 -73 -13 -117 -22 -43 -8 -81 -11 -85 -6 -4 4 -27 34 -51 66 -50 67 -24 65 -228 19 -122 -28 -124 -29 -149 -68 -14 -21 -74 -115 -135 -207 -60 -93 -107 -171 -105 -173 2 -3 49 -7 103 -9 l99 -4 25 34 c30 41 32 42 143 66 68 14 93 16 112 7 21 -9 33 -5 100 36 61 39 81 46 104 41 62 -13 50 -63 -30 -134 -62 -55 -71 -79 -44 -115 8 -11 15 -29 15 -40 0 -28 -90 -173 -115 -185 -11 -5 -61 -12 -111 -16 l-92 -6 -45 60 c-24 33 -53 80 -63 104 l-19 45 -100 4 c-55 2 -107 7 -115 11 -11 5 -43 -22 -113 -99 -53 -58 -97 -109 -97 -114 0 -7 54 -32 95 -45 21 -6 104 -104 118 -138 8 -22 -15 -130 -43 -195 l-21 -47 -121 -17 c-67 -9 -127 -14 -133 -12 -14 6 -91 122 -106 159 -6 17 -16 40 -22 53 -15 31 22 100 81 152 43 38 43 39 28 68 -19 37 -17 39 119 187 62 68 116 137 139 180 21 39 50 86 65 105 38 48 162 244 191 303 36 71 81 89 343 138 53 10 57 12 57 38 0 33 28 72 100 139 42 40 61 51 80 47 14 -2 55 -9 93 -15z m3112 -570 c44 -17 76 -39 120 -84 61 -63 123 -171 112 -199 -3 -8 -32 -19 -69 -26 -34 -6 -75 -14 -89 -17 -23 -4 -27 0 -37 33 -31 101 -93 147 -202 147 -152 0 -235 -102 -247 -304 -9 -154 33 -287 107 -336 52 -35 150 -51 210 -34 69 19 115 72 130 148 l13 62 36 -6 c20 -4 63 -14 96 -23 54 -15 60 -19 57 -41 -10 -88 -120 -226 -219 -275 -49 -24 -74 -30 -156 -33 -159 -7 -262 32 -352 131 -91 100 -134 251 -122 425 15 221 129 382 314 443 80 26 214 21 298 -11z m905 20 c81 -15 154 -53 216 -112 98 -92 142 -194 151 -348 9 -159 -26 -295 -103 -396 -41 -54 -131 -112 -207 -135 -55 -17 -88 -21 -175 -18 -98 4 -114 7 -176 38 -120 59 -205 167 -241 306 -20 77 -20 253 0 328 64 247 283 385 535 337z m1082 -1 c116 -25 209 -93 258 -191 44 -90 43 -93 -51 -123 -45 -14 -83 -24 -84 -23 -2 2 -9 19 -17 38 -20 47 -63 97 -102 117 -47 25 -160 22 -213 -5 -52 -27 -98 -82 -125 -152 -30 -76 -31 -260 -3 -338 48 -132 173 -198 311 -163 86 22 131 72 153 170 l9 41 -109 0 -110 0 3 83 3 82 194 3 c107 1 197 -1 201 -5 13 -16 -9 -237 -29 -295 -59 -169 -183 -248 -392 -248 -164 0 -274 50 -361 165 -114 150 -131 421 -38 605 58 115 176 213 286 239 56 13 154 13 216 0z m4141 -4 c80 -21 125 -46 189 -104 203 -185 209 -595 12 -781 -138 -131 -354 -161 -531 -75 -155 76 -243 245 -243 464 1 245 135 440 341 495 71 19 161 20 232 1z m-3218 -327 l220 -328 3 330 2 331 98 -3 97 -3 3 -497 2 -498 -93 0 -94 0 -219 330 c-120 181 -221 330 -224 330 -3 0 -4 -148 -2 -330 l3 -330 -101 0 -100 0 0 500 0 501 92 -3 93 -3 220 -327z m855 -168 l0 -500 -97 0 -98 0 3 500 2 500 95 0 95 0 0 -500z m880 415 l0 -85 -225 0 -225 0 0 -130 0 -130 208 -2 207 -3 3 -82 3 -83 -211 0 -210 0 0 -200 0 -200 -100 0 -100 0 0 500 0 500 325 0 325 0 0 -85z m390 -335 l0 -420 225 0 225 0 0 -80 0 -80 -320 0 -320 0 0 500 0 500 95 0 95 0 0 -420z m1736 405 c4 -9 23 -88 43 -178 80 -349 126 -537 131 -537 3 0 15 37 27 83 70 276 154 605 159 625 6 22 10 23 103 20 l96 -3 95 -357 c52 -196 97 -359 100 -362 3 -3 44 158 91 357 l86 362 96 3 c67 2 97 -1 97 -8 0 -7 -54 -215 -121 -463 -66 -249 -125 -469 -130 -490 l-10 -38 -107 3 -107 3 -63 235 c-34 129 -75 285 -91 345 -16 61 -32 103 -34 95 -3 -8 -40 -141 -82 -295 -42 -154 -83 -304 -92 -332 l-14 -53 -107 0 -107 0 -59 223 c-102 384 -196 751 -196 765 0 20 189 17 196 -3z m-6935 -1560 l-2 -75 38 26 c45 30 85 27 123 -11 24 -24 25 -32 28 -155 l4 -130 -34 0 -33 0 0 98 c1 122 -12 162 -54 162 -20 0 -36 -8 -51 -27 -19 -25 -21 -38 -18 -130 l3 -103 -32 0 -33 0 0 209 0 210 28 3 c15 2 29 2 31 1 2 -2 3 -37 2 -78z m1179 -130 l0 -215 -35 0 -35 0 0 215 0 215 35 0 35 0 0 -215z m2460 0 l0 -215 -30 0 c-24 0 -30 4 -31 23 0 12 -3 16 -6 9 -7 -17 -57 -42 -85 -42 -13 0 -38 9 -56 20 -91 56 -81 256 15 296 39 17 85 11 104 -12 20 -24 24 -16 21 46 -5 78 0 90 38 90 l30 0 0 -215z m1740 0 l0 -215 -35 0 -35 0 0 208 c0 115 3 212 7 215 3 4 19 7 35 7 l28 0 0 -215z m640 23 c0 -106 3 -203 6 -215 6 -21 3 -23 -31 -23 -29 0 -36 3 -31 15 7 20 -1 19 -31 -5 -34 -26 -83 -25 -118 2 -82 64 -71 249 18 291 45 22 55 21 95 -3 l32 -20 0 75 0 75 30 0 30 0 0 -192z m1124 178 c37 -15 76 -60 76 -86 0 -22 -52 -38 -59 -19 -2 7 -14 23 -27 36 -52 51 -142 13 -165 -70 -23 -85 6 -192 58 -216 32 -15 85 -14 106 2 19 13 48 87 40 99 -2 5 -23 8 -46 8 -40 0 -43 2 -41 28 1 27 1 27 79 30 l78 3 -5 -71 c-6 -79 -22 -109 -78 -147 -59 -41 -167 -27 -217 28 -48 52 -68 181 -42 260 36 107 142 157 243 115z m1097 -71 c3 -44 6 -75 7 -69 1 7 18 19 37 29 30 13 42 14 71 5 53 -18 64 -49 64 -190 l0 -120 -30 0 -30 0 0 108 c0 121 -12 152 -57 152 -54 0 -63 -22 -63 -147 l0 -113 -35 0 -35 0 0 216 0 215 33 -3 32 -3 6 -80z m-8361 45 l0 -30 -65 0 -65 0 0 -180 0 -180 -30 0 -30 0 0 180 0 180 -65 0 -65 0 2 30 2 30 158 0 158 0 0 -30z m1059 -42 c12 -40 41 -135 65 -210 l44 -138 -38 0 c-36 0 -37 2 -46 43 l-9 42 -80 3 -81 3 -12 -46 c-11 -42 -14 -45 -46 -45 l-34 0 22 73 c13 39 42 134 66 210 l43 137 42 0 42 0 22 -72z m749 52 c88 -54 73 -195 -24 -236 -19 -8 -56 -14 -84 -14 l-52 0 4 -75 3 -75 -32 0 -33 0 0 210 0 210 93 0 c75 0 98 -4 125 -20z m2254 -77 l3 -98 74 98 c71 94 75 97 113 97 31 0 38 -3 31 -12 -109 -140 -143 -190 -137 -201 5 -6 31 -43 59 -82 29 -38 60 -82 69 -97 l18 -28 -41 0 c-40 0 -41 1 -107 95 -37 52 -71 95 -76 95 -4 0 -8 -43 -8 -95 l0 -95 -35 0 -35 0 0 210 0 210 35 0 34 0 3 -97z m-3485 -28 c31 -21 52 -64 55 -116 l3 -44 -103 -3 c-101 -3 -103 -3 -97 -25 9 -31 52 -67 79 -67 13 0 35 9 49 20 22 18 29 19 47 8 26 -16 22 -27 -21 -56 -65 -45 -169 -17 -204 55 -19 39 -20 123 -1 166 33 78 124 107 193 62z m1544 -6 c39 -28 63 -97 56 -160 -11 -93 -67 -143 -150 -136 -98 8 -148 105 -116 221 12 44 57 92 92 99 36 8 89 -3 118 -24z m725 6 c36 -23 54 -57 61 -114 l6 -51 -102 0 c-95 0 -101 -1 -101 -20 0 -28 44 -70 73 -70 13 0 36 9 50 21 22 16 30 18 47 9 27 -14 22 -29 -20 -57 -96 -66 -220 12 -220 137 0 127 113 206 206 145z m294 -10 c0 -32 -2 -35 -29 -35 -20 0 -36 -9 -50 -26 -18 -23 -21 -41 -21 -125 l0 -99 -30 0 -30 0 0 155 0 155 30 0 c24 0 30 -4 30 -22 l0 -21 23 20 c19 18 39 27 70 32 4 0 7 -15 7 -34z m237 10 c35 -23 51 -55 59 -112 l7 -53 -102 0 c-90 0 -101 -2 -101 -18 0 -57 73 -88 121 -53 23 18 33 20 50 11 26 -14 21 -29 -21 -57 -61 -42 -154 -22 -195 40 -41 63 -31 171 20 222 48 47 108 55 162 20z m1162 14 c50 -18 61 -51 61 -189 l0 -120 -30 0 -30 0 0 108 c0 122 -12 152 -59 152 -53 0 -65 -28 -64 -150 l1 -110 -34 0 -34 0 0 155 0 155 30 0 c24 0 30 -4 30 -22 0 -20 1 -20 18 -5 15 14 57 35 73 36 3 1 20 -4 38 -10z m341 -18 c62 -45 84 -156 46 -229 -48 -93 -189 -94 -238 -2 -22 41 -24 127 -4 173 33 80 128 108 196 58z m888 3 c29 -19 61 -88 62 -131 l0 -33 -100 0 c-94 0 -100 -1 -100 -20 0 -28 44 -70 73 -70 13 0 36 9 50 21 22 16 30 18 47 9 27 -14 22 -29 -20 -57 -61 -42 -154 -22 -195 40 -41 63 -31 171 20 222 48 48 108 55 163 19z m595 17 c13 -5 31 -17 40 -26 16 -15 17 -15 17 4 0 17 6 21 30 21 l30 0 0 -180 c0 -107 -4 -189 -11 -203 -22 -48 -102 -75 -167 -58 -55 15 -70 35 -47 61 16 17 20 18 38 5 12 -8 38 -15 59 -15 44 0 68 27 68 78 l0 33 -26 -20 c-54 -42 -133 -17 -165 52 -40 88 -10 204 61 239 41 21 41 21 73 9z m387 -19 c34 -25 60 -79 60 -124 l0 -38 -100 0 c-89 0 -100 -2 -100 -18 0 -64 106 -94 141 -39 7 10 49 -8 49 -22 0 -19 -52 -53 -88 -58 -81 -11 -141 29 -162 109 -39 143 93 267 200 190z m840 -7 c0 -32 -2 -35 -29 -35 -49 0 -61 -29 -61 -147 l0 -103 -32 0 -33 0 -2 155 -2 155 35 0 c28 0 34 -4 34 -22 l0 -21 23 20 c20 19 41 30 60 32 4 1 7 -15 7 -34z m247 10 c36 -24 43 -54 43 -181 l0 -114 -30 0 c-21 0 -30 5 -30 17 0 15 -2 14 -20 -2 -10 -9 -39 -20 -64 -22 -38 -5 -48 -2 -70 20 -26 26 -34 74 -20 112 9 21 72 53 124 61 39 6 41 8 38 38 -3 28 -6 31 -42 34 -32 3 -43 -1 -57 -19 -12 -17 -22 -20 -43 -15 -25 6 -26 8 -12 34 13 25 35 41 76 56 24 8 80 -2 107 -19z m341 -1 c51 -33 72 -166 38 -233 -36 -68 -122 -95 -166 -51 l-20 20 0 -80 0 -80 -35 0 -35 0 0 220 0 220 35 0 c30 0 35 -4 35 -22 1 -21 1 -21 11 -5 23 39 87 44 137 11z m-5875 -79 c10 -49 21 -97 24 -105 3 -8 17 33 32 92 l26 108 31 0 c30 0 30 0 54 -100 13 -55 26 -100 30 -100 3 0 16 45 29 100 l22 100 33 0 32 0 -39 -155 -40 -155 -32 0 c-32 0 -33 1 -53 78 -12 42 -24 90 -28 107 -8 31 -11 24 -54 -142 -10 -40 -13 -43 -43 -43 l-33 0 -33 138 c-19 75 -36 145 -39 155 -4 16 1 18 28 15 l34 -3 19 -90z m2761 23 c9 -40 19 -88 22 -107 9 -43 15 -30 44 87 22 89 23 92 51 92 25 0 30 -5 40 -42 50 -190 48 -187 69 -88 28 129 28 130 60 130 17 0 30 -5 30 -10 0 -6 -16 -76 -36 -156 l-37 -145 -35 3 -36 3 -27 105 -27 105 -10 -40 c-6 -22 -19 -70 -28 -107 -18 -66 -19 -68 -51 -68 -29 0 -33 4 -42 38 -31 119 -62 239 -67 255 -4 14 1 17 29 17 l35 0 16 -72z m-3540 -55 c-1 -28 -1 -28 -82 -31 l-82 -3 0 31 0 30 83 0 83 0 -2 -27z m4156 -488 c26 -32 -13 -81 -47 -59 -35 22 -23 74 17 74 10 0 23 -7 30 -15z m-5090 -210 l0 -215 -30 0 c-21 0 -30 5 -30 17 0 15 -1 15 -19 -1 -31 -28 -85 -31 -124 -7 -81 50 -90 206 -16 277 37 36 104 41 138 10 l21 -19 0 76 0 77 30 0 30 0 0 -215z m457 187 c108 -56 127 -271 32 -359 -37 -33 -73 -43 -163 -43 l-83 0 -1 207 c0 114 2 212 5 217 11 16 166 0 210 -22z m1153 -187 l0 -215 -35 0 -35 0 0 215 0 215 35 0 35 0 0 -215z m2441 176 c22 -21 39 -43 39 -48 0 -5 -12 -15 -26 -21 -23 -11 -28 -9 -50 18 -46 53 -134 33 -134 -30 0 -35 10 -42 92 -69 86 -28 118 -63 118 -128 0 -38 -5 -50 -33 -78 -69 -69 -215 -54 -257 25 -8 16 -6 22 14 35 23 15 25 14 54 -15 53 -53 152 -34 152 29 0 37 -23 56 -95 76 -79 23 -115 59 -115 115 0 87 47 129 144 130 55 0 61 -2 97 -39z m899 -176 l0 -215 -30 0 c-20 0 -30 5 -30 15 0 20 -5 19 -40 -6 -22 -17 -37 -20 -66 -16 -69 11 -106 68 -107 161 0 69 19 117 60 143 35 23 96 23 122 -1 l21 -19 0 76 0 77 35 0 35 0 0 -215z m-1410 135 c0 -38 2 -40 30 -40 25 0 30 -4 30 -25 0 -21 -5 -25 -30 -25 l-31 0 3 -102 3 -103 28 -3 c21 -3 27 -9 27 -28 0 -22 -4 -24 -42 -24 -70 0 -78 15 -78 147 l0 113 -25 0 c-20 0 -25 5 -25 25 0 20 5 25 26 25 24 0 26 3 22 40 -3 39 -3 40 29 40 32 0 33 -1 33 -40z m710 0 c0 -38 2 -40 30 -40 25 0 30 -4 30 -25 0 -21 -5 -25 -30 -25 l-31 0 3 -102 3 -103 28 -3 c21 -3 27 -9 27 -28 0 -25 -10 -29 -60 -25 -49 4 -60 32 -60 152 l0 109 -25 0 c-20 0 -25 5 -25 25 0 20 5 25 26 25 24 0 26 3 22 40 -3 39 -3 40 29 40 32 0 33 -1 33 -40z m-4974 -45 c51 -21 64 -61 64 -195 l0 -110 -30 0 c-20 0 -30 5 -30 15 0 20 -5 19 -40 -6 -58 -43 -150 2 -150 72 0 47 45 85 119 100 51 11 61 16 61 34 0 12 -5 26 -12 33 -19 19 -73 14 -93 -8 -20 -22 -33 -24 -54 -11 -34 22 47 90 107 91 12 0 38 -7 58 -15z m343 1 c42 -22 51 -55 51 -186 l0 -120 -30 0 -30 0 0 108 c0 121 -12 152 -57 152 -54 0 -63 -22 -63 -147 l0 -113 -35 0 -35 0 0 156 0 155 33 -3 c24 -2 31 -7 29 -20 -2 -15 3 -14 34 7 42 29 64 31 103 11z m1182 -9 c41 -28 57 -59 61 -118 l3 -44 -100 -2 c-99 -1 -100 -1 -97 -25 9 -58 75 -84 125 -48 22 17 34 20 45 13 27 -16 24 -30 -10 -54 -44 -32 -124 -33 -165 -3 -46 34 -65 80 -61 151 4 72 25 108 79 135 46 24 79 23 120 -5z m598 5 c43 -21 71 -73 71 -129 l0 -43 -100 0 c-111 0 -120 -6 -76 -56 29 -34 84 -38 116 -9 19 17 22 17 37 2 14 -13 14 -19 3 -32 -38 -46 -108 -57 -169 -25 -54 27 -74 74 -69 161 4 73 17 96 73 130 38 24 70 24 114 1z m471 0 c47 -26 73 -80 73 -153 -1 -71 -23 -114 -73 -140 -67 -36 -146 -13 -182 52 -29 52 -22 168 12 205 50 53 112 66 170 36z m361 -18 c51 -49 62 -167 22 -235 -19 -32 -68 -59 -106 -59 -13 0 -36 9 -51 21 l-26 20 0 -80 0 -81 -30 0 -30 0 0 220 0 220 30 0 c24 0 30 -4 30 -22 1 -21 1 -21 11 -5 26 44 105 45 150 1z m306 12 l28 -24 28 24 c30 26 52 29 91 14 44 -16 56 -56 56 -190 l0 -120 -35 0 -35 0 0 118 c0 78 -4 122 -12 130 -17 17 -48 15 -70 -5 -15 -14 -18 -32 -18 -130 l0 -113 -32 0 -33 0 3 102 c3 117 -8 151 -50 156 -46 5 -58 -27 -58 -150 l0 -108 -30 0 -30 0 0 155 0 155 30 0 c24 0 30 -4 30 -22 0 -19 2 -20 13 -6 34 43 83 48 124 14z m460 4 c45 -27 64 -61 66 -117 l2 -48 -97 -3 c-88 -2 -98 -5 -98 -21 0 -10 8 -29 19 -42 23 -29 81 -31 111 -4 16 15 25 17 38 8 24 -15 21 -33 -9 -56 -38 -28 -106 -32 -149 -10 -43 22 -80 91 -80 148 0 58 37 126 80 147 45 23 77 23 117 -2z m361 -15 c19 -23 22 -38 23 -123 1 -53 2 -112 3 -129 2 -31 0 -33 -31 -33 l-33 0 0 111 c0 129 -7 149 -55 149 -54 0 -65 -25 -65 -152 l0 -108 -34 0 -34 0 -1 155 -2 155 36 0 c29 0 35 -3 35 -22 0 -19 2 -20 13 -6 36 45 106 47 145 3z m2012 7 c77 -56 81 -203 7 -271 -56 -51 -161 -32 -201 37 -25 44 -25 149 1 194 36 63 134 83 193 40z m-4365 -102 l32 -115 16 55 c9 30 24 83 33 118 17 61 18 62 52 62 28 0 33 -3 27 -17 -3 -10 -25 -80 -48 -155 l-42 -138 -37 0 -37 0 -30 98 c-17 53 -39 123 -50 155 l-20 58 36 -3 37 -3 31 -115z m3425 2 c0 -127 5 -142 49 -142 57 0 71 33 71 159 l0 101 30 0 30 0 0 -155 0 -155 -30 0 c-24 0 -30 4 -30 21 l0 21 -18 -22 c-26 -32 -90 -38 -124 -10 -37 28 -48 75 -48 198 l0 102 35 0 35 0 0 -118z m660 -37 l0 -155 -32 0 -33 0 0 155 0 155 33 0 32 0 0 -155z" fill="currentColor" stroke="none" />
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

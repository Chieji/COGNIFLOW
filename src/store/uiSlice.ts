import { StateCreator } from 'zustand';
import { View } from '../types';

export interface UISlice {
  activeView: View;
  sidebarWidth: number;
  showSettings: boolean;
  setActiveView: (view: View) => void;
  setSidebarWidth: (width: number) => void;
  setShowSettings: (show: boolean) => void;
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  activeView: 'notes',
  sidebarWidth: 280,
  showSettings: false,
  setActiveView: (view: View) => set({ activeView: view }),
  setSidebarWidth: (width: number) => set({ sidebarWidth: width }),
  setShowSettings: (show: boolean) => set({ showSettings: show }),
});

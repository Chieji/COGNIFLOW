import { useStore } from '../store';

export function useFolders() {
  return {
    folders: useStore((state) => state.folders),
    selectedFolder: useStore((state) => state.selectedFolder),
    addFolder: useStore((state) => state.addFolder),
    updateFolder: useStore((state) => state.updateFolder),
    deleteFolder: useStore((state) => state.deleteFolder),
    selectFolder: useStore((state) => state.selectFolder),
  };
}

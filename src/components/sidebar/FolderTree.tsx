import React from 'react';
import { useFolders } from '../../hooks/useFolders';
import { Folder } from '../../types';

interface FolderTreeProps {
  onFolderClick: (folder: Folder) => void;
  selectedFolderId?: string;
}

export const FolderTree: React.FC<FolderTreeProps> = ({ 
  onFolderClick, 
  selectedFolderId 
}) => {
  const { folders } = useFolders();

  return (
    <div style={{ padding: '0.5rem' }}>
      <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
        Folders
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {folders.map((folder) => (
          <div
            key={folder.id}
            onClick={() => onFolderClick(folder)}
            style={{
              padding: '0.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
              backgroundColor: folder.id === selectedFolderId ? 'var(--accent-color)' : 'transparent',
              color: folder.id === selectedFolderId ? 'white' : 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>📁</span>
            <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>
              {folder.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

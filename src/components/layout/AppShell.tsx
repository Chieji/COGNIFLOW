import React, { ReactNode } from 'react';
import { useStore } from '../../store';

interface AppShellProps {
  children: ReactNode;
  sidebar: ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children, sidebar }) => {
  const { sidebarWidth } = useStore();
  const accentColor = useStore((state) => state.settings?.accentColor) || '#60a5fa';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <style>{`:root { --accent-color: ${accentColor}; }`}</style>
      <div style={{ width: `${sidebarWidth}px`, flexShrink: 0 }}>{sidebar}</div>
      <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
    </div>
  );
};

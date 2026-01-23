import React, { useEffect } from 'react';
import SidebarEnhanced from './components/SidebarEnhanced';
import SettingsModal from './components/SettingsModal';
import { MainContent } from './components/MainContent';
import { ErrorBoundary, setupGlobalErrorHandlers } from './components/ErrorBoundary';
import { useStore } from './store';
import { OfflineIndicator } from './components/OfflineIndicator';
import { useThemeEffect } from './hooks/useThemeEffect';
import { useSharedNoteHandler } from './hooks/useSharedNoteHandler';
import { handleAiAction } from './services/aiActionHandler';
import { exportData, importData } from './utils/exportImport';
import { mcpService } from './services/mcpService';
import { Toaster } from './components/ui/toaster';

// Setup global error handlers for unhandled errors
setupGlobalErrorHandlers();

const App: React.FC = () => {
  const {
    isSettingsOpen,
    settings,
    setIsSettingsOpen,
    setSettings,
    initialize,
  } = useStore();

  useThemeEffect();
  useSharedNoteHandler();

  useEffect(() => {
    initialize();

    // Initialize MCP service when app starts
    const initMCP = async () => {
      try {
        await mcpService.initialize();
        console.log('MCP service initialized');
      } catch (error) {
        console.error('Failed to initialize MCP service:', error);
      }
    };

    initMCP();
  }, [initialize]);

  const onExport = (format: 'json' | 'markdown' | 'pdf' = 'json') => {
    const state = useStore.getState();
    exportData(format, state);
  };

  const onImport = () => {
    importData(useStore.getState());
  };

  return (
    <ErrorBoundary>
      <div className="flex h-screen w-screen bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text font-sans">
        <SidebarEnhanced
          onOpenSettings={() => setIsSettingsOpen(true)}
          onExport={onExport}
          onImport={onImport}
        />
        <main className="flex-1 flex flex-col min-w-0">
          <MainContent handleAiAction={handleAiAction} />
        </main>
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onSave={setSettings}
        />
        <OfflineIndicator />
        <Toaster />
      </div>
    </ErrorBoundary>
  );
};

export default App;

import React, { useEffect } from 'react';
import { useStore } from './store';
import Sidebar from './components/Sidebar';
import SettingsModal from './components/SettingsModal';
import ErrorBoundary from './components/ErrorBoundary';
import { AppShell } from './components/layout/AppShell';
import { ViewRouter } from './components/views/ViewRouter';

function App() {
  const { loadFromDb, showSettings } = useStore();

  useEffect(() => {
    loadFromDb();
  }, [loadFromDb]);

  return (
    <ErrorBoundary>
      <AppShell sidebar={<Sidebar />}>
        <ViewRouter />
      </AppShell>
      {showSettings && <SettingsModal />}
    </ErrorBoundary>
  );
}

export default App;

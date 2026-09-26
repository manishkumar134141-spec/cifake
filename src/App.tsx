import React, { useState } from 'react';
import { ActiveTab } from './types';
import { useTheme } from './hooks/useTheme';
import { useHistory } from './hooks/useHistory';
import { MainLayout } from './layouts/MainLayout';
import { AnalyzePage } from './pages/AnalyzePage';
import { ComparePage } from './pages/ComparePage';
import { BatchPage } from './pages/BatchPage';
import { HistoryPage } from './pages/HistoryPage';
import { ModelsPage } from './pages/ModelsPage';
import { BenchmarkPage } from './pages/BenchmarkPage';
import { ApiLabPage } from './pages/ApiLabPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('analyze');
  const [selectedModel, setSelectedModel] = useState<string>('resnet18');
  const { theme, setTheme } = useTheme();
  const { history, addRecord, deleteRecord, clearHistory } = useHistory();

  return (
    <MainLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      selectedModel={selectedModel}
      historyCount={history.length}
    >
      {activeTab === 'analyze' && (
        <AnalyzePage
          onSaveHistory={addRecord}
          onNavigateCompare={() => setActiveTab('compare')}
        />
      )}
      {activeTab === 'compare' && <ComparePage />}
      {activeTab === 'batch' && <BatchPage />}
      {activeTab === 'history' && (
        <HistoryPage
          history={history}
          onDeleteRecord={deleteRecord}
          onClearHistory={clearHistory}
        />
      )}
      {activeTab === 'models' && <ModelsPage />}
      {activeTab === 'benchmark' && <BenchmarkPage />}
      {activeTab === 'api-lab' && <ApiLabPage />}
      {activeTab === 'settings' && (
        <SettingsPage
          theme={theme}
          onThemeChange={setTheme}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          onClearHistory={clearHistory}
        />
      )}
    </MainLayout>
  );
};

export default App;

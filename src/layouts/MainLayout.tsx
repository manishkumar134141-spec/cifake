import React from 'react';
import { ActiveTab } from '../types';
import { Sidebar } from '../components/navigation/Sidebar';
import { Header } from '../components/navigation/Header';
import { MobileNav } from '../components/navigation/MobileNav';

interface MainLayoutProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  selectedModel: string;
  historyCount: number;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  activeTab,
  onTabChange,
  selectedModel,
  historyCount,
  children,
}) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground antialiased">
      {/* Desktop Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        historyCount={historyCount}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header activeTab={activeTab} selectedModel={selectedModel} />

        <main className="flex-1 overflow-y-auto pb-16 md:pb-0 focus:outline-none">
          {children}
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav
        activeTab={activeTab}
        onTabChange={onTabChange}
        historyCount={historyCount}
      />
    </div>
  );
};

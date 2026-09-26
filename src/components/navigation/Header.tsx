import React from 'react';
import { ActiveTab } from '../../types';
import { ChevronRight, Cpu } from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  selectedModel: string;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, selectedModel }) => {
  const tabTitles: Record<ActiveTab, string> = {
    analyze: 'Analyze',
    compare: 'Compare',
    batch: 'Batch',
    history: 'History',
    models: 'Models',
    benchmark: 'Benchmark',
    'api-lab': 'API Lab',
    settings: 'Settings',
  };

  return (
    <header className="h-14 border-b border-border bg-background/90 backdrop-blur-xs px-6 flex items-center justify-between shrink-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm font-mono">
        <span className="text-muted-foreground font-semibold">CIFAKE</span>
        <ChevronRight size={14} className="text-muted-foreground/60" />
        <span className="text-foreground font-medium">{tabTitles[activeTab] || 'Analyze'}</span>
      </div>

      {/* Model status tag */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1 rounded-md border border-border bg-surface text-xs font-mono text-muted-foreground">
          <Cpu size={13} className="text-muted-foreground" />
          <span className="text-foreground font-bold">{selectedModel.toUpperCase()}</span>
          <span className="text-muted-foreground/60">· 32×32</span>
        </div>
      </div>
    </header>
  );
};

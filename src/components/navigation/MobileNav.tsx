import React from 'react';
import { ActiveTab } from '../../types';
import { Crosshair, Layers, ListOrdered, History, Sliders } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MobileNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  historyCount: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onTabChange,
  historyCount
}) => {
  const items = [
    { id: 'analyze' as ActiveTab, label: 'Analyze', icon: Crosshair },
    { id: 'compare' as ActiveTab, label: 'Compare', icon: Layers },
    { id: 'batch' as ActiveTab, label: 'Batch', icon: ListOrdered },
    { id: 'history' as ActiveTab, label: 'History', icon: History, count: historyCount },
    { id: 'settings' as ActiveTab, label: 'Settings', icon: Sliders },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-border px-3 py-1.5 flex items-center justify-around">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              'flex flex-col items-center justify-center py-2 px-3 rounded-md text-xs font-mono transition-colors relative',
              isActive ? 'text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon size={18} strokeWidth={isActive ? 2.2 : 1.7} />
            <span className="mt-1">{item.label}</span>
            {item.count !== undefined && item.count > 0 && (
              <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-foreground"></span>
            )}
          </button>
        );
      })}
    </nav>
  );
};

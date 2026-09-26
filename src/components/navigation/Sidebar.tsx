import React from 'react';
import { ActiveTab } from '../../types';
import { Crosshair, Layers, ListOrdered, History, Cpu, BarChart3, FlaskConical, Sliders, Shield } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  historyCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  historyCount
}) => {
  const mainNavItems = [
    { id: 'analyze' as ActiveTab, label: 'Analyze', icon: Crosshair },
    { id: 'compare' as ActiveTab, label: 'Compare', icon: Layers },
    { id: 'batch' as ActiveTab, label: 'Batch', icon: ListOrdered },
    { id: 'history' as ActiveTab, label: 'History', icon: History, count: historyCount },
    { id: 'models' as ActiveTab, label: 'Models', icon: Cpu },
    { id: 'benchmark' as ActiveTab, label: 'Benchmark', icon: BarChart3 },
    { id: 'api-lab' as ActiveTab, label: 'API Lab', icon: FlaskConical },
  ];

  return (
    <aside className="w-64 border-r border-border bg-surface/40 flex flex-col justify-between shrink-0 select-none hidden md:flex">
      <div>
        {/* Brand */}
        <div className="p-5 border-b border-border/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-foreground text-background flex items-center justify-center font-bold text-sm shadow-xs">
              <Shield size={16} strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-wider uppercase font-mono text-foreground">
                CIFAKE
              </h1>
              <p className="text-[11px] font-mono tracking-widest text-muted-foreground uppercase">
                V2 PLATFORM
              </p>
            </div>
          </div>
        </div>

        {/* Primary Navigation */}
        <nav className="p-3 space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  'w-full flex items-center justify-between px-3.5 py-2 rounded-md text-sm font-mono transition-all',
                  isActive
                    ? 'bg-foreground text-background font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-surface'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={cn(
                      'text-xs font-mono px-2 py-0.5 rounded-full',
                      isActive ? 'bg-background/20 text-background' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Settings */}
      <div className="p-3 border-t border-border/80">
        <button
          onClick={() => onTabChange('settings')}
          className={cn(
            'w-full flex items-center gap-2.5 px-3.5 py-2 rounded-md text-sm font-mono transition-all',
            activeTab === 'settings'
              ? 'bg-foreground text-background font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-surface'
          )}
        >
          <Sliders size={16} strokeWidth={activeTab === 'settings' ? 2.2 : 1.8} />
          <span>Settings</span>
        </button>

        <div className="mt-3 px-3.5 py-1 text-xs font-mono text-muted-foreground/80 border-t border-border/50 flex justify-between items-center">
          <span>v2.0.0</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>
      </div>
    </aside>
  );
};

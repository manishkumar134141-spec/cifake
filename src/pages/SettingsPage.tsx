import React from 'react';
import { ThemeMode } from '../types';
import { Sun, Moon, Monitor, Cpu, Trash2, Sliders } from 'lucide-react';
import { cn } from '../lib/utils';

interface SettingsPageProps {
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  selectedModel?: string;
  onModelChange?: (model: string) => void;
  onClearHistory: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  theme,
  onThemeChange,
  onClearHistory,
}) => {
  const themeOptions: { id: ThemeMode; label: string; icon: any }[] = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="border-b border-border/80 pb-3.5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold font-mono tracking-wider uppercase text-foreground">
            Settings
          </h2>
          <p className="text-xs font-mono text-muted-foreground mt-0.5">
            Preferences
          </p>
        </div>
        <Sliders size={16} className="text-muted-foreground" />
      </div>

      {/* Appearance Section */}
      <div className="p-6 rounded-xl border border-border bg-surface/50 space-y-4">
        <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-medium">
          Interface Theme
        </span>

        <div className="grid grid-cols-3 gap-3.5 pt-1">
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = theme === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onThemeChange(opt.id)}
                className={cn(
                  'p-3.5 rounded-lg border transition-all flex items-center justify-center gap-2.5 text-center',
                  isSelected
                    ? 'border-foreground bg-foreground text-background font-semibold shadow-xs'
                    : 'border-border bg-background hover:bg-surface text-foreground'
                )}
              >
                <Icon size={16} />
                <span className="text-sm font-mono">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Default Model */}
      <div className="p-6 rounded-xl border border-border bg-surface/50 space-y-4">
        <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-medium">
          Primary Detection Engine
        </span>

        <div className="pt-1">
          <div className="p-4 rounded-lg border border-emerald-500/40 bg-surface/80 flex items-center justify-between font-mono">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Cpu size={16} />
              </div>
              <div>
                <div className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span>Modified ResNet18</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-500/30 uppercase">
                    Active & Required
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">11.17M Parameters · 97.77% CIFAKE Benchmark Accuracy</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Storage and Data Controls */}
      <div className="p-5 rounded-lg border border-border bg-surface/50 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-mono font-medium text-foreground">Clear Session History</p>
          <p className="text-[11px] font-mono text-muted-foreground mt-0.5">Wipes local browser records.</p>
        </div>

        <button
          onClick={() => {
            if (window.confirm('Clear all cached analysis records?')) {
              onClearHistory();
            }
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-fake hover:text-white hover:bg-fake border border-fake/30 rounded-md transition-colors shrink-0"
        >
          <Trash2 size={13} />
          <span>Clear Data</span>
        </button>
      </div>
    </div>
  );
};

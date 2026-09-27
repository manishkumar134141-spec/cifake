import React, { useState, useEffect } from 'react';
import { ThemeMode } from '../types';
import { Sun, Moon, Monitor, Cpu, Trash2, Sliders, Server, CheckCircle2, XCircle, RefreshCw, Globe, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { getApiBase, getCustomBackendUrl, setCustomBackendUrl, checkBackendHealth } from '../services/api';

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

  const [backendUrl, setBackendUrl] = useState(getCustomBackendUrl());
  const [resolvedBase, setResolvedBase] = useState(getApiBase());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; latency?: number } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    // Check initial health on load
    runQuickHealthCheck();
  }, []);

  const runQuickHealthCheck = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const data = await checkBackendHealth();
      setTestResult({
        ok: true,
        message: `${data.service || 'CIFAKE Engine'} operational`,
        latency: data.latency_ms
      });
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: err.message || 'Service unreachable'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveBackendUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomBackendUrl(backendUrl);
    setResolvedBase(getApiBase());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
    await runQuickHealthCheck();
  };

  const handleResetBackendUrl = async () => {
    setCustomBackendUrl('');
    setBackendUrl('');
    setResolvedBase(getApiBase());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
    await runQuickHealthCheck();
  };

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

      {/* Backend API Connection & Cloud Deployment */}
      <div className="p-6 rounded-xl border border-border bg-surface/50 space-y-4 font-mono">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-2">
            <Server size={14} /> Backend API Connection
          </span>

          <div className="flex items-center gap-2">
            {testResult?.ok ? (
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 size={12} /> Connected {testResult.latency ? `(${testResult.latency}ms)` : ''}
              </span>
            ) : testResult ? (
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                <XCircle size={12} /> Unreachable
              </span>
            ) : null}
          </div>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            Current API Endpoint:{' '}
            <code className="text-foreground bg-surface/80 px-1.5 py-0.5 rounded border border-border">
              {resolvedBase}
            </code>
          </p>
          <p className="text-[11px] text-muted-foreground/80">
            For Vercel deployments, enter your cloud backend URL (e.g. Render, Railway, or VPS) below to connect your frontend with your backend API.
          </p>
        </div>

        <form onSubmit={handleSaveBackendUrl} className="flex flex-col sm:flex-row gap-2 pt-2">
          <div className="relative flex-1">
            <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="e.g. https://cifake-engine.onrender.com (or leave empty for auto/local)"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-foreground"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={testing}
              className="px-4 py-2 text-xs font-semibold bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5 shrink-0"
            >
              {savedSuccess ? <Check size={14} /> : null}
              {savedSuccess ? 'Saved' : 'Save URL'}
            </button>

            <button
              type="button"
              onClick={runQuickHealthCheck}
              disabled={testing}
              className="px-3 py-2 text-xs border border-border rounded-lg bg-surface hover:bg-surface/80 transition-colors flex items-center gap-1.5 shrink-0 text-muted-foreground hover:text-foreground"
              title="Test connection"
            >
              <RefreshCw size={12} className={cn(testing && 'animate-spin')} />
              <span>Test</span>
            </button>

            {backendUrl && (
              <button
                type="button"
                onClick={handleResetBackendUrl}
                className="px-3 py-2 text-xs border border-border rounded-lg bg-transparent hover:bg-surface transition-colors shrink-0 text-muted-foreground"
                title="Reset to default auto resolution"
              >
                Reset
              </button>
            )}
          </div>
        </form>

        {testResult && !testResult.ok && (
          <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs">
            <p className="font-semibold">Connection Error:</p>
            <p className="text-[11px] mt-0.5">{testResult.message}</p>
          </div>
        )}
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

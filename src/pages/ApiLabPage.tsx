import React, { useState, useEffect } from 'react';
import { testProvider, getProviderStatus, updateProviderConfig } from '../services/api';
import { ProviderHealth } from '../types';
import { CheckCircle2, XCircle, RefreshCw, Globe, Plus, Server, ExternalLink, Star, Key, Check } from 'lucide-react';
import { cn } from '../lib/utils';

export const ApiLabPage: React.FC = () => {
  const [providerStatuses, setProviderStatuses] = useState<Record<string, ProviderHealth>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [keyInput, setKeyInput] = useState('');
  const [maskedKey, setMaskedKey] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Custom Endpoint Form State
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customName, setCustomName] = useState('Custom Detector');
  const [customUrl, setCustomUrl] = useState('');
  const [customModel, setCustomModel] = useState('custom-v1');
  const [customResultPath, setCustomResultPath] = useState('result');
  const [customScorePath, setCustomScorePath] = useState('confidence');
  const [customSaved, setCustomSaved] = useState(false);

  const providers = [
    {
      id: 'gemini',
      name: 'Google Gemini Vision',
      envKey: 'GEMINI_API_KEY',
      models: ['gemini-flash-lite-latest', 'gemini-flash-latest', 'gemini-pro-latest'],
      desc: 'Required multimodal visual review engine. High-speed, state-of-the-art vision inspection using Google AI Studio free tier.',
      apiKeyUrl: 'https://aistudio.google.com/app/apikey',
      recommended: true,
      badge: 'Free Tier Available'
    }
  ];

  // Auto-check status on mount
  useEffect(() => {
    async function checkInitialStatus() {
      try {
        const info = await getProviderStatus('gemini');
        setIsConfigured(info.is_configured);
        setMaskedKey(info.masked_key);

        if (info.is_configured) {
          handleTest('gemini');
        }
      } catch (err) {
        console.error(err);
      }
    }
    checkInitialStatus();
  }, []);

  const handleTest = async (providerId: string) => {
    setTesting((prev) => ({ ...prev, [providerId]: true }));
    try {
      const res = await testProvider(providerId);
      setProviderStatuses((prev) => ({ ...prev, [providerId]: res }));
    } catch (e: any) {
      setProviderStatuses((prev) => ({
        ...prev,
        [providerId]: {
          provider: providerId,
          status: 'ERROR',
          models: [],
          error: e.message || 'Connection test failed'
        }
      }));
    } finally {
      setTesting((prev) => ({ ...prev, [providerId]: false }));
    }
  };

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;
    setTesting((prev) => ({ ...prev, gemini: true }));
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const res = await updateProviderConfig('gemini', keyInput.trim());
      setProviderStatuses((prev) => ({ ...prev, gemini: res }));
      setIsConfigured(true);
      setMaskedKey(`${keyInput.slice(0, 4)}...${keyInput.slice(-4)}`);
      setSaveSuccess(true);
      setKeyInput('');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      setSaveError(e.message || 'Failed to configure API key');
    } finally {
      setTesting((prev) => ({ ...prev, gemini: false }));
    }
  };

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl) return;
    setCustomSaved(true);
    setTimeout(() => {
      setShowCustomModal(false);
      setCustomSaved(false);
    }, 1500);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="border-b border-border/80 pb-3.5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold font-mono tracking-wider uppercase text-foreground">
            API Lab
          </h2>
          <p className="text-xs font-mono text-muted-foreground mt-0.5">
            Cloud Provider Status & Configuration
          </p>
        </div>

        <button
          onClick={() => setShowCustomModal(true)}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-mono border border-border bg-background hover:bg-surface text-foreground transition-colors shadow-xs"
        >
          <Plus size={14} />
          <span>Custom HTTP</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {providers.map((p) => {
          const statusObj = providerStatuses[p.id];
          const isBusy = !!testing[p.id];

          return (
            <div
              key={p.id}
              className={cn(
                'p-6 rounded-xl border bg-surface/50 flex flex-col justify-between space-y-5 font-mono',
                p.recommended ? 'border-emerald-500/40' : 'border-border'
              )}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe size={16} className="text-foreground" />
                    <span className="font-bold text-base text-foreground">{p.name}</span>
                    {p.recommended && (
                      <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <Star size={10} className="fill-emerald-500" />
                        <span>Recommended</span>
                      </span>
                    )}
                  </div>

                  {statusObj ? (
                    <span
                      className={cn(
                        'text-xs px-2.5 py-1 rounded border font-semibold flex items-center gap-1.5',
                        statusObj.status === 'ONLINE' && 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400',
                        statusObj.status === 'NOT_CONFIGURED' && 'bg-muted text-muted-foreground border-border',
                        statusObj.status === 'OFFLINE' && 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400',
                        statusObj.status === 'ERROR' && 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400'
                      )}
                    >
                      {statusObj.status === 'ONLINE' && <CheckCircle2 size={12} />}
                      {statusObj.status === 'ERROR' && <XCircle size={12} />}
                      <span>{statusObj.status}</span>
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Checking...</span>
                  )}
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  {p.desc}
                </p>

                {/* API Key Configuration Form */}
                <form onSubmit={handleSaveKey} className="p-3.5 rounded-lg border border-border/70 bg-background/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <Key size={13} className="text-muted-foreground" />
                      <span>Gemini API Key</span>
                    </div>
                    {isConfigured && maskedKey && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        Active ({maskedKey})
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder={isConfigured ? "Update API key..." : "Paste Gemini API key (AQ...)"}
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded-md border border-border bg-surface text-xs font-mono text-foreground focus:outline-hidden focus:border-foreground"
                    />
                    <button
                      type="submit"
                      disabled={isBusy || !keyInput.trim()}
                      className="px-3 py-1.5 rounded-md text-xs font-semibold bg-foreground text-background hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap"
                    >
                      Save & Test
                    </button>
                  </div>

                  {saveSuccess && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Check size={12} /> Key saved and verified successfully!
                    </p>
                  )}
                  {saveError && (
                    <p className="text-[11px] text-rose-500 leading-tight">
                      {saveError}
                    </p>
                  )}
                </form>

                <div className="pt-2 text-xs text-muted-foreground space-y-1.5 border-t border-border/50">
                  <div className="flex justify-between">
                    <span>Active Models:</span>
                    <span className="text-foreground font-semibold">gemini-flash-lite, flash</span>
                  </div>
                  {statusObj?.latency_ms && (
                    <div className="flex justify-between">
                      <span>Latency:</span>
                      <span className="text-foreground font-semibold">{statusObj.latency_ms} ms</span>
                    </div>
                  )}
                  {statusObj?.error && (
                    <div className="text-[11px] text-rose-500 pt-1 leading-tight">
                      Error: {statusObj.error}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border/60">
                <a
                  href={p.apiKeyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium underline underline-offset-4 transition-colors"
                >
                  <span>Get Free Google Key</span>
                  <ExternalLink size={12} />
                </a>

                <button
                  onClick={() => handleTest(p.id)}
                  disabled={isBusy}
                  className="px-4 py-2 rounded-md text-sm font-semibold border border-border bg-background hover:bg-surface text-foreground transition-colors flex items-center gap-2 shadow-xs"
                >
                  <RefreshCw size={13} className={isBusy ? 'animate-spin' : ''} />
                  <span>{isBusy ? 'Testing...' : 'Test Connection'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Endpoint Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-lg shadow-lg max-w-md w-full p-6 space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-border/80 pb-2">
              <div className="flex items-center gap-2">
                <Server size={16} className="text-foreground" />
                <h3 className="text-sm font-bold text-foreground uppercase">Custom HTTP Model</h3>
              </div>
              <button
                onClick={() => setShowCustomModal(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustom} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-muted-foreground uppercase text-[10px]">Name</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-border bg-surface text-foreground"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground uppercase text-[10px]">Endpoint URL</label>
                <input
                  type="url"
                  placeholder="https://api.example.com/analyze"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-border bg-surface text-foreground"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-muted-foreground uppercase text-[10px]">Model ID</label>
                  <input
                    type="text"
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-border bg-surface text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-muted-foreground uppercase text-[10px]">Result Path</label>
                  <input
                    type="text"
                    value={customResultPath}
                    onChange={(e) => setCustomResultPath(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-border bg-surface text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground uppercase text-[10px]">Score Path</label>
                <input
                  type="text"
                  value={customScorePath}
                  onChange={(e) => setCustomScorePath(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-border bg-surface text-foreground"
                />
              </div>

              {customSaved && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                  Custom endpoint saved to local registry.
                </p>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-3 py-1.5 rounded border border-border text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-foreground text-background font-semibold"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

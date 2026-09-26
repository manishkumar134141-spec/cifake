import React, { useState, useRef } from 'react';
import { runBatch, exportReport } from '../services/api';
import { NormalizedResult } from '../types';
import { StatusIndicator } from '../components/common/StatusIndicator';
import { formatBytes } from '../lib/utils';
import {
  UploadCloud,
  Play,
  Trash2,
  Download,
  ListOrdered
} from 'lucide-react';

interface BatchFileItem {
  id: string;
  file: File;
  status: 'QUEUE' | 'RUNNING' | 'DONE' | 'FAILED';
  result?: NormalizedResult;
}

export const BatchPage: React.FC = () => {
  const [items, setItems] = useState<BatchFileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newItems: BatchFileItem[] = Array.from(e.target.files).map((f) => ({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file: f,
        status: 'QUEUE'
      }));
      setItems((prev) => [...prev, ...newItems]);
    }
  };

  const handleStartBatch = async () => {
    if (items.length === 0 || isProcessing) return;
    setIsProcessing(true);

    const queuedFiles = items.filter((i) => i.status === 'QUEUE' || i.status === 'FAILED');
    if (queuedFiles.length === 0) {
      setIsProcessing(false);
      return;
    }

    try {
      const filesToProcess = queuedFiles.map((i) => i.file);
      const results = await runBatch(filesToProcess, 'resnet18');

      setItems((prev) =>
        prev.map((item) => {
          const match = results.find((r) => r.engine.includes(item.file.name));
          if (match) {
            return {
              ...item,
              status: match.status === 'success' ? 'DONE' : 'FAILED',
              result: match
            };
          }
          return item;
        })
      );
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    if (!isProcessing) setItems([]);
  };

  const handleExport = async () => {
    if (items.length === 0) return;
    const summaryData = items.map((i) => ({
      filename: i.file.name,
      size_bytes: i.file.size,
      status: i.status,
      verdict: i.result?.result || 'N/A',
      confidence: i.result?.confidence || null
    }));
    const res = await exportReport({ batch_records: summaryData }, 'json');
    const blob = new Blob([res.content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch_cifake_results.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const doneCount = items.filter((i) => i.status === 'DONE').length;
  const failedCount = items.filter((i) => i.status === 'FAILED').length;

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="border-b border-border/80 pb-3.5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold font-mono tracking-wider uppercase text-foreground">
            Batch
          </h2>
          <p className="text-xs font-mono text-muted-foreground mt-0.5">
            Queue scan
          </p>
        </div>
        <ListOrdered size={16} className="text-muted-foreground" />
      </div>

      {/* Controls Bar */}
      <div className="p-5 rounded-xl border border-border bg-surface/50 flex flex-wrap items-center justify-between gap-4">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,.jpg,.jpeg,.png,.webp,.avif,.bmp,.tiff,.tif,.gif,.ico,.heic,.heif,.svg"
          onChange={handleAddFiles}
          className="hidden"
        />

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => inputRef.current?.click()}
            className="px-4 py-2 rounded-md text-sm font-mono font-medium border border-border bg-background hover:bg-surface text-foreground transition-colors flex items-center gap-2"
          >
            <UploadCloud size={15} />
            <span>Add Images</span>
          </button>

          <button
            onClick={handleStartBatch}
            disabled={items.length === 0 || isProcessing}
            className="px-4 py-2 rounded-md text-sm font-mono font-semibold bg-foreground text-background hover:opacity-90 transition-opacity flex items-center gap-2 shadow-xs disabled:opacity-50"
          >
            <Play size={13} fill="currentColor" />
            <span>{isProcessing ? 'Processing...' : 'Start'}</span>
          </button>
        </div>

        <div className="flex items-center gap-4 text-sm font-mono text-muted-foreground">
          <span>Total: <strong className="text-foreground">{items.length}</strong></span>
          <span>Done: <strong className="text-foreground">{doneCount}</strong></span>
          {failedCount > 0 && <span className="text-fake font-semibold">Failed: {failedCount}</span>}

          {items.length > 0 && (
            <div className="flex items-center gap-2 pl-2 border-l border-border/60">
              <button
                onClick={handleExport}
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                title="Export JSON"
              >
                <Download size={16} />
              </button>
              <button
                onClick={handleClear}
                className="p-1.5 text-muted-foreground hover:text-fake transition-colors"
                title="Clear all"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Queue List */}
      {items.length === 0 ? (
        <div className="py-20 text-center text-sm font-mono text-muted-foreground">
          Queue is empty. Click 'Add Images' to load files.
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-surface/40">
          <div className="divide-y divide-border/60 font-mono text-sm">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-4 flex items-center justify-between gap-4 hover:bg-surface-subtle transition-colors"
              >
                <div className="truncate max-w-md flex items-center gap-2.5">
                  <span className="text-foreground font-medium truncate">
                    {item.file.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({formatBytes(item.file.size)})
                  </span>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {item.status === 'DONE' && item.result && (
                    <>
                      <StatusIndicator result={item.result.result} size="sm" />
                      <span className="font-semibold text-foreground">
                        {item.result.confidence ? `${(item.result.confidence * 100).toFixed(1)}%` : '—'}
                      </span>
                    </>
                  )}
                  {item.status === 'RUNNING' && (
                    <span className="text-muted-foreground animate-pulse">Running...</span>
                  )}
                  {item.status === 'QUEUE' && (
                    <span className="text-xs text-muted-foreground">Queued</span>
                  )}
                  {item.status === 'FAILED' && (
                    <span className="text-xs text-fake">Failed</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

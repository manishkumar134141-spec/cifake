import React from 'react';
import { HistoryRecord } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import { StatusIndicator } from '../components/common/StatusIndicator';
import { formatTimestamp, formatBytes } from '../lib/utils';
import { History, Trash2, Clock, Cpu, HardDrive } from 'lucide-react';

interface HistoryPageProps {
  history: HistoryRecord[];
  onDeleteRecord: (id: string) => void;
  onClearHistory: () => void;
  onSelectRecord?: (record: HistoryRecord) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  history,
  onDeleteRecord,
  onClearHistory,
}) => {
  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-border/80 pb-3.5">
        <div>
          <h2 className="text-base font-bold font-mono tracking-wider uppercase text-foreground">
            History
          </h2>
          <p className="text-xs font-mono text-muted-foreground mt-0.5">
            Session records
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 rounded-md transition-colors"
          >
            <Trash2 size={14} />
            <span>Clear</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="py-20">
          <EmptyState
            icon={History}
            title="No analyses"
            description="Run image authenticity inference to see real records here."
          />
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-surface/40">
          <div className="divide-y divide-border/60">
            {history.map((item) => (
              <div
                key={item.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-subtle transition-colors"
              >
                {/* Left: Thumbnail & Name */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-14 h-14 rounded-lg border border-border overflow-hidden bg-background shrink-0 flex items-center justify-center">
                    <img
                      src={item.thumbnail}
                      alt={item.filename}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <p className="text-sm font-mono font-medium text-foreground truncate max-w-[280px]">
                        {item.filename}
                      </p>
                      <span className="text-xs font-mono px-2 py-0.5 rounded border border-border bg-surface text-muted-foreground uppercase flex items-center gap-1">
                        <Cpu size={12} />
                        <span>{item.model}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} />
                        <span>{formatTimestamp(item.timestamp)}</span>
                      </div>
                      {item.file_size_bytes && (
                        <div className="flex items-center gap-1.5">
                          <HardDrive size={13} />
                          <span>{formatBytes(item.file_size_bytes)}</span>
                        </div>
                      )}
                      <span>{item.processing_time_ms} ms</span>
                    </div>
                  </div>
                </div>

                {/* Right: Verdict & Action */}
                <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0">
                  <div className="text-right">
                    <StatusIndicator result={item.result} size="sm" />
                    <div className="text-sm font-mono font-semibold text-foreground mt-0.5">
                      {(item.confidence * 100).toFixed(1)}%
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteRecord(item.id)}
                    className="p-2 rounded text-muted-foreground hover:text-fake transition-colors"
                    title="Delete"
                    aria-label="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

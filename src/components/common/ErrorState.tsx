import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Analysis failed',
  message,
  onRetry,
  className
}) => {
  return (
    <div
      role="alert"
      className={cn(
        'p-4 rounded border border-fake/30 bg-fake-subtle text-foreground flex items-start gap-3',
        className
      )}
    >
      <AlertTriangle size={18} className="text-fake shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-fake">{title}</h4>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium rounded border border-border bg-surface hover:bg-surface-subtle transition-colors"
        >
          <RotateCcw size={12} />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
};

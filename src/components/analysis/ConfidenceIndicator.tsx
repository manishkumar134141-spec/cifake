import React from 'react';
import { AnalysisResultType } from '../../types';
import { cn } from '../../lib/utils';

interface ConfidenceIndicatorProps {
  confidence: number; // 0.0 to 1.0
  result: AnalysisResultType;
  className?: string;
}

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  confidence,
  result,
  className
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round(confidence * 1000) / 10));
  const isReal = result === 'REAL';
  const isFake = result === 'AI-GENERATED';

  // 20 precision segments for forensic instrument gauge
  const totalSegments = 20;
  const activeSegments = Math.round((percentage / 100) * totalSegments);

  return (
    <div className={cn('space-y-2 w-full', className)}>
      <div className="flex justify-between items-center text-[11px] font-mono">
        <span className="text-muted-foreground uppercase tracking-wider">Calibration Certainty</span>
        <span
          className={cn(
            'font-semibold',
            isReal && 'text-real dark:text-emerald-400',
            isFake && 'text-fake dark:text-rose-400',
            !isReal && !isFake && 'text-uncertain dark:text-amber-400'
          )}
        >
          {percentage.toFixed(1)}%
        </span>
      </div>

      {/* Segmented bar indicator */}
      <div className="flex items-center gap-1 w-full h-2">
        {Array.from({ length: totalSegments }).map((_, i) => {
          const isActive = i < activeSegments;
          return (
            <div
              key={i}
              className={cn(
                'flex-1 h-full rounded-2xs transition-all duration-300',
                isActive
                  ? isReal
                    ? 'bg-real dark:bg-emerald-500'
                    : isFake
                    ? 'bg-fake dark:bg-rose-500'
                    : 'bg-uncertain dark:bg-amber-500'
                  : 'bg-muted/60 dark:bg-muted/40'
              )}
            />
          );
        })}
      </div>

      {/* Precision scale markers */}
      <div className="flex justify-between items-center text-[9px] font-mono text-muted-foreground/60 px-0.5">
        <span>50% (Threshold)</span>
        <span>75%</span>
        <span>100%</span>
      </div>
    </div>
  );
};

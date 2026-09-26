import React from 'react';
import { AnalysisResultType } from '../../types';
import { ShieldCheck, ShieldAlert, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StatusIndicatorProps {
  result: AnalysisResultType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  result,
  size = 'md',
  showIcon = true,
  className
}) => {
  const isReal = result === 'REAL';
  const isFake = result === 'AI-GENERATED';

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-sm px-2.5 py-1 gap-2',
    lg: 'text-base px-3 py-1.5 gap-2.5 font-semibold'
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 18
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm font-mono tracking-wider uppercase border',
        sizeClasses[size],
        isReal && 'border-real/30 bg-real-subtle text-real dark:border-real/40 dark:text-emerald-400',
        isFake && 'border-fake/30 bg-fake-subtle text-fake dark:border-fake/40 dark:text-rose-400',
        !isReal && !isFake && 'border-uncertain/30 bg-uncertain-subtle text-uncertain dark:border-uncertain/40 dark:text-amber-400',
        className
      )}
      role="status"
      aria-label={`Analysis result: ${result}`}
    >
      {showIcon && (
        <>
          {isReal && <ShieldCheck size={iconSizes[size]} className="shrink-0" />}
          {isFake && <ShieldAlert size={iconSizes[size]} className="shrink-0" />}
          {!isReal && !isFake && <AlertCircle size={iconSizes[size]} className="shrink-0" />}
        </>
      )}
      <span>{result}</span>
    </span>
  );
};

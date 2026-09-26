import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center text-muted-foreground', className)}>
      <div className="p-3 mb-3 rounded-full bg-surface border border-border">
        <Icon size={20} strokeWidth={1.5} className="text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground tracking-tight">{title}</p>
      {description && <p className="text-xs text-muted-foreground mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

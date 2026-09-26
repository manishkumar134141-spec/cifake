import React from 'react';
import { AnalysisResponse, AnalysisDetails } from '../../types';
import { formatBytes } from '../../lib/utils';
import { Cpu, Shield, Gauge, Timer, Maximize2, HardDrive, Activity } from 'lucide-react';

interface MetadataGridProps {
  result: AnalysisResponse;
}

export const MetadataGrid: React.FC<MetadataGridProps> = ({ result }) => {
  const details: Partial<AnalysisDetails> = result.details || {};
  const dims = details.dimensions ? `${details.dimensions[0]} × ${details.dimensions[1]}` : null;
  const fileSize = details.file_size_bytes ? formatBytes(details.file_size_bytes) : null;

  const rows = [
    { icon: Cpu, label: 'MODEL', value: result.model.toUpperCase() },
    { icon: Shield, label: 'VERDICT', value: result.result },
    { icon: Gauge, label: 'CONFIDENCE', value: `${(result.confidence * 100).toFixed(1)}%` },
    { icon: Timer, label: 'TIME', value: `${result.processing_time_ms} ms` },
    { icon: Maximize2, label: 'INPUT', value: details.input_resolution || '32 × 32 RGB' },
    ...(dims ? [{ icon: Maximize2, label: 'DIMENSIONS', value: dims }] : []),
    ...(fileSize ? [{ icon: HardDrive, label: 'SIZE', value: fileSize }] : []),
    ...(details.gradient_kurtosis !== undefined ? [{ icon: Activity, label: 'GRADIENT KURTOSIS', value: `${details.gradient_kurtosis}` }] : []),
    ...(details.spectral_slope !== undefined ? [{ icon: Activity, label: 'SPECTRAL SLOPE (β)', value: `${details.spectral_slope}` }] : []),
    ...(details.chroma_ratio !== undefined ? [{ icon: Activity, label: 'CHROMA RATIO', value: `${details.chroma_ratio}` }] : []),
    ...(details.high_freq_variance !== undefined ? [{ icon: Activity, label: 'VARIANCE', value: `${details.high_freq_variance}` }] : []),
  ];

  return (
    <div className="w-full space-y-3">
      <div className="text-xs font-mono font-medium tracking-wider text-muted-foreground uppercase flex items-center gap-2 pb-1.5 border-b border-border/70">
        <Activity size={14} />
        <span>INFERENCE METADATA</span>
      </div>
      <div className="divide-y divide-border/60">
        {rows.map((row, idx) => {
          const Icon = row.icon;
          return (
            <div key={idx} className="py-2.5 flex justify-between items-center text-sm font-mono">
              <div className="flex items-center gap-2.5 text-muted-foreground text-xs">
                <Icon size={14} className="shrink-0 opacity-80" />
                <span>{row.label}</span>
              </div>
              <span className="text-foreground font-semibold text-right">{row.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { BenchmarkData } from '../types';
import { fetchBenchmark } from '../services/api';
import { Database, Image as ImageIcon, Sparkles, Grid, BarChart3, AlertCircle } from 'lucide-react';

export const BenchmarkPage: React.FC = () => {
  const [data, setData] = useState<BenchmarkData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBenchmark().then((res) => {
      setData(res);
      setLoading(false);
    });
  }, []);

  if (loading || !data) {
    return (
      <div className="w-full max-w-5xl mx-auto p-8 text-xs font-mono text-muted-foreground animate-pulse">
        Loading benchmark...
      </div>
    );
  }

  const kpis = [
    { icon: Database, label: 'TOTAL DATASET', value: '120,000', sub: 'Balanced' },
    { icon: ImageIcon, label: 'REAL (CIFAR-10)', value: '60,000', sub: 'Natural' },
    { icon: Sparkles, label: 'SYNTHETIC (SD 1.4)', value: '60,000', sub: 'Generated' },
    { icon: Grid, label: 'CLASSES', value: '10', sub: 'Categories' },
  ];

  const validationMetrics = [
    { label: 'PaperCNN Accuracy', value: `${(data.paper_cnn_accuracy * 100).toFixed(2)}%` },
    { label: 'PaperCNN Precision', value: `${(data.paper_cnn_precision * 100).toFixed(2)}%` },
    { label: 'PaperCNN Recall', value: `${(data.paper_cnn_recall * 100).toFixed(2)}%` },
    { label: 'PaperCNN F1', value: `${(data.paper_cnn_f1 * 100).toFixed(2)}%` },
    { label: 'PaperCNN ROC-AUC', value: `${data.paper_cnn_roc_auc.toFixed(4)}` },
    { label: 'ResNet18 Peak Acc', value: `${(data.resnet18_peak_accuracy * 100).toFixed(2)}%` },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="border-b border-border/80 pb-3.5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold font-mono tracking-wider uppercase text-foreground">
            Benchmark
          </h2>
          <p className="text-xs font-mono text-muted-foreground mt-0.5">
            Validation data
          </p>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded-md border border-border bg-surface text-muted-foreground uppercase">
          32×32 RGB
        </span>
      </div>

      {/* Dataset Overview KPIs with Real Icons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="p-5 rounded-xl border border-border bg-surface/50 space-y-2.5">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-mono tracking-wider uppercase font-medium">{kpi.label}</span>
                <Icon size={16} />
              </div>
              <div className="text-3xl font-bold font-mono text-foreground">{kpi.value}</div>
              <span className="text-xs font-mono text-muted-foreground">{kpi.sub}</span>
            </div>
          );
        })}
      </div>

      {/* Controlled Validation Results */}
      <div className="p-6 rounded-xl border border-border bg-surface/40 space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <BarChart3 size={17} className="text-foreground" />
            <h3 className="text-sm font-bold font-mono text-foreground uppercase tracking-wider">
              Validation Metrics
            </h3>
          </div>
          <span className="text-xs font-mono text-muted-foreground">Test Split</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-1">
          {validationMetrics.map((item, idx) => (
            <div key={idx} className="p-4 rounded-lg border border-border/60 bg-background font-mono">
              <span className="text-xs text-muted-foreground uppercase">{item.label}</span>
              <div className="text-xl font-bold text-foreground mt-1">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Semantic Classes */}
      <div className="p-4 rounded-lg border border-border bg-surface/40 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-mono uppercase text-muted-foreground">
          <Grid size={13} />
          <span>Classes</span>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {data.classes.map((cls) => (
            <span
              key={cls}
              className="px-2 py-0.5 rounded text-[11px] font-mono border border-border bg-background text-foreground uppercase"
            >
              {cls}
            </span>
          ))}
        </div>
      </div>

      {/* Scope Disclaimer - Non Bulky */}
      <div className="p-3.5 rounded-lg border border-border/70 bg-surface/30 flex items-center gap-2.5 text-xs font-mono text-muted-foreground">
        <AlertCircle size={15} className="shrink-0 text-muted-foreground" />
        <span>Validation metrics on controlled 32×32 benchmark. Output indicates model probability, not legal certification.</span>
      </div>
    </div>
  );
};

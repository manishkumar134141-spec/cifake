import React, { useEffect, useState } from 'react';
import { AnalysisResponse, MetadataInfo, ProvenanceInfo, RobustnessData, GradCAMData } from '../../types';
import { ConfidenceIndicator } from './ConfidenceIndicator';
import { MetadataGrid } from './MetadataGrid';
import { fetchMetadata, fetchProvenance, runRobustness, fetchGradCAM, exportReport } from '../../services/api';
import {
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  FileText,
  Eye,
  Activity,
  Download,
  Layers
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface ResultDisplayProps {
  result: AnalysisResponse;
  file: File;
  onReset: () => void;
  onNavigateCompare?: () => void;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({
  result,
  file,
  onReset,
  onNavigateCompare
}) => {
  const [displayConfidence, setDisplayConfidence] = useState(0);
  const targetConfidence = result.confidence * 100;
  const isReal = result.result === 'REAL';
  const isFake = result.result === 'AI-GENERATED';

  // Secondary Tool State
  const [activeTool, setActiveTool] = useState<'meta' | 'evidence' | 'robustness' | 'export' | null>('meta');
  const [metadata, setMetadata] = useState<MetadataInfo | null>(null);
  const [provenance, setProvenance] = useState<ProvenanceInfo | null>(null);
  const [robustness, setRobustness] = useState<RobustnessData | null>(null);
  const [gradcam, setGradcam] = useState<GradCAMData | null>(null);
  const [loadingTool, setLoadingTool] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Smooth numeric counter animation
  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 600;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayConfidence(easeOut * targetConfidence);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [targetConfidence]);

  // Load Evidence / Grad-CAM
  const handleLoadEvidence = async () => {
    setActiveTool('evidence');
    if (!gradcam) {
      setLoadingTool(true);
      try {
        const cam = await fetchGradCAM(file, result.model);
        setGradcam(cam);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingTool(false);
      }
    }
  };

  // Load Robustness Test
  const handleLoadRobustness = async () => {
    setActiveTool('robustness');
    if (!robustness) {
      setLoadingTool(true);
      try {
        const rob = await runRobustness(file, result.model);
        setRobustness(rob);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingTool(false);
      }
    }
  };

  // Load Details (Metadata + Provenance)
  const handleLoadDetails = async () => {
    setActiveTool('meta');
    if (!metadata || !provenance) {
      setLoadingTool(true);
      try {
        const [meta, prov] = await Promise.all([
          fetchMetadata(file),
          fetchProvenance(file)
        ]);
        setMetadata(meta);
        setProvenance(prov);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingTool(false);
      }
    }
  };

  // Handle Export Download
  const handleExport = async (format: 'json' | 'csv' | 'summary') => {
    try {
      const dataToExport = {
        filename: file.name,
        result: result.result,
        confidence: result.confidence,
        model: result.model,
        processing_time_ms: result.processing_time_ms,
        timestamp: new Date().toISOString(),
        details: result.details
      };
      const res = await exportReport(dataToExport, format);
      const blob = new Blob([res.content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.filename;
      a.click();
      URL.revokeObjectURL(url);
      setExportNotice(`Exported ${res.filename}`);
      setTimeout(() => setExportNotice(null), 3000);
    } catch (e) {
      setExportNotice('Export failed');
    }
  };

  return (
    <div className="w-full flex flex-col space-y-5">
      {/* Primary Result Headline */}
      <div
        className={cn(
          'p-7 rounded-xl border space-y-5 transition-all',
          isReal
            ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/40'
            : isFake
            ? 'bg-rose-50/70 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/40'
            : 'bg-amber-50/70 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/40'
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono tracking-widest text-muted-foreground uppercase font-medium">
            VERDICT
          </span>
          <div className="flex items-center gap-2 text-sm font-mono font-semibold">
            {isReal && <ShieldCheck size={17} className="text-emerald-600 dark:text-emerald-400" />}
            {isFake && <ShieldAlert size={17} className="text-rose-600 dark:text-rose-400" />}
            {!isReal && !isFake && <AlertCircle size={17} className="text-amber-600 dark:text-amber-400" />}
            <span
              className={cn(
                isReal && 'text-emerald-700 dark:text-emerald-400',
                isFake && 'text-rose-700 dark:text-rose-400',
                !isReal && !isFake && 'text-amber-700 dark:text-amber-400'
              )}
            >
              {result.result}
            </span>
          </div>
        </div>

        {/* Big Bold Typography */}
        <div className="space-y-1.5">
          <h2
            className={cn(
              'text-5xl md:text-6xl font-black tracking-tight font-mono',
              isReal && 'text-emerald-700 dark:text-emerald-400',
              isFake && 'text-rose-700 dark:text-rose-400',
              !isReal && !isFake && 'text-amber-700 dark:text-amber-400'
            )}
          >
            {result.result}
          </h2>

          <div className="flex items-baseline gap-2.5 pt-1 font-mono">
            <span className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              {displayConfidence.toFixed(1)}%
            </span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
              CONFIDENCE
            </span>
          </div>
        </div>

        {/* Minimal Bar */}
        <div className="pt-2">
          <ConfidenceIndicator confidence={result.confidence} result={result.result} />
        </div>

        {/* Forensic Observations from Gemini / Visual Review */}
        {result.details?.observations && result.details.observations.length > 0 && (
          <div className="pt-4 border-t border-border/40 space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
              Visual Forensic Observations
            </span>
            <ul className="text-xs text-foreground/80 space-y-1.5 list-disc list-inside leading-relaxed font-sans">
              {result.details.observations.map((obs: string, idx: number) => (
                <li key={idx} className="break-words">{obs}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Diagnostic Indicators from ResNet18 / Signal Forensics */}
        {(!result.details?.observations || result.details.observations.length === 0) &&
          result.details?.indicators && result.details.indicators.length > 0 && (
          <div className="pt-4 border-t border-border/40 space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
              Diagnostic Indicators
            </span>
            <ul className="text-xs text-foreground/80 space-y-1.5 list-disc list-inside leading-relaxed font-sans">
              {result.details.indicators.map((ind: string, idx: number) => (
                <li key={idx} className="break-words">{ind}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        <button
          onClick={handleLoadDetails}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-mono transition-colors border',
            activeTool === 'meta'
              ? 'border-foreground bg-foreground text-background font-semibold shadow-xs'
              : 'border-border bg-background hover:bg-surface text-foreground'
          )}
        >
          <FileText size={14} />
          <span>Details</span>
        </button>

        <button
          onClick={handleLoadEvidence}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-mono transition-colors border',
            activeTool === 'evidence'
              ? 'border-foreground bg-foreground text-background font-semibold shadow-xs'
              : 'border-border bg-background hover:bg-surface text-foreground'
          )}
        >
          <Eye size={14} />
          <span>Evidence</span>
        </button>

        <button
          onClick={handleLoadRobustness}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-mono transition-colors border',
            activeTool === 'robustness'
              ? 'border-foreground bg-foreground text-background font-semibold shadow-xs'
              : 'border-border bg-background hover:bg-surface text-foreground'
          )}
        >
          <Activity size={14} />
          <span>Robustness</span>
        </button>

        <button
          onClick={() => setActiveTool('export')}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-mono transition-colors border',
            activeTool === 'export'
              ? 'border-foreground bg-foreground text-background font-semibold shadow-xs'
              : 'border-border bg-background hover:bg-surface text-foreground'
          )}
        >
          <Download size={14} />
          <span>Export</span>
        </button>

        {onNavigateCompare && (
          <button
            onClick={onNavigateCompare}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-mono border border-border bg-background hover:bg-surface text-foreground transition-colors"
          >
            <Layers size={14} />
            <span>Compare</span>
          </button>
        )}
      </div>

      {/* Secondary Tool Panel */}
      <div className="p-6 rounded-xl border border-border bg-surface/50 space-y-5">
        {loadingTool && (
          <div className="py-6 text-sm font-mono text-muted-foreground animate-pulse text-center">
            Executing analysis module...
          </div>
        )}

        {!loadingTool && activeTool === 'meta' && (
          <div className="space-y-4">
            <MetadataGrid result={result} />

            {/* Provenance Badge */}
            <div className="pt-3 border-t border-border/60 flex items-center justify-between text-sm font-mono">
              <span className="text-muted-foreground">PROVENANCE (C2PA)</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-muted-foreground">
                <ShieldCheck size={15} />
                <span>{provenance ? provenance.status : 'NONE DETECTED'}</span>
              </span>
            </div>
          </div>
        )}

        {!loadingTool && activeTool === 'evidence' && gradcam && (
          <div className="space-y-4 font-mono">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">GRAD-CAM LAYER</span>
              <span className="font-semibold text-foreground">{gradcam.target_layer}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground">ACTIVATION HEATMAP</span>
                <img
                  src={gradcam.heatmap_base64}
                  alt="Grad-CAM Heatmap"
                  className="rounded-lg border border-border w-full object-cover"
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground">BLENDED OVERLAY</span>
                <img
                  src={gradcam.overlay_base64}
                  alt="Grad-CAM Overlay"
                  className="rounded-lg border border-border w-full object-cover"
                />
              </div>
            </div>
          </div>
        )}

        {!loadingTool && activeTool === 'robustness' && robustness && (
          <div className="space-y-4 font-mono">
            <div className="flex items-center justify-between text-sm pb-2.5 border-b border-border/60">
              <span className="text-muted-foreground">DECISION SHIFT</span>
              <span
                className={cn(
                  'font-semibold px-2.5 py-1 rounded text-xs',
                  robustness.shift_detected
                    ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                )}
              >
                {robustness.shift_detected ? 'SHIFT DETECTED' : 'STABLE'}
              </span>
            </div>

            <div className="divide-y divide-border/60 text-sm">
              {robustness.runs.map((r, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between">
                  <span className="text-muted-foreground">{r.transformation}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-foreground">{r.result}</span>
                    <span className="text-xs text-muted-foreground">
                      {(r.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loadingTool && activeTool === 'export' && (
          <div className="space-y-4 font-mono">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              Download Report
            </span>
            <div className="grid grid-cols-3 gap-3 pt-1">
              <button
                onClick={() => handleExport('json')}
                className="py-2.5 px-4 rounded-lg border border-border bg-background hover:bg-surface text-sm font-semibold text-foreground transition-colors"
              >
                JSON
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="py-2.5 px-4 rounded-lg border border-border bg-background hover:bg-surface text-sm font-semibold text-foreground transition-colors"
              >
                CSV
              </button>
              <button
                onClick={() => handleExport('summary')}
                className="py-2.5 px-4 rounded-lg border border-border bg-background hover:bg-surface text-sm font-semibold text-foreground transition-colors"
              >
                Summary
              </button>
            </div>
            {exportNotice && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 pt-1 text-center">
                {exportNotice}
              </p>
            )}
          </div>
        )}

        <button
          onClick={onReset}
          className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-lg border border-border bg-background hover:bg-surface text-foreground font-mono text-sm font-medium transition-colors shadow-xs"
        >
          <RotateCcw size={15} />
          <span>New Scan</span>
        </button>
      </div>
    </div>
  );
};

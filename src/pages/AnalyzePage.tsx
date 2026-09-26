import React, { useState } from 'react';
import { useAnalysis } from '../hooks/useAnalysis';
import { UploadZone } from '../components/analysis/UploadZone';
import { ImagePreview } from '../components/analysis/ImagePreview';
import { ResultDisplay } from '../components/analysis/ResultDisplay';
import { ErrorState } from '../components/common/ErrorState';
import { HistoryRecord, AnalysisMode } from '../types';
import { Cpu, Zap, Scan } from 'lucide-react';
import { cn } from '../lib/utils';

interface AnalyzePageProps {
  onSaveHistory: (record: HistoryRecord) => void;
  onNavigateCompare?: () => void;
}

export const AnalyzePage: React.FC<AnalyzePageProps> = ({ onSaveHistory, onNavigateCompare }) => {
  const {
    file,
    previewUrl,
    imageDimensions,
    selectedModel,
    setSelectedModel,
    status,
    error,
    result,
    handleSelectFile,
    handleRemoveFile,
    handleAnalyze,
    handleReset
  } = useAnalysis({ onAnalysisSuccess: onSaveHistory });

  const [mode, setMode] = useState<AnalysisMode>('FAST');

  const isIdle = status === 'idle' || !file;
  const isAnalyzing = status === 'analyzing';
  const isComplete = status === 'complete' && result;

  const handleModeChange = (newMode: AnalysisMode) => {
    setMode(newMode);
    if (newMode === 'FAST') {
      setSelectedModel('resnet18');
    } else if (newMode === 'DEEP') {
      setSelectedModel('paper_cnn');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)]">
      {/* State 1: Clean Initial Upload Screen */}
      {isIdle && (
        <div className="w-full max-w-2xl py-8">
          <UploadZone onFileSelect={handleSelectFile} />
          {error && (
            <div className="mt-4">
              <ErrorState message={error} onRetry={handleReset} />
            </div>
          )}
        </div>
      )}

      {/* State 2 & 3: File Uploaded / Analyzing / Completed Result */}
      {!isIdle && previewUrl && file && (
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Image Preview Viewport */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            <ImagePreview
              previewUrl={previewUrl}
              filename={file.name}
              dimensions={imageDimensions}
              fileSizeBytes={file.size}
              isAnalyzing={isAnalyzing}
              onRemove={handleRemoveFile}
            />

            {error && (
              <ErrorState
                title="Analysis failed"
                message={error}
                onRetry={handleAnalyze}
              />
            )}
          </div>

          {/* Right Column: Controls or Result */}
          <div className="lg:col-span-5 flex flex-col space-y-5">
            {!isComplete ? (
              <div className="p-6 rounded-xl border border-border bg-surface/60 space-y-6">
                {/* Mode Selector */}
                <div className="flex items-center justify-between border-b border-border/70 pb-3.5">
                  <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-medium">
                    SCAN MODE
                  </span>
                  <div className="flex items-center gap-1.5">
                    {(['FAST', 'DEEP', 'CUSTOM'] as AnalysisMode[]).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleModeChange(m)}
                        className={cn(
                          'px-3 py-1 rounded-md text-xs font-mono transition-colors',
                          mode === m
                            ? 'bg-foreground text-background font-semibold shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Model Selector */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={isAnalyzing}
                    onClick={() => setSelectedModel('resnet18')}
                    className={cn(
                      'p-4 text-left rounded-lg border transition-all flex flex-col',
                      selectedModel === 'resnet18'
                        ? 'border-foreground bg-foreground text-background shadow-xs'
                        : 'border-border bg-background hover:bg-surface text-foreground'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Cpu size={14} />
                      <span className="text-sm font-mono font-bold">ResNet18</span>
                    </div>
                    <span className="text-xs font-mono opacity-80 mt-1.5">11.17M · 97.8%</span>
                  </button>

                  <button
                    type="button"
                    disabled={isAnalyzing}
                    onClick={() => setSelectedModel('paper_cnn')}
                    className={cn(
                      'p-4 text-left rounded-lg border transition-all flex flex-col',
                      selectedModel === 'paper_cnn'
                        ? 'border-foreground bg-foreground text-background shadow-xs'
                        : 'border-border bg-background hover:bg-surface text-foreground'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Cpu size={14} />
                      <span className="text-sm font-mono font-bold">PaperCNN</span>
                    </div>
                    <span className="text-xs font-mono opacity-80 mt-1.5">141K · 95.7%</span>
                  </button>
                </div>

                {/* Action Button */}
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className={cn(
                    'w-full py-3.5 px-6 rounded-lg text-sm font-mono uppercase tracking-wider font-semibold transition-all flex items-center justify-center gap-2.5 shadow-sm',
                    isAnalyzing
                      ? 'bg-muted text-muted-foreground cursor-wait'
                      : 'bg-foreground text-background hover:opacity-90 active:scale-[0.99]'
                  )}
                >
                  {isAnalyzing ? (
                    <>
                      <Scan size={16} className="animate-spin" />
                      <span>SCANNING</span>
                    </>
                  ) : (
                    <>
                      <Zap size={16} />
                      <span>SCAN</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <ResultDisplay
                result={result}
                file={file}
                onReset={handleReset}
                onNavigateCompare={onNavigateCompare}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

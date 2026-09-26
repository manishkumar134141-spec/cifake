import React, { useState } from 'react';
import { runCompare } from '../services/api';
import { NormalizedResult } from '../types';
import { UploadZone } from '../components/analysis/UploadZone';
import { StatusIndicator } from '../components/common/StatusIndicator';
import { Layers, Play } from 'lucide-react';
import { cn } from '../lib/utils';

export const ComparePage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [results, setResults] = useState<NormalizedResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEngines, setSelectedEngines] = useState<string[]>([
    'resnet18',
    'paper_cnn',
    'openai:gpt-4o'
  ]);

  const availableEngines = [
    { id: 'resnet18', name: 'ResNet18', type: 'detector' },
    { id: 'paper_cnn', name: 'PaperCNN', type: 'detector' },
    { id: 'openai:gpt-4o', name: 'OpenAI (GPT-4o)', type: 'vision-review' }
  ];

  const handleSelectFile = (newFile: File) => {
    setFile(newFile);
    setPreviewUrl(URL.createObjectURL(newFile));
    setResults([]);
  };

  const toggleEngine = (id: string) => {
    if (selectedEngines.includes(id)) {
      if (selectedEngines.length > 1) {
        setSelectedEngines(selectedEngines.filter((e) => e !== id));
      }
    } else {
      setSelectedEngines([...selectedEngines, id]);
    }
  };

  const handleRunCompare = async () => {
    if (!file || loading) return;
    setLoading(true);
    try {
      const res = await runCompare(file, selectedEngines);
      setResults(res.results);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="border-b border-border/80 pb-3.5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold font-mono tracking-wider uppercase text-foreground">
            Compare
          </h2>
          <p className="text-xs font-mono text-muted-foreground mt-0.5">
            Engine evaluation
          </p>
        </div>
        <Layers size={16} className="text-muted-foreground" />
      </div>

      {!file ? (
        <div className="py-12">
          <UploadZone onFileSelect={handleSelectFile} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="p-5 rounded-xl border border-border bg-surface/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt={file.name}
                  className="w-12 h-12 rounded-md border border-border object-cover"
                />
              )}
              <span className="text-sm font-mono font-medium text-foreground truncate max-w-xs">
                {file.name}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {availableEngines.map((eng) => (
                <button
                  key={eng.id}
                  onClick={() => toggleEngine(eng.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-mono border transition-all',
                    selectedEngines.includes(eng.id)
                      ? 'border-foreground bg-foreground text-background font-semibold shadow-xs'
                      : 'border-border bg-background text-muted-foreground hover:text-foreground'
                  )}
                >
                  {eng.name}
                </button>
              ))}

              <button
                onClick={handleRunCompare}
                disabled={loading}
                className="px-4 py-2 rounded-md text-sm font-mono font-semibold bg-foreground text-background hover:opacity-90 transition-opacity flex items-center gap-2 shadow-xs"
              >
                {loading ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-background animate-ping" />
                ) : (
                  <Play size={13} fill="currentColor" />
                )}
                <span>{loading ? 'Evaluating...' : 'Run'}</span>
              </button>
            </div>
          </div>

          {/* Results Comparison Grid */}
          {results.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {results.map((res, i) => (
                <div
                  key={i}
                  className="p-6 rounded-xl border border-border bg-surface/40 flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm font-mono">
                      <span className="font-bold text-foreground uppercase">{res.engine}</span>
                      <span className="text-xs uppercase px-2 py-0.5 rounded border border-border bg-background text-muted-foreground">
                        {res.provider}
                      </span>
                    </div>

                    <div className="pt-2">
                      <StatusIndicator result={res.result} size="md" />
                    </div>

                    {res.confidence !== null && res.confidence !== undefined ? (
                      <div className="pt-2 text-3xl md:text-4xl font-bold font-mono text-foreground">
                        {(res.confidence * 100).toFixed(1)}%
                      </div>
                    ) : (
                      <div className="pt-2 text-3xl md:text-4xl font-bold font-mono text-muted-foreground">
                        —
                      </div>
                    )}

                    {res.notes && res.notes.length > 0 && (
                      <p className="text-sm text-muted-foreground pt-1 leading-relaxed">
                        {res.notes[0]}
                      </p>
                    )}
                  </div>

                  <div className="border-t border-border/60 pt-3 text-xs font-mono text-muted-foreground flex justify-between">
                    <span>Latency</span>
                    <span className="font-semibold text-foreground">{res.latency_ms} ms</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

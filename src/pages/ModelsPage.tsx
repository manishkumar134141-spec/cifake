import React, { useEffect, useState } from 'react';
import { ModelSpecification } from '../types';
import { fetchModels } from '../services/api';
import { Cpu, CheckCircle2, Globe } from 'lucide-react';

export const ModelsPage: React.FC = () => {
  const [models, setModels] = useState<ModelSpecification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModels().then((data) => {
      setModels(data);
      setLoading(false);
    });
  }, []);

  const localDetectors = models.filter((m) => m.type === 'detector');
  const visionReviews = models.filter((m) => m.type === 'vision-review');

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="border-b border-border/80 pb-3.5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold font-mono tracking-wider uppercase text-foreground">
            Models
          </h2>
          <p className="text-xs font-mono text-muted-foreground mt-0.5">
            Registered engines
          </p>
        </div>
        <span className="text-xs font-mono px-3 py-1 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
          <CheckCircle2 size={13} />
          <span>Active Registry</span>
        </span>
      </div>

      {loading ? (
        <div className="text-sm font-mono text-muted-foreground animate-pulse p-4">
          Querying model registry...
        </div>
      ) : (
        <div className="space-y-8">
          {/* Section 1: Local Detectors */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-mono uppercase tracking-wider text-foreground font-bold">
              <Cpu size={16} />
              <span>Layer 1 — Local Detectors (CIFAKE Benchmark)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {localDetectors.map((model) => (
                <div
                  key={model.id}
                  className="rounded-xl border border-border bg-surface/50 p-6 space-y-5 font-mono"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-foreground">{model.name}</h3>
                      <span className="text-xs text-muted-foreground uppercase">{model.id}</span>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded border border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 font-medium">
                      Detector
                    </span>
                  </div>

                  <div className="divide-y divide-border/60 text-sm">
                    {model.parameters && (
                      <div className="py-2 flex justify-between">
                        <span className="text-xs text-muted-foreground">PARAMETERS</span>
                        <span className="font-semibold text-foreground">{model.parameters.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="py-2 flex justify-between">
                      <span className="text-xs text-muted-foreground">INPUT</span>
                      <span className="text-foreground">{model.input_resolution}</span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-xs text-muted-foreground">BENCHMARK VAL ACC</span>
                      <span className="font-semibold text-foreground">
                        {model.id === 'resnet18' ? '97.77%' : '95.68%'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Vision Review Models */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-mono uppercase tracking-wider text-muted-foreground font-bold">
              <Globe size={16} />
              <span>Layer 2 — External Vision Review Engine</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {visionReviews.map((model) => (
                <div
                  key={model.id}
                  className="rounded-xl border border-border bg-surface/30 p-6 space-y-3 font-mono"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-foreground">{model.name}</span>
                    <span className="text-xs uppercase px-2 py-0.5 rounded border border-border bg-background text-muted-foreground">
                      {model.provider}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {model.description}
                  </p>
                  <div className="pt-2 border-t border-border/50 flex justify-between text-xs text-muted-foreground">
                    <span>TYPE</span>
                    <span className="font-medium text-foreground">Multimodal Vision</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

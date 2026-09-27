import {
  AnalysisResponse,
  ModelSpecification,
  BenchmarkData,
  MetadataInfo,
  ProvenanceInfo,
  RobustnessData,
  GradCAMData,
  CompareResponse,
  NormalizedResult,
  ProviderHealth
} from '../types';
import { MODEL_REGISTRY } from '../lib/model-registry';

export function getCustomBackendUrl(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('cifake_backend_url') || '';
  }
  return '';
}

export function setCustomBackendUrl(url: string): void {
  if (typeof window !== 'undefined') {
    if (!url || !url.trim()) {
      localStorage.removeItem('cifake_backend_url');
    } else {
      localStorage.setItem('cifake_backend_url', url.trim());
    }
  }
}

export function getApiBase(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('cifake_backend_url');
    if (custom && custom.trim()) {
      const trimmed = custom.trim().replace(/\/$/, '');
      return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
    }
  }

  const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim();
  const isPlaceholder = !rawApiUrl || rawApiUrl.includes('your-backend-url') || rawApiUrl.includes('example.com');
  if (!isPlaceholder && rawApiUrl) {
    const trimmed = rawApiUrl.replace(/\/$/, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
  }

  if (typeof window !== 'undefined') {
    const isDev = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '8000';
    if (isDev) {
      return 'http://127.0.0.1:8000/api';
    }
  }
  return '/api';
}

export function getApiEndpoint(path: string): string {
  const base = getApiBase();
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

export async function checkBackendHealth(): Promise<{ status: string; service?: string; latency_ms?: number }> {
  const t0 = performance.now();
  const url = getApiEndpoint('/health');
  const response = await fetch(url);
  if (!response.ok) throw new Error('Backend service unreachable');
  const data = await response.json();
  data.latency_ms = Math.round(performance.now() - t0);
  return data;
}

export async function analyzeImage(file: File, model: string = 'hybrid'): Promise<AnalysisResponse> {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('model', model);

  const url = getApiEndpoint('/analyze');
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      body: formData,
    });
  } catch (err: any) {
    const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
    if (isVercel) {
      throw new Error('Backend unreachable from Vercel. Set your deployed backend URL in Settings (or set VITE_API_URL in Vercel Project Settings).');
    }
    throw new Error('Backend connection failed. Ensure local backend is running (python run_backend.py).');
  }

  if (!response.ok) {
    let errorMsg = 'Analysis failed.';
    try {
      const err = await response.json();
      if (err.detail) errorMsg = err.detail;
    } catch {
      errorMsg = `Server error (${response.status})`;
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export async function fetchMetadata(file: File): Promise<MetadataInfo> {
  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(getApiEndpoint('/metadata'), {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('Failed to extract image metadata');
  return res.json();
}

export async function fetchProvenance(file: File): Promise<ProvenanceInfo> {
  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(getApiEndpoint('/provenance'), {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('Failed to parse provenance manifest');
  return res.json();
}

export async function runRobustness(file: File, model: string = 'resnet18'): Promise<RobustnessData> {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('model', model);

  const res = await fetch(getApiEndpoint('/robustness'), {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('Robustness evaluation failed');
  return res.json();
}

export async function fetchGradCAM(file: File, model: string = 'resnet18'): Promise<GradCAMData> {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('model', model);

  const res = await fetch(getApiEndpoint('/evidence/gradcam'), {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('Grad-CAM calculation failed');
  return res.json();
}

export async function runCompare(file: File, models: string[] = ['resnet18', 'gemini:flash']): Promise<CompareResponse> {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('models', models.join(','));

  const res = await fetch(getApiEndpoint('/analyze/compare'), {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('Model comparison failed');
  return res.json();
}

export async function runBatch(files: File[], model: string = 'resnet18'): Promise<NormalizedResult[]> {
  const formData = new FormData();
  files.forEach((f) => formData.append('images', f));
  formData.append('model', model);

  const res = await fetch(getApiEndpoint('/analyze/batch'), {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('Batch analysis failed');
  return res.json();
}

export async function testProvider(provider: string): Promise<ProviderHealth> {
  const res = await fetch(getApiEndpoint(`/providers/${provider}/test`), {
    method: 'POST'
  });
  if (!res.ok) throw new Error(`Provider ${provider} test failed`);
  return res.json();
}

export async function getProviderStatus(provider: string = 'gemini'): Promise<{
  provider: string;
  is_configured: boolean;
  masked_key: string;
  models: string[];
}> {
  const res = await fetch(getApiEndpoint(`/providers/${provider}/status`));
  if (!res.ok) throw new Error(`Failed to get ${provider} status`);
  return res.json();
}

export async function updateProviderConfig(provider: string = 'gemini', apiKey: string): Promise<ProviderHealth> {
  const res = await fetch(getApiEndpoint(`/providers/${provider}/config`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey })
  });
  if (!res.ok) throw new Error(`Failed to configure ${provider}`);
  return res.json();
}

export async function exportReport(recordData: Record<string, any>, format: 'json' | 'csv' | 'summary'): Promise<{ filename: string; content: string; format: string }> {
  const res = await fetch(getApiEndpoint('/export'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ format, record_data: recordData })
  });
  if (!res.ok) throw new Error('Export generation failed');
  return res.json();
}

export async function fetchModels(): Promise<ModelSpecification[]> {
  try {
    const response = await fetch(getApiEndpoint('/models'));
    if (response.ok) {
      const backendModels: any[] = await response.json();
      return [
        ...backendModels.map((m) => ({ ...m, provider: 'local', type: 'detector' as const })),
        ...MODEL_REGISTRY.filter((m) => m.type === 'vision-review')
      ];
    }
  } catch {
    // fallback
  }
  return MODEL_REGISTRY;
}

export async function fetchBenchmark(): Promise<BenchmarkData> {
  try {
    const response = await fetch(getApiEndpoint('/benchmark'));
    if (response.ok) return await response.json();
  } catch {
    // fallback
  }
  return {
    total_images: 120000,
    real_images: 60000,
    fake_images: 60000,
    classes_count: 10,
    classes: ['airplane', 'automobile', 'bird', 'cat', 'deer', 'dog', 'frog', 'horse', 'ship', 'truck'],
    paper_cnn_accuracy: 0.9568,
    paper_cnn_precision: 0.9644,
    paper_cnn_recall: 0.9486,
    paper_cnn_f1: 0.9564,
    paper_cnn_roc_auc: 0.9912,
    resnet18_peak_accuracy: 0.9777,
    real_source: 'CIFAR-10',
    fake_source: 'Stable Diffusion v1.4',
    disclaimer: 'Metrics represent controlled validation results on the CIFAKE 32x32 benchmark. They do not claim universal real-world detector accuracy across arbitrary resolutions or generative pipelines.'
  };
}

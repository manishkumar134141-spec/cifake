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

const API_BASE = '/api';

export async function checkBackendHealth(): Promise<{ status: string }> {
  const response = await fetch(`${API_BASE}/health`);
  if (!response.ok) throw new Error('Backend service unreachable');
  return response.json();
}

export async function analyzeImage(file: File, model: string = 'resnet18'): Promise<AnalysisResponse> {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('model', model);

  const response = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    body: formData,
  });

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

  const res = await fetch(`${API_BASE}/metadata`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('Failed to extract image metadata');
  return res.json();
}

export async function fetchProvenance(file: File): Promise<ProvenanceInfo> {
  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`${API_BASE}/provenance`, {
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

  const res = await fetch(`${API_BASE}/robustness`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('Robustness evaluation failed');
  return res.json();
}

export async function fetchGradCAM(file: File, model: string = 'paper_cnn'): Promise<GradCAMData> {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('model', model);

  const res = await fetch(`${API_BASE}/evidence/gradcam`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('Grad-CAM calculation failed');
  return res.json();
}

export async function runCompare(file: File, models: string[] = ['resnet18', 'paper_cnn']): Promise<CompareResponse> {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('models', models.join(','));

  const res = await fetch(`${API_BASE}/analyze/compare`, {
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

  const res = await fetch(`${API_BASE}/analyze/batch`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('Batch analysis failed');
  return res.json();
}

export async function testProvider(provider: string): Promise<ProviderHealth> {
  const res = await fetch(`${API_BASE}/providers/${provider}/test`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error(`Provider ${provider} test failed`);
  return res.json();
}

export async function exportReport(recordData: Record<string, any>, format: 'json' | 'csv' | 'summary'): Promise<{ filename: string; content: string; format: string }> {
  const res = await fetch(`${API_BASE}/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ format, record_data: recordData })
  });
  if (!res.ok) throw new Error('Export generation failed');
  return res.json();
}

export async function fetchModels(): Promise<ModelSpecification[]> {
  try {
    const response = await fetch(`${API_BASE}/models`);
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
    const response = await fetch(`${API_BASE}/benchmark`);
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

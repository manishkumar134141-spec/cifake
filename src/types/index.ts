export type AnalysisResultType = 'REAL' | 'AI-GENERATED' | 'UNCERTAIN' | 'REVIEW' | 'ERROR';
export type AnalysisMode = 'FAST' | 'DEEP' | 'CUSTOM';

export interface NormalizedResult {
  engine: string;
  provider: string;
  type: 'detector' | 'vision-review';
  result: AnalysisResultType;
  score?: number | null;
  confidence?: number | null;
  latency_ms: number;
  status: 'success' | 'error';
  notes?: string[];
  error_message?: string;
}

export interface CompareResponse {
  results: NormalizedResult[];
  latency_ms: number;
}

export interface AnalysisDetails {
  filename: string;
  dimensions: [number, number];
  file_size_bytes: number;
  input_resolution: string;
  high_freq_variance?: number;
  mean_luminance?: number;
  format?: string;
  sha256?: string;
  [key: string]: any;
}

export interface AnalysisResponse {
  result: AnalysisResultType;
  confidence: number;
  model: string;
  processing_time_ms: number;
  details?: AnalysisDetails;
}

export interface MetadataInfo {
  filename: string;
  file_type: string;
  file_size_bytes: number;
  dimensions: [number, number];
  mime_type: string;
  sha256: string;
  color_mode: string;
  exif_found: boolean;
  exif_data?: Record<string, any>;
}

export interface ProvenanceInfo {
  status: 'VERIFIED' | 'FOUND' | 'NONE' | 'UNKNOWN' | 'ERROR';
  manifest_count: number;
  issuer?: string;
  claim_generator?: string;
  details?: Record<string, any>;
  disclaimer: string;
}

export interface RobustnessRun {
  transformation: string;
  result: string;
  confidence: number;
  latency_ms: number;
}

export interface RobustnessData {
  base_result: string;
  base_confidence: number;
  runs: RobustnessRun[];
  shift_detected: boolean;
  stability_score: number;
}

export interface GradCAMData {
  model: string;
  target_layer: string;
  heatmap_base64: string;
  overlay_base64: string;
  classification: string;
  confidence: number;
}

export interface ProviderHealth {
  provider: string;
  status: 'ONLINE' | 'OFFLINE' | 'NOT_CONFIGURED' | 'ERROR';
  latency_ms?: number;
  models: string[];
  error?: string;
}

export interface HistoryRecord {
  id: string;
  filename: string;
  thumbnail: string;
  result: AnalysisResultType;
  confidence: number;
  model: string;
  processing_time_ms: number;
  timestamp: number;
  dimensions?: [number, number];
  file_size_bytes?: number;
  sha256?: string;
}

export interface ModelSpecification {
  id: string;
  name: string;
  provider: string;
  parameters?: number;
  input_resolution: string;
  architecture: string;
  description: string;
  type: 'detector' | 'vision-review';
  status: string;
}

export interface BenchmarkData {
  total_images: number;
  real_images: number;
  fake_images: number;
  classes_count: number;
  classes: string[];
  paper_cnn_accuracy: number;
  paper_cnn_precision: number;
  paper_cnn_recall: number;
  paper_cnn_f1: number;
  paper_cnn_roc_auc: number;
  resnet18_peak_accuracy: number;
  real_source: string;
  fake_source: string;
  disclaimer: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';
export type ActiveTab = 'analyze' | 'compare' | 'batch' | 'history' | 'models' | 'benchmark' | 'settings' | 'api-lab';

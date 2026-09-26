import { useState, useCallback } from 'react';
import { AnalysisResponse, HistoryRecord } from '../types';
import { analyzeImage } from '../services/api';

export type AnalysisStatus = 'idle' | 'ready' | 'analyzing' | 'complete' | 'error';

interface UseAnalysisProps {
  onAnalysisSuccess?: (record: HistoryRecord) => void;
}

export function useAnalysis({ onAnalysisSuccess }: UseAnalysisProps = {}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<[number, number] | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('resnet18');
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);

  const handleSelectFile = useCallback((newFile: File) => {
    // Basic frontend verification
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(newFile.type) && !newFile.name.match(/\.(jpe?g|png|webp)$/i)) {
      setError('Unsupported file type. Please upload JPG, PNG, or WEBP.');
      setStatus('error');
      return;
    }

    if (newFile.size > 15 * 1024 * 1024) {
      setError('File size exceeds the 15 MB limit.');
      setStatus('error');
      return;
    }

    setFile(newFile);
    setError(null);
    setResult(null);

    const objectUrl = URL.createObjectURL(newFile);
    setPreviewUrl(objectUrl);

    // Read natural dimensions
    const img = new Image();
    img.onload = () => {
      setImageDimensions([img.naturalWidth, img.naturalHeight]);
      setStatus('ready');
    };
    img.onerror = () => {
      setError('Unable to load image preview.');
      setStatus('error');
    };
    img.src = objectUrl;
  }, []);

  const handleRemoveFile = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setImageDimensions(null);
    setResult(null);
    setError(null);
    setStatus('idle');
  }, [previewUrl]);

  const handleAnalyze = useCallback(async () => {
    if (!file || status === 'analyzing') return;

    setStatus('analyzing');
    setError(null);

    try {
      const response = await analyzeImage(file, selectedModel);
      setResult(response);
      setStatus('complete');

      if (onAnalysisSuccess && previewUrl) {
        const record: HistoryRecord = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          filename: file.name,
          thumbnail: previewUrl,
          result: response.result,
          confidence: response.confidence,
          model: response.model,
          processing_time_ms: response.processing_time_ms,
          timestamp: Date.now(),
          dimensions: imageDimensions || undefined,
          file_size_bytes: file.size,
        };
        onAnalysisSuccess(record);
      }
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Please verify the image and try again.');
      setStatus('error');
    }
  }, [file, status, selectedModel, previewUrl, imageDimensions, onAnalysisSuccess]);

  const handleReset = useCallback(() => {
    handleRemoveFile();
  }, [handleRemoveFile]);

  return {
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
    handleReset,
  };
}

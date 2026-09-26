from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal

# Normalized result for any engine (Detector or Vision Review)
class NormalizedResult(BaseModel):
    engine: str
    provider: str
    type: Literal["detector", "vision-review"]
    result: Literal["REAL", "AI-GENERATED", "UNCERTAIN", "REVIEW", "ERROR"]
    score: Optional[float] = None
    confidence: Optional[float] = None
    latency_ms: int
    status: Literal["success", "error"]
    notes: Optional[List[str]] = None
    error_message: Optional[str] = None

class AnalysisResult(BaseModel):
    result: str = Field(..., description="Classification result: 'REAL', 'AI-GENERATED', or 'UNCERTAIN'")
    confidence: float = Field(..., ge=0.0, le=1.0)
    model: str
    processing_time_ms: int
    details: Optional[Dict[str, Any]] = None

class DeepScanResult(BaseModel):
    primary: NormalizedResult
    secondary: Optional[NormalizedResult] = None
    metadata: Optional[Dict[str, Any]] = None
    provenance: Optional[Dict[str, Any]] = None

class CompareResponse(BaseModel):
    results: List[NormalizedResult]
    latency_ms: int

class MetadataResponse(BaseModel):
    filename: str
    file_type: str
    file_size_bytes: int
    dimensions: List[int]
    mime_type: str
    sha256: str
    color_mode: str
    exif_found: bool
    exif_data: Optional[Dict[str, Any]] = None

class ProvenanceResponse(BaseModel):
    status: Literal["VERIFIED", "FOUND", "NONE", "UNKNOWN", "ERROR"]
    manifest_count: int
    issuer: Optional[str] = None
    claim_generator: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    disclaimer: str = "Absence of provenance manifest does not indicate synthetic generation."

class RobustnessRun(BaseModel):
    transformation: str
    result: str
    confidence: float
    latency_ms: int

class RobustnessResponse(BaseModel):
    base_result: str
    base_confidence: float
    runs: List[RobustnessRun]
    shift_detected: bool
    stability_score: float

class GradCAMResponse(BaseModel):
    model: str
    target_layer: str
    heatmap_base64: str
    overlay_base64: str
    classification: str
    confidence: float

class ProviderHealthResponse(BaseModel):
    provider: str
    status: Literal["ONLINE", "OFFLINE", "NOT_CONFIGURED", "ERROR"]
    latency_ms: Optional[int] = None
    models: List[str] = []
    error: Optional[str] = None

class ExportRequest(BaseModel):
    format: Literal["json", "csv", "summary"]
    record_data: Dict[str, Any]

class ExportResponse(BaseModel):
    format: str
    filename: str
    content: str

class ModelInfo(BaseModel):
    id: str
    name: str
    provider: str
    parameters: Optional[int] = None
    input_resolution: str
    architecture: str
    description: str
    type: Literal["detector", "vision-review"]
    status: str

class BenchmarkMetrics(BaseModel):
    total_images: int
    real_images: int
    fake_images: int
    classes_count: int
    classes: List[str]
    paper_cnn_accuracy: float
    paper_cnn_precision: float
    paper_cnn_recall: float
    paper_cnn_f1: float
    paper_cnn_roc_auc: float
    resnet18_peak_accuracy: float
    real_source: str
    fake_source: str
    disclaimer: str

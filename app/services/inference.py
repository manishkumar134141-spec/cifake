import time
import numpy as np
from app.services.model_loader import get_model
from typing import Dict, Any

def run_inference(tensor_input: np.ndarray, model_name: str = "resnet18", metadata: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Execute real model inference using PyTorch and return classification metrics.
    """
    start_time = time.perf_counter()

    import torch

    model = get_model(model_name)
    with torch.no_grad():
        x = torch.from_numpy(tensor_input).float()
        raw_output = model(x)
        logit = raw_output.squeeze().item()
        prob_fake = torch.sigmoid(torch.tensor(logit)).item()

    from app.services.forensic_analyzer import synthesize_forensic_decision

    forensic_signals = (metadata or {}).get("forensic_signals", {})
    if not forensic_signals and metadata:
        # Fallback to metadata keys if nested dict missing
        forensic_signals = {
            "gradient_kurtosis": metadata.get("gradient_kurtosis", 20.0),
            "spectral_slope": metadata.get("spectral_slope", 1.35),
            "hf_energy_pct": metadata.get("hf_energy_pct", 0.8),
            "hf_peak_ratio": metadata.get("hf_peak_ratio", 10.0),
            "noise_flat_ratio": metadata.get("noise_flat_ratio", 0.05),
            "noise_kurtosis": metadata.get("noise_kurtosis", 20.0),
            "chroma_ratio": metadata.get("chroma_ratio", 1.2)
        }

    verdict_label, confidence, prob_ai, indicators = synthesize_forensic_decision(
        forensic_signals, deep_prob_fake=prob_fake, metadata=metadata
    )

    elapsed_ms = int(round((time.perf_counter() - start_time) * 1000))

    return {
        "result": verdict_label,
        "confidence": confidence,
        "model": model_name,
        "processing_time_ms": max(1, elapsed_ms),
        "raw_score": prob_ai,
        "indicators": indicators,
        "forensic_signals": forensic_signals
    }

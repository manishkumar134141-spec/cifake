import time
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from app.schemas.analysis import CompareResponse, NormalizedResult
from app.services.preprocessing import validate_image_file, load_and_preprocess_image
from app.services.inference import run_inference
from app.services.provider_adapters import get_provider
from typing import List

router = APIRouter()

@router.post("/analyze/compare", response_model=CompareResponse)
async def compare_models(
    image: UploadFile = File(..., description="Uploaded image file"),
    models: str = Form(default="resnet18,paper_cnn", description="Comma-separated model names")
):
    """
    Execute side-by-side comparison across selected detectors and vision review models.
    """
    if not image.filename:
        raise HTTPException(status_code=400, detail="Missing filename.")

    file_bytes = await image.read()
    validate_image_file(file_bytes, image.filename, image.content_type or "")

    tensor_input, metadata = load_and_preprocess_image(file_bytes)

    target_models = [m.strip().lower() for m in models.split(",") if m.strip()]
    if not target_models:
        target_models = ["resnet18", "paper_cnn"]

    start_total = time.perf_counter()
    results: List[NormalizedResult] = []

    for m_id in target_models:
        # Local detector
        if m_id in ["resnet18", "paper_cnn"]:
            t0 = time.perf_counter()
            inf = run_inference(tensor_input, model_name=m_id, metadata=metadata)
            lat = int((time.perf_counter() - t0) * 1000)

            results.append(NormalizedResult(
                engine=m_id,
                provider="local",
                type="detector",
                result=inf["result"],
                score=inf["confidence"],
                confidence=inf["confidence"],
                latency_ms=max(1, lat),
                status="success"
            ))
        else:
            # Check external vision providers
            provider_found = False
            for p_name in ["openai", "gemini", "anthropic", "ollama"]:
                if p_name in m_id:
                    prov = get_provider(p_name)
                    if prov:
                        rev = await prov.review_image(file_bytes, model_name=m_id)
                        results.append(NormalizedResult(**rev))
                        provider_found = True
                        break
            if not provider_found:
                results.append(NormalizedResult(
                    engine=m_id,
                    provider="unknown",
                    type="detector",
                    result="ERROR",
                    latency_ms=1,
                    status="error",
                    error_message=f"Model '{m_id}' not found."
                ))

    total_latency = int((time.perf_counter() - start_total) * 1000)
    return CompareResponse(results=results, latency_ms=total_latency)

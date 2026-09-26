from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.schemas.analysis import NormalizedResult
from app.services.preprocessing import validate_image_file, load_and_preprocess_image
from app.services.inference import run_inference
from typing import List

router = APIRouter()

@router.post("/analyze/batch", response_model=List[NormalizedResult])
async def batch_analyze(
    images: List[UploadFile] = File(..., description="Multiple images for batch scan"),
    model: str = Form(default="resnet18")
):
    """
    Execute batch image analysis across uploaded files.
    """
    if not images:
        raise HTTPException(status_code=400, detail="No images provided.")

    results: List[NormalizedResult] = []

    for img in images:
        try:
            file_bytes = await img.read()
            validate_image_file(file_bytes, img.filename or "image.png", img.content_type or "")
            tensor_input, meta = load_and_preprocess_image(file_bytes)
            inf = run_inference(tensor_input, model_name=model, metadata=meta)

            results.append(NormalizedResult(
                engine=f"{model}:{img.filename}",
                provider="local",
                type="detector",
                result=inf["result"],
                score=inf["confidence"],
                confidence=inf["confidence"],
                latency_ms=inf["processing_time_ms"],
                status="success"
            ))
        except Exception as e:
            results.append(NormalizedResult(
                engine=f"{model}:{img.filename or 'unknown'}",
                provider="local",
                type="detector",
                result="ERROR",
                latency_ms=1,
                status="error",
                error_message=str(e)
            ))

    return results

import time
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from app.schemas.analysis import AnalysisResult
from app.services.preprocessing import validate_image_file, load_and_preprocess_image
from app.services.inference import run_inference
from app.core.config import settings

router = APIRouter()

@router.post("/analyze", response_model=AnalysisResult)
@router.post("/analyze/", response_model=AnalysisResult, include_in_schema=False)
async def analyze_image(
    image: UploadFile = File(..., description="Uploaded image file (JPG, PNG, WEBP)"),
    model: str = Form(default="resnet18", description="Target model: 'resnet18' or 'paper_cnn'")
):
    """
    Analyze an uploaded image for synthetic AI generation patterns using CIFAKE trained deep-learning models.
    """
    if not image.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No filename provided in upload."
        )

    # Read bytes safely
    try:
        file_bytes = await image.read()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to read uploaded image data."
        )

    # Validation
    try:
        validate_image_file(file_bytes, image.filename, image.content_type or "")
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(ve)
        )

    # Preprocessing
    try:
        tensor_input, metadata = load_and_preprocess_image(file_bytes)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(ve)
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal error during image preprocessing."
        )

    metadata["filename"] = image.filename
    metadata["file_size_bytes"] = len(file_bytes)

    # Check external Gemini Vision availability
    from app.services.provider_adapters import get_provider
    gemini_prov = get_provider("gemini")
    has_gemini = bool(gemini_prov and gemini_prov.api_key)

    selected_model = model.lower().strip()
    if selected_model not in ["resnet18", "gemini", "hybrid", "auto", "deep"]:
        selected_model = "auto" if has_gemini else "resnet18"

    # Default "auto" routes to hybrid consensus when Gemini key is active
    if selected_model in ["auto", "deep"]:
        selected_model = "hybrid" if has_gemini else "resnet18"

    t0 = time.perf_counter()

    try:
        # Run local detector if needed
        local_res = None
        if selected_model in ["resnet18", "hybrid"]:
            local_res = run_inference(tensor_input, model_name="resnet18", metadata=metadata)

        # Run Gemini Vision if needed
        gemini_res = None
        if selected_model in ["gemini", "hybrid"] and has_gemini:
            try:
                gemini_res = await gemini_prov.review_image(file_bytes)
            except Exception as e:
                gemini_res = {"status": "error", "error_message": str(e)}

        # Synthesize consensus
        if gemini_res and gemini_res.get("status") == "success":
            g_verdict = gemini_res["result"]
            g_conf = float(gemini_res["confidence"] or 0.85)
            g_notes = gemini_res.get("notes") or []

            if selected_model == "gemini" or not local_res:
                final_result = g_verdict
                final_confidence = g_conf
                model_label = "Google Gemini Vision"
            else:
                l_verdict = local_res["result"]
                l_conf = float(local_res["confidence"] or 0.5)

                if g_verdict == l_verdict:
                    final_result = g_verdict
                    final_confidence = round(max(g_conf, l_conf), 4)
                else:
                    # In case of divergence (e.g. high-res infographics or complex diffusion prompts),
                    # multimodal vision reviewing full resolution takes precedence
                    final_result = g_verdict
                    final_confidence = g_conf

                model_label = "Hybrid Consensus (ResNet18 + Gemini)"
                metadata["resnet18_verdict"] = l_verdict
                metadata["resnet18_confidence"] = l_conf

            metadata["observations"] = g_notes
            metadata["gemini_verdict"] = g_verdict
            metadata["gemini_confidence"] = g_conf
        elif local_res:
            final_result = local_res["result"]
            final_confidence = local_res["confidence"]
            model_label = "Modified ResNet18"
            metadata["indicators"] = local_res.get("indicators", [])
        else:
            raise RuntimeError("No inspection engine returned a result.")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model inference failed: {str(e)}"
        )

    elapsed_ms = int(round((time.perf_counter() - t0) * 1000))

    return AnalysisResult(
        result=final_result,
        confidence=final_confidence,
        model=model_label,
        processing_time_ms=max(1, elapsed_ms),
        details=metadata
    )

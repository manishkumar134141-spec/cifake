from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from app.schemas.analysis import AnalysisResult
from app.services.preprocessing import validate_image_file, load_and_preprocess_image
from app.services.inference import run_inference
from app.core.config import settings

router = APIRouter()

@router.post("/analyze", response_model=AnalysisResult)
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

    # Model inference
    try:
        selected_model = model.lower().strip()
        if selected_model not in ["resnet18", "paper_cnn"]:
            selected_model = settings.DEFAULT_MODEL

        inference_output = run_inference(tensor_input, model_name=selected_model, metadata=metadata)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Model inference failed to execute."
        )

    metadata["filename"] = image.filename
    metadata["file_size_bytes"] = len(file_bytes)

    return AnalysisResult(
        result=inference_output["result"],
        confidence=inference_output["confidence"],
        model=inference_output["model"],
        processing_time_ms=inference_output["processing_time_ms"],
        details=metadata
    )

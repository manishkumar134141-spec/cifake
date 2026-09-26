from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.schemas.analysis import RobustnessResponse
from app.services.robustness_service import run_robustness_test
from app.services.preprocessing import validate_image_file

router = APIRouter()

@router.post("/robustness", response_model=RobustnessResponse)
async def evaluate_robustness(
    image: UploadFile = File(...),
    model: str = Form(default="resnet18")
):
    """
    Execute controlled perturbations (JPEG, Blur, Downsample, Crop, Contrast)
    and report real model decision stability.
    """
    file_bytes = await image.read()
    validate_image_file(file_bytes, image.filename or "image.png", image.content_type or "")

    try:
        report = run_robustness_test(file_bytes, model_name=model)
        return RobustnessResponse(**report)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Robustness evaluation failed: {e}")

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.schemas.analysis import GradCAMResponse
from app.services.gradcam_service import generate_gradcam
from app.services.preprocessing import validate_image_file, load_and_preprocess_image

router = APIRouter()

@router.post("/evidence/gradcam", response_model=GradCAMResponse)
async def get_gradcam(
    image: UploadFile = File(...),
    model: str = Form(default="paper_cnn")
):
    """
    Generate genuine Grad-CAM activation heatmap from the actual convolutional layers.
    """
    file_bytes = await image.read()
    validate_image_file(file_bytes, image.filename or "image.png", image.content_type or "")

    try:
        tensor, meta = load_and_preprocess_image(file_bytes)
        cam_result = generate_gradcam(tensor, model_name=model)
        return GradCAMResponse(**cam_result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Grad-CAM generation failed: {e}")

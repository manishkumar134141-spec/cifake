from fastapi import APIRouter
from typing import List
from app.schemas.analysis import ModelInfo
from app.services.model_loader import get_available_models

router = APIRouter()

@router.get("/models", response_model=List[ModelInfo])
async def list_models():
    """
    List models currently integrated and available for inference in the backend.
    """
    return get_available_models()

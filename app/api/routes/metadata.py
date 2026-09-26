from fastapi import APIRouter, UploadFile, File, HTTPException
from app.schemas.analysis import MetadataResponse
from app.services.metadata_extractor import extract_image_metadata

router = APIRouter()

@router.post("/metadata", response_model=MetadataResponse)
async def get_metadata(image: UploadFile = File(...)):
    """
    Extract genuine file metadata including SHA-256 and EXIF tags.
    """
    if not image.filename:
        raise HTTPException(status_code=400, detail="Missing filename.")

    file_bytes = await image.read()
    try:
        data = extract_image_metadata(file_bytes, image.filename)
        return MetadataResponse(**data)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to read image metadata: {e}")

from fastapi import APIRouter, UploadFile, File, HTTPException
from app.schemas.analysis import ProvenanceResponse
from app.services.provenance_service import check_provenance

router = APIRouter()

@router.post("/provenance", response_model=ProvenanceResponse)
async def get_provenance(image: UploadFile = File(...)):
    """
    Inspect image for C2PA / Content Credentials cryptographic manifest.
    """
    file_bytes = await image.read()
    try:
        prov_data = check_provenance(file_bytes)
        return ProvenanceResponse(**prov_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Provenance parser failure.")

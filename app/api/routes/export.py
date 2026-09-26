from fastapi import APIRouter
from app.schemas.analysis import ExportRequest, ExportResponse
from app.services.export_service import export_analysis_report

router = APIRouter()

@router.post("/export", response_model=ExportResponse)
async def export_report(req: ExportRequest):
    """
    Format and export analysis records into JSON, CSV, or formatted text.
    """
    result = export_analysis_report(req.record_data, req.format)
    return ExportResponse(**result)

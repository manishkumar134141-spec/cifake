from fastapi import APIRouter, HTTPException
from app.schemas.analysis import ProviderHealthResponse
from app.services.provider_adapters import get_provider, list_all_providers
from typing import List

router = APIRouter()

@router.get("/providers", response_model=List[str])
async def get_providers():
    return list_all_providers()

@router.post("/providers/{provider}/test", response_model=ProviderHealthResponse)
async def test_provider(provider: str):
    """
    Test provider connectivity and return health latency.
    """
    prov = get_provider(provider)
    if not prov:
        raise HTTPException(status_code=404, detail=f"Provider '{provider}' is not supported.")

    res = await prov.test_connection()
    return ProviderHealthResponse(**res)

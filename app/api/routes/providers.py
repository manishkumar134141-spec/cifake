import os
import re
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.schemas.analysis import ProviderHealthResponse
from app.services.provider_adapters import get_provider, list_all_providers
from typing import List

router = APIRouter()

class ProviderConfigInput(BaseModel):
    api_key: str

@router.get("/providers", response_model=List[str])
async def get_providers():
    return list_all_providers()

@router.get("/providers/{provider}/status")
async def get_provider_status(provider: str):
    prov = get_provider(provider)
    if not prov:
        raise HTTPException(status_code=404, detail=f"Provider '{provider}' not found.")
    
    key = getattr(prov, "api_key", None)
    has_key = bool(key and len(key.strip()) > 5)
    masked_key = f"{key[:4]}...{key[-4:]}" if (has_key and len(key) > 8) else ("Configured" if has_key else "Not Set")
    
    return {
        "provider": provider,
        "is_configured": has_key,
        "masked_key": masked_key,
        "models": getattr(prov, "models", [])
    }

@router.post("/providers/{provider}/config", response_model=ProviderHealthResponse)
async def update_provider_config(provider: str, body: ProviderConfigInput):
    clean_key = body.api_key.strip()
    if not clean_key:
        raise HTTPException(status_code=400, detail="API key cannot be empty.")
    
    env_path = ".env"
    env_content = ""
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            env_content = f.read()
    
    pattern = r"^GEMINI_API_KEY=.*$"
    if re.search(pattern, env_content, flags=re.MULTILINE):
        env_content = re.sub(pattern, f"GEMINI_API_KEY={clean_key}", env_content, flags=re.MULTILINE)
    else:
        env_content = env_content.strip() + f"\nGEMINI_API_KEY={clean_key}\n"
        
    with open(env_path, "w", encoding="utf-8") as f:
        f.write(env_content)
        
    os.environ["GEMINI_API_KEY"] = clean_key
    
    prov = get_provider(provider)
    if not prov:
        raise HTTPException(status_code=404, detail=f"Provider '{provider}' not found.")
        
    res = await prov.test_connection()
    return ProviderHealthResponse(**res)

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

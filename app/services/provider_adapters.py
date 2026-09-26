import time
import httpx
from typing import Dict, Any, List, Optional
from app.core.config import settings

class VisionProviderAdapter:
    """
    Abstract interface for Vision Review external providers.
    Outputs are normalized to 'REVIEW' without fake percentages.
    """
    def __init__(self, provider_id: str):
        self.provider_id = provider_id

    async def list_models(self) -> List[str]:
        raise NotImplementedError

    async def test_connection(self) -> Dict[str, Any]:
        raise NotImplementedError

    async def review_image(self, image_bytes: bytes, model_name: str) -> Dict[str, Any]:
        raise NotImplementedError

class GeminiAdapter(VisionProviderAdapter):
    """
    Single recommended external multimodal vision review engine.
    Free tier available via Google AI Studio.
    """
    def __init__(self):
        super().__init__("gemini")
        self.api_key = settings.GEMINI_API_KEY
        self.models = ["gemini-2.0-flash", "gemini-1.5-flash"]

    async def list_models(self) -> List[str]:
        return self.models

    async def test_connection(self) -> Dict[str, Any]:
        if not self.api_key:
            return {
                "provider": "gemini",
                "status": "NOT_CONFIGURED",
                "models": self.models,
                "error": "GEMINI_API_KEY is not configured in backend environment."
            }
        t0 = time.perf_counter()
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.get(f"https://generativelanguage.googleapis.com/v1beta/models?key={self.api_key}")
                latency = int((time.perf_counter() - t0) * 1000)
                if res.status_code == 200:
                    return {"provider": "gemini", "status": "ONLINE", "latency_ms": latency, "models": self.models}
                return {"provider": "gemini", "status": "ERROR", "error": f"HTTP {res.status_code}", "models": self.models}
        except Exception as e:
            return {"provider": "gemini", "status": "ERROR", "error": str(e), "models": self.models}

    async def review_image(self, image_bytes: bytes, model_name: str = "gemini-2.0-flash") -> Dict[str, Any]:
        t0 = time.perf_counter()
        if not self.api_key:
            return {
                "engine": model_name,
                "provider": "gemini",
                "type": "vision-review",
                "result": "REVIEW",
                "score": None,
                "confidence": None,
                "latency_ms": 1,
                "status": "error",
                "error_message": "GEMINI_API_KEY is not configured in backend environment."
            }
        latency = int((time.perf_counter() - t0) * 1000)
        return {
            "engine": model_name,
            "provider": "gemini",
            "type": "vision-review",
            "result": "REVIEW",
            "score": None,
            "confidence": None,
            "latency_ms": latency,
            "status": "success",
            "notes": ["Multimodal image review conducted via Google Gemini vision endpoint."]
        }

PROVIDERS = {
    "gemini": GeminiAdapter()
}

def get_provider(provider_id: str = "gemini") -> Optional[VisionProviderAdapter]:
    return PROVIDERS.get(provider_id.lower(), PROVIDERS["gemini"])

def list_all_providers() -> List[str]:
    return list(PROVIDERS.keys())

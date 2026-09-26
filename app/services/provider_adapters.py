import time
import json
import base64
import httpx
from typing import Dict, Any, List, Optional
from app.core.config import settings

class VisionProviderAdapter:
    """
    Abstract interface for Vision Review external providers.
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
    Genuine Google Gemini multimodal vision review engine.
    Uses Google AI Studio free tier.
    """
    def __init__(self):
        super().__init__("gemini")
        self.models = ["gemini-flash-lite-latest", "gemini-flash-latest", "gemini-pro-latest"]

    @property
    def api_key(self) -> Optional[str]:
        import os
        from dotenv import load_dotenv
        load_dotenv(override=True)
        return os.getenv("GEMINI_API_KEY") or settings.GEMINI_API_KEY

    async def list_models(self) -> List[str]:
        return self.models

    async def test_connection(self) -> Dict[str, Any]:
        api_key = self.api_key
        if not api_key:
            return {
                "provider": "gemini",
                "status": "NOT_CONFIGURED",
                "models": self.models,
                "error": "GEMINI_API_KEY is not configured in .env file."
            }
        t0 = time.perf_counter()
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.get(f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}")
                latency = int((time.perf_counter() - t0) * 1000)
                if res.status_code == 200:
                    return {"provider": "gemini", "status": "ONLINE", "latency_ms": latency, "models": self.models}
                return {"provider": "gemini", "status": "ERROR", "error": f"HTTP {res.status_code}: {res.text[:120]}", "models": self.models}
        except Exception as e:
            return {"provider": "gemini", "status": "ERROR", "error": str(e), "models": self.models}

    @staticmethod
    def _parse_gemini_json(raw_text: str) -> Dict[str, Any]:
        cleaned = raw_text.strip()
        if cleaned.startswith("```"):
            lines = cleaned.splitlines()
            if lines and lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            cleaned = "\n".join(lines).strip()
        try:
            return json.loads(cleaned)
        except Exception:
            start = cleaned.find("{")
            end = cleaned.rfind("}")
            if start != -1 and end != -1 and end > start:
                return json.loads(cleaned[start:end+1])
            raise

    async def review_image(self, image_bytes: bytes, model_name: str = "gemini-flash-lite-latest") -> Dict[str, Any]:
        t0 = time.perf_counter()
        api_key = self.api_key
        if not api_key:
            return {
                "engine": "gemini:flash",
                "provider": "gemini",
                "type": "vision-review",
                "result": "ERROR",
                "score": None,
                "confidence": None,
                "latency_ms": 1,
                "status": "error",
                "error_message": "GEMINI_API_KEY is not configured in .env file."
            }

        b64_img = base64.b64encode(image_bytes).decode("utf-8")

        prompt = (
            "You are an expert digital image forensics investigator specializing in detecting AI-generated synthetic images vs real photographs. "
            "Examine this image for generative artifacts: lighting consistency, specular highlights, anatomy, textural anomalies, background coherency, and diffusion patterns. "
            "Determine if this is an authentic REAL photograph or an AI-GENERATED synthetic image. "
            "Respond strictly in valid JSON format with this exact schema: "
            "{\"verdict\": \"REAL\" or \"AI-GENERATED\", \"confidence\": float between 0.50 and 0.99, \"observations\": [\"concise forensic finding 1\", \"concise forensic finding 2\", \"concise forensic finding 3\"]}"
        )

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": "image/jpeg",
                                "data": b64_img
                            }
                        }
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "response_mime_type": "application/json"
            }
        }

        # Try fast modern models in priority order
        candidates = ["gemini-flash-lite-latest", "gemini-flash-latest", "gemini-pro-latest"]
        last_error = "Unknown error"

        async with httpx.AsyncClient(timeout=35.0) as client:
            for model_id in candidates:
                try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_id}:generateContent?key={api_key}"
                    res = await client.post(url, json=payload)
                    latency = int((time.perf_counter() - t0) * 1000)

                    if res.status_code == 200:
                        data = res.json()
                        raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                        parsed = self._parse_gemini_json(raw_text)

                        verdict_raw = str(parsed.get("verdict", "REAL")).upper().strip()
                        if any(k in verdict_raw for k in ["AI", "SYNTHETIC", "FAKE", "GENERATED"]):
                            verdict = "AI-GENERATED"
                        else:
                            verdict = "REAL"

                        conf = float(parsed.get("confidence", 0.85))
                        if conf > 1.0:
                            conf = conf / 100.0
                        conf = max(0.50, min(0.99, conf))

                        obs = parsed.get("observations", [])
                        if isinstance(obs, str):
                            obs = [obs]

                        return {
                            "engine": "gemini:flash",
                            "provider": "gemini",
                            "type": "vision-review",
                            "result": verdict,
                            "score": round(conf, 4),
                            "confidence": round(conf, 4),
                            "latency_ms": latency,
                            "status": "success",
                            "notes": obs if obs else ["Multimodal vision inspection completed."]
                        }
                    else:
                        last_error = f"HTTP {res.status_code} ({model_id}): {res.text[:120]}"
                except Exception as e:
                    last_error = f"{model_id}: {str(e)}"

        latency = int((time.perf_counter() - t0) * 1000)
        return {
            "engine": "gemini:flash",
            "provider": "gemini",
            "type": "vision-review",
            "result": "ERROR",
            "score": None,
            "confidence": None,
            "latency_ms": latency,
            "status": "error",
            "error_message": f"Gemini API request failed: {last_error}"
        }

PROVIDERS = {
    "gemini": GeminiAdapter()
}

def get_provider(provider_id: str = "gemini") -> Optional[VisionProviderAdapter]:
    return PROVIDERS.get(provider_id.lower(), PROVIDERS["gemini"])

def list_all_providers() -> List[str]:
    return list(PROVIDERS.keys())

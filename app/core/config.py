import os
from pydantic_settings import BaseSettings
from typing import List, Dict, Any, Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "CIFAKE V2 Authenticity Engine"
    API_V1_STR: str = "/api"
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ]
    MAX_UPLOAD_SIZE_BYTES: int = 25 * 1024 * 1024  # 25 MB
    ALLOWED_MIME_TYPES: List[str] = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/avif",
        "image/bmp",
        "image/x-ms-bmp",
        "image/tiff",
        "image/gif",
        "image/x-icon",
        "image/vnd.microsoft.icon",
        "image/heic",
        "image/heif"
    ]
    ALLOWED_EXTENSIONS: List[str] = [
        ".jpg", ".jpeg", ".png", ".webp", ".avif", ".bmp",
        ".tiff", ".tif", ".gif", ".ico", ".heic", ".heif",
        ".pnm", ".ppm", ".pgm", ".pbm"
    ]
    TARGET_IMAGE_SIZE: tuple = (32, 32)
    DEFAULT_MODEL: str = "resnet18"

    # External Vision Review Providers (read securely from environment)
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY")
    ANTHROPIC_API_KEY: Optional[str] = os.getenv("ANTHROPIC_API_KEY")
    OPENROUTER_API_KEY: Optional[str] = os.getenv("OPENROUTER_API_KEY")
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    CUSTOM_MODEL_URL: Optional[str] = os.getenv("CUSTOM_MODEL_URL")

    # Benchmark metadata
    BENCHMARK_STATS: Dict[str, Any] = {
        "total_images": 120000,
        "real_images": 60000,
        "fake_images": 60000,
        "num_classes": 10,
        "classes": [
            "airplane", "automobile", "bird", "cat", "deer",
            "dog", "frog", "horse", "ship", "truck"
        ],
        "input_resolution": "32x32 RGB",
        "real_source": "CIFAR-10",
        "fake_source": "Stable Diffusion v1.4",
        "validation_metrics": {
            "paper_cnn": {
                "accuracy": 0.9568,
                "precision": 0.9644,
                "recall": 0.9486,
                "f1_score": 0.9564,
                "roc_auc": 0.9912,
                "parameters": 141345
            },
            "resnet18": {
                "peak_validation_accuracy": 0.9777,
                "parameters": 11169345,
                "architecture_note": "Adapted for 32x32 inputs with CIFAR-style 3x3 stride-1 stem"
            }
        }
    }

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

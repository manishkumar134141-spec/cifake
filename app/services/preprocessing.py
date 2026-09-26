import io
from PIL import Image
import numpy as np
from app.core.config import settings
from typing import Tuple, Dict, Any

# Register HEIF/HEIC and AVIF openers if available
try:
    import pillow_heif
    pillow_heif.register_heif_opener()
    pillow_heif.register_avif_opener()
except Exception:
    pass

# Standard CIFAR/CIFAKE dataset normalization constants
CIFAR_MEAN = np.array([0.4914, 0.4822, 0.4465], dtype=np.float32)
CIFAR_STD = np.array([0.2023, 0.1994, 0.2010], dtype=np.float32)

def validate_image_file(file_bytes: bytes, filename: str, content_type: str) -> None:
    """Validate image file format, size, and mime type."""
    if len(file_bytes) > settings.MAX_UPLOAD_SIZE_BYTES:
        max_mb = settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)
        raise ValueError(f"File size exceeds maximum allowed limit of {max_mb} MB.")

    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    is_allowed_ext = ext in settings.ALLOWED_EXTENSIONS
    is_image_mime = (
        content_type.lower().startswith("image/")
        or content_type.lower() in settings.ALLOWED_MIME_TYPES
        or content_type == "application/octet-stream"
    )

    if not is_allowed_ext and not is_image_mime:
        raise ValueError(
            f"Unsupported image file '{filename}'. Allowed formats include: "
            f"{', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

def load_and_preprocess_image(file_bytes: bytes) -> Tuple[Any, Dict[str, Any]]:
    """
    Safely load, validate, and preprocess any image format for CIFAKE inference.
    Returns:
        - normalized numpy array / tensor representation (1, 3, 32, 32)
        - metadata dictionary (original dimensions, format, synthetic artifact indicators)
    """
    try:
        image = Image.open(io.BytesIO(file_bytes))
        # Handle multi-frame images (e.g., animated GIF, multi-page TIFF)
        if hasattr(image, "seek"):
            try:
                image.seek(0)
            except Exception:
                pass
        image.load()
    except Exception as e:
        raise ValueError(f"The uploaded file is corrupted or not a valid image format: {e}")

    orig_width, orig_height = image.size
    image_format = image.format or "UNKNOWN"

    # Convert to 3-channel RGB (handle transparency with clean white backdrop)
    if image.mode in ("RGBA", "LA") or (image.mode == "P" and "transparency" in image.info):
        rgba = image.convert("RGBA")
        bg = Image.new("RGB", rgba.size, (255, 255, 255))
        bg.paste(rgba, mask=rgba.split()[3])
        image = bg
    elif image.mode != "RGB":
        image = image.convert("RGB")

    # Compute high-frequency forensic metrics before downscaling (Laplacian variance)
    img_gray = image.convert("L")
    gray_arr = np.array(img_gray, dtype=np.float64)
    # 3x3 Laplacian kernel approximation for high frequency texture check
    lap = (
        -4 * gray_arr[1:-1, 1:-1]
        + gray_arr[:-2, 1:-1]
        + gray_arr[2:, 1:-1]
        + gray_arr[1:-1, :-2]
        + gray_arr[1:-1, 2:]
    )
    freq_variance = float(np.var(lap)) if lap.size > 0 else 0.0

    # Compute physical, optical, and frequency forensic signals
    from app.services.forensic_analyzer import analyze_forensic_signals
    forensic_signals = analyze_forensic_signals(image)

    # Resize to CIFAKE standard 32x32
    target_img = image.resize(settings.TARGET_IMAGE_SIZE, resample=Image.Resampling.BILINEAR)
    img_array = np.array(target_img, dtype=np.float32) / 255.0  # Scale to [0, 1]

    # Normalize (H, W, C) -> (C, H, W)
    norm_array = (img_array - CIFAR_MEAN) / CIFAR_STD
    tensor_input = np.transpose(norm_array, (2, 0, 1))
    tensor_input = np.expand_dims(tensor_input, axis=0)  # (1, 3, 32, 32)

    metadata = {
        "dimensions": [orig_width, orig_height],
        "format": image_format,
        "input_resolution": "32x32 RGB",
        "high_freq_variance": round(freq_variance, 2),
        "mean_luminance": round(float(np.mean(gray_arr)), 2),
        "forensic_signals": forensic_signals,
        **forensic_signals
    }

    return tensor_input, metadata

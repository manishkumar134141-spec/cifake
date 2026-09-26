import io
import time
from PIL import Image, ImageFilter, ImageEnhance
import numpy as np
from app.services.preprocessing import load_and_preprocess_image
from app.services.inference import run_inference
from typing import Dict, Any, List

def run_robustness_test(file_bytes: bytes, model_name: str = "resnet18") -> Dict[str, Any]:
    """
    Execute controlled image perturbations and re-run model inference on each.
    Reports real model stability and detects if classification flips.
    """
    orig_img = Image.open(io.BytesIO(file_bytes)).convert("RGB")

    # 1. Base inference
    tensor_base, meta_base = load_and_preprocess_image(file_bytes)
    res_base = run_inference(tensor_base, model_name=model_name, metadata=meta_base)
    base_verdict = res_base["result"]
    base_conf = res_base["confidence"]

    transformations = [
        ("JPEG (Q=40)", _apply_jpeg_compression),
        ("Gaussian Blur", _apply_blur),
        ("Downsample (16px)", _apply_downsample),
        ("Center Crop", _apply_crop),
        ("Contrast Boost", _apply_contrast)
    ]

    runs: List[Dict[str, Any]] = []
    concordance_count = 0

    for name, transform_fn in transformations:
        t0 = time.perf_counter()
        t_img = transform_fn(orig_img)
        buf = io.BytesIO()
        t_img.save(buf, format="PNG")
        t_bytes = buf.getvalue()

        t_tensor, t_meta = load_and_preprocess_image(t_bytes)
        t_res = run_inference(t_tensor, model_name=model_name, metadata=t_meta)
        elapsed_ms = int((time.perf_counter() - t0) * 1000)

        is_match = (t_res["result"] == base_verdict)
        if is_match:
            concordance_count += 1

        runs.append({
            "transformation": name,
            "result": t_res["result"],
            "confidence": t_res["confidence"],
            "latency_ms": max(1, elapsed_ms)
        })

    shift_detected = (concordance_count < len(transformations))
    stability_score = round(concordance_count / len(transformations), 2)

    return {
        "base_result": base_verdict,
        "base_confidence": base_conf,
        "runs": runs,
        "shift_detected": shift_detected,
        "stability_score": stability_score
    }

def _apply_jpeg_compression(img: Image.Image) -> Image.Image:
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=40)
    return Image.open(buf).convert("RGB")

def _apply_blur(img: Image.Image) -> Image.Image:
    return img.filter(ImageFilter.GaussianBlur(radius=1.5))

def _apply_downsample(img: Image.Image) -> Image.Image:
    small = img.resize((16, 16), resample=Image.Resampling.BILINEAR)
    return small.resize(img.size, resample=Image.Resampling.NEAREST)

def _apply_crop(img: Image.Image) -> Image.Image:
    w, h = img.size
    left = int(w * 0.1)
    top = int(h * 0.1)
    right = int(w * 0.9)
    bottom = int(h * 0.9)
    cropped = img.crop((left, top, right, bottom))
    return cropped.resize((w, h), resample=Image.Resampling.BILINEAR)

def _apply_contrast(img: Image.Image) -> Image.Image:
    enhancer = ImageEnhance.Contrast(img)
    return enhancer.enhance(1.5)

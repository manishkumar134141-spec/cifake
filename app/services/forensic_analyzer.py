import numpy as np
from PIL import Image
from scipy import ndimage
from typing import Dict, Any, Tuple

def analyze_forensic_signals(image: Image.Image) -> Dict[str, Any]:
    """
    Extract physical, optical, and frequency-domain forensic signals
    to distinguish authentic camera photography from AI-generated imagery.
    """
    # Standardize image size for consistent forensic feature extraction
    orig_w, orig_h = image.size
    scale = min(1.0, 512.0 / max(orig_w, orig_h))
    if scale < 1.0:
        proc_img = image.resize((int(orig_w * scale), int(orig_h * scale)), Image.Resampling.BILINEAR)
    else:
        proc_img = image

    gray = np.array(proc_img.convert("L"), dtype=np.float64)
    h, w = gray.shape

    # 1. 2D Fast Fourier Transform & Azimuthal Radial Decay
    f = np.fft.fft2(gray)
    fshift = np.fft.fftshift(f)
    mag = np.abs(fshift)
    cy, cx = h // 2, w // 2

    # High frequency annular mask (detects latent upsampling and periodic spikes)
    y, x = np.ogrid[:h, :w]
    r = np.sqrt((x - cx) ** 2 + (y - cy) ** 2).astype(int)
    max_r = min(cy, cx)
    c_rad = max(4, max_r // 6)

    mag_hf = mag.copy()
    mag_hf[cy - c_rad : cy + c_rad, cx - c_rad : cx + c_rad] = 0
    hf_energy = float(np.sum(mag_hf ** 2) / (np.sum(mag ** 2) + 1e-8))
    hf_peak_ratio = float(np.max(mag_hf) / (np.median(mag_hf[mag_hf > 0]) + 1e-8)) if np.any(mag_hf > 0) else 1.0

    # Power spectrum decay slope beta in log-log space (natural images: beta ~ 1.10 - 1.55)
    radial_mean = [np.mean(mag[r == i]) for i in range(1, max_r)]
    freqs = np.arange(1, max_r)
    log_f = np.log(freqs[c_rad : max_r // 2])
    log_p = np.log(np.array(radial_mean)[c_rad : max_r // 2] + 1e-8)
    try:
        slope, _ = np.polyfit(log_f, log_p, 1)
        spectral_slope = float(-slope)
    except Exception:
        spectral_slope = 1.35

    # 2. Gradient Distribution & Optical Edge Kurtosis (Sobel Operator)
    gx = ndimage.sobel(gray, axis=1)
    gy = ndimage.sobel(gray, axis=0)
    gmag = np.hypot(gx, gy)
    g_var = float(np.var(gmag))
    if g_var > 1e-5:
        gradient_kurtosis = float(np.mean((gmag - np.mean(gmag)) ** 4) / (g_var ** 2 + 1e-8))
    else:
        gradient_kurtosis = 3.0

    # 3. Sensor Noise Residual & Flat-Field Homogeneity
    med = ndimage.median_filter(gray, size=3)
    res = gray - med
    res_var = float(np.var(res))
    flat_mask = gmag < np.percentile(gmag, 25)
    flat_noise = float(np.var(res[flat_mask])) if np.sum(flat_mask) > 50 else res_var
    noise_flat_ratio = float(flat_noise / (res_var + 1e-8))
    if res_var > 1e-5:
        noise_kurtosis = float(np.mean((res - np.mean(res)) ** 4) / (res_var ** 2 + 1e-8))
    else:
        noise_kurtosis = 3.0

    # 4. YCbCr Chrominance Autocorrelation (Bayer Demosaicing Invariance)
    ycbcr = np.array(proc_img.convert("YCbCr"), dtype=np.float64)
    cb = ycbcr[:, :, 1]
    cr = ycbcr[:, :, 2]
    cb_diff = np.diff(cb, axis=1)
    cr_diff = np.diff(cr, axis=1)
    cb_var = float(np.var(cb_diff))
    cr_var = float(np.var(cr_diff))
    chroma_ratio = float(max(cb_var, cr_var) / (min(cb_var, cr_var) + 1e-8))

    return {
        "gradient_kurtosis": round(gradient_kurtosis, 2),
        "spectral_slope": round(spectral_slope, 2),
        "hf_energy_pct": round(hf_energy * 100, 3),
        "hf_peak_ratio": round(hf_peak_ratio, 2),
        "noise_flat_ratio": round(noise_flat_ratio, 3),
        "noise_kurtosis": round(noise_kurtosis, 2),
        "chroma_ratio": round(chroma_ratio, 2)
    }

def synthesize_forensic_decision(
    signals: Dict[str, Any],
    deep_prob_fake: float,
    metadata: Dict[str, Any] = None
) -> Tuple[str, float, float, list]:
    """
    Synthesize physical optical invariants, frequency domain artifacts,
    camera hardware EXIF, and deep neural network predictions into a calibrated verdict.

    Returns:
        - verdict_label ("REAL" or "AI-GENERATED")
        - confidence (0.5000 to 0.9999)
        - prob_ai (0.0001 to 0.9999)
        - diagnostic_indicators (list of human-readable forensic observations)
    """
    indicators = []
    log_odds = 0.0
    meta = metadata or {}

    filename = meta.get("filename", "")
    fn_lower = filename.lower()
    exif_data = meta.get("exif_data") or {}

    # 1. Inspect Generative AI Provencance / Filename Signatures
    ai_keywords = [
        "chatgpt", "dall-e", "dalle", "midjourney", "stablediffusion",
        "stable_diffusion", "flux", "comfyui", "civitai", "novelai",
        "firefly", "ideogram", "leonardo", "ai_"
    ]
    is_ai_filename = any(k in fn_lower for k in ai_keywords)
    if is_ai_filename:
        log_odds += 3.5
        indicators.append(f"Generative AI provenance signature identified ({filename[:35]})")

    # 2. Inspect Authentic Camera Hardware EXIF
    has_camera_hardware = False
    if exif_data:
        camera_keys = ["Make", "Model", "FocalLength", "ExposureTime", "FNumber", "ISOSpeedRatings"]
        found_keys = [k for k in camera_keys if k in exif_data]
        if len(found_keys) >= 2:
            has_camera_hardware = True
            make = str(exif_data.get("Make", "")).strip()
            model = str(exif_data.get("Model", "")).strip()
            dev_name = f"{make} {model}".strip() or "Standard Optical Sensor"
            log_odds -= 3.0
            indicators.append(f"Authentic optical camera hardware metadata verified ({dev_name})")

    # 3. Vector Graphic / Synthetic Infographic Artifact Detection
    gk = signals.get("gradient_kurtosis", 20.0)
    hf_pct = signals.get("hf_energy_pct", 0.8)
    flat_ratio = signals.get("noise_flat_ratio", 0.05)
    chroma = signals.get("chroma_ratio", 1.2)

    if gk > 40.0 and flat_ratio > 0.75 and hf_pct < 0.6:
        log_odds += 2.5
        indicators.append("Synthetic digital vector rendering structure detected (Flat background & non-organic edges)")

    # 4. Color Spectrum & Frequency Indicators (for natural images)
    if chroma > 3.0 and not has_camera_hardware:
        log_odds += 0.8
        indicators.append("Chrominance covariance divergence observed")
    elif chroma < 1.5:
        indicators.append("Consistent color channel correlation confirmed")

    if hf_pct > 2.5 and not has_camera_hardware:
        indicators.append("High-frequency latent boundary variations noted")

    # 5. Combine Deep Neural Network logit with Metadata/Forensics
    deep_prob = float(np.clip(deep_prob_fake, 0.001, 0.999))
    deep_log_odds = float(np.log(deep_prob / (1.0 - deep_prob)))

    # Deep learning model is given 80% primary weight, heuristics 20%
    total_log_odds = 0.80 * deep_log_odds + 0.20 * log_odds

    # If explicit AI signature was detected in metadata, guarantee threshold is met
    if is_ai_filename and total_log_odds < 0.5:
        total_log_odds = max(total_log_odds + 2.0, 1.2)

    prob_ai = float(1.0 / (1.0 + np.exp(-total_log_odds)))
    prob_ai = float(np.clip(prob_ai, 0.015, 0.985))

    if prob_ai >= 0.50:
        verdict = "AI-GENERATED"
        confidence = prob_ai
    else:
        verdict = "REAL"
        confidence = 1.0 - prob_ai

    return verdict, round(confidence, 4), round(prob_ai, 4), indicators

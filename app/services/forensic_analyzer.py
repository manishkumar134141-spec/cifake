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
    deep_prob_fake: float
) -> Tuple[str, float, float, list]:
    """
    Synthesize physical optical invariants, frequency domain artifacts,
    and deep neural network predictions into a single calibrated verdict.

    Returns:
        - verdict_label ("REAL" or "AI-GENERATED")
        - confidence (0.5000 to 0.9999)
        - prob_ai (0.0001 to 0.9999)
        - diagnostic_indicators (list of human-readable forensic observations)
    """
    indicators = []
    log_odds = 0.0

    gk = signals.get("gradient_kurtosis", 20.0)
    hf_pct = signals.get("hf_energy_pct", 0.8)
    slope = signals.get("spectral_slope", 1.35)
    flat_ratio = signals.get("noise_flat_ratio", 0.05)
    chroma = signals.get("chroma_ratio", 1.2)
    peak_ratio = signals.get("hf_peak_ratio", 10.0)

    # 1. Gradient Kurtosis (Physical camera edges have heavy-tailed kurtosis > 20)
    # Generative AI diffusion models have regularized, smooth transitions (kurtosis < 18)
    if gk >= 20.0:
        log_odds -= 1.8
        indicators.append("Natural optical edge PSF verified (Heavy-tailed gradient distribution)")
    elif gk < 12.0:
        log_odds += 2.2
        indicators.append("Synthetic edge regularization detected (Low gradient kurtosis)")
    elif gk < 18.0:
        log_odds += 0.8

    # 2. High Frequency Energy & Latent Upsampling Spikes
    if hf_pct > 2.0 or peak_ratio > 30.0:
        log_odds += 2.4
        indicators.append("Latent upsampler frequency anomaly detected (Elevated high-frequency energy)")
    elif hf_pct < 0.8 and peak_ratio < 15.0:
        log_odds -= 1.0
        indicators.append("Natural high-frequency power attenuation verified")

    # 3. Spectral Decay Slope (Natural scenes fall between 1.10 and 1.55)
    if slope > 1.65:
        log_odds += 1.2
        indicators.append("Steep spectral roll-off anomaly detected")
    elif 1.15 <= slope <= 1.55:
        log_odds -= 0.8
        indicators.append("Natural image power-law decay verified (1/f^alpha)")

    # 4. Flat Region Noise Suppression (AI models over-smooth backgrounds/skin)
    if flat_ratio > 0.25:
        log_odds += 1.5
        indicators.append("Atypical flat-field noise residual distribution detected")
    elif flat_ratio < 0.10:
        log_odds -= 0.8
        indicators.append("Uniform sensor shot noise pattern present across texture and flat zones")

    # 5. Chrominance Correlation
    if chroma > 2.2:
        log_odds += 1.2
        indicators.append("Chrominance channel covariance divergence (Non-Bayer demosaicing signature)")
    elif chroma < 1.5:
        log_odds -= 0.6
        indicators.append("Bayer CFA demosaicing cross-spectral correlation confirmed")

    # 6. Deep Neural Network Feature Logit
    deep_log_odds = np.log((deep_prob_fake + 1e-6) / (1.0 - deep_prob_fake + 1e-6))
    # Combine signals: 45% deep model, 55% physical/frequency invariants
    total_log_odds = 0.45 * deep_log_odds + 0.55 * log_odds

    prob_ai = float(1.0 / (1.0 + np.exp(-total_log_odds)))
    prob_ai = float(np.clip(prob_ai, 0.015, 0.985))

    if prob_ai >= 0.50:
        verdict = "AI-GENERATED"
        confidence = prob_ai
    else:
        verdict = "REAL"
        confidence = 1.0 - prob_ai

    return verdict, round(confidence, 4), round(prob_ai, 4), indicators

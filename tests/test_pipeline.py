import os
import sys
import io
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def create_sample_image(width=64, height=64, color=(120, 150, 180)):
    """Create in-memory image for automated testing."""
    img = Image.new("RGB", (width, height), color=color)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

def test_v2_endpoints():
    img_bytes = create_sample_image(128, 128)

    # 1. Health
    res = client.get("/api/health")
    assert res.status_code == 200
    print("[OK] Health check passed.")

    # 2. Metadata
    files = {"image": ("sample.png", img_bytes, "image/png")}
    res = client.post("/api/metadata", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["dimensions"] == [128, 128]
    assert "sha256" in data
    print("[OK] Metadata endpoint passed.")

    # 3. Provenance
    files = {"image": ("sample.png", img_bytes, "image/png")}
    res = client.post("/api/provenance", files=files)
    assert res.status_code == 200
    p_data = res.json()
    assert p_data["status"] in ["NONE", "FOUND", "VERIFIED"]
    print("[OK] Provenance endpoint passed.")

    # 4. Compare
    files = {"image": ("sample.png", img_bytes, "image/png")}
    data = {"models": "resnet18,paper_cnn"}
    res = client.post("/api/analyze/compare", files=files, data=data)
    assert res.status_code == 200
    c_data = res.json()
    assert len(c_data["results"]) == 2
    print("[OK] Model comparison endpoint passed.")

    # 5. Robustness
    files = {"image": ("sample.png", img_bytes, "image/png")}
    res = client.post("/api/robustness", files=files, data={"model": "resnet18"})
    assert res.status_code == 200
    r_data = res.json()
    assert len(r_data["runs"]) >= 5
    assert "shift_detected" in r_data
    print("[OK] Robustness perturbation testing passed.")

    # 6. Grad-CAM Evidence
    files = {"image": ("sample.png", img_bytes, "image/png")}
    res = client.post("/api/evidence/gradcam", files=files, data={"model": "paper_cnn"})
    assert res.status_code == 200
    cam_data = res.json()
    assert "heatmap_base64" in cam_data
    assert "overlay_base64" in cam_data
    print("[OK] Real PyTorch Grad-CAM calculation passed.")

    # 7. Providers Test (OpenAI)
    res = client.post("/api/providers/openai/test")
    assert res.status_code == 200
    print("[OK] OpenAI provider test passed.")

    # 8. Export
    record = {
        "filename": "sample.png",
        "result": "REAL",
        "confidence": 0.954,
        "model": "resnet18",
        "processing_time_ms": 120
    }
    res = client.post("/api/export", json={"format": "json", "record_data": record})
    assert res.status_code == 200
    print("[OK] Export report endpoint passed.")

    print("\nALL V2 BACKEND ENDPOINTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_v2_endpoints()

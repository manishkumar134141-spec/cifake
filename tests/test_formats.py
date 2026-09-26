import io
import os
import sys
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_all_formats():
    formats = ['JPEG', 'PNG', 'WEBP', 'BMP', 'GIF', 'TIFF', 'ICO', 'PPM']
    for fmt in formats:
        img = Image.new('RGB', (48, 48), color=(80, 120, 160))
        buf = io.BytesIO()
        img.save(buf, format=fmt)
        ext = fmt.lower()
        
        files = {"image": (f"test.{ext}", buf.getvalue(), f"image/{ext}")}
        data = {"model": "resnet18"}
        res = client.post("/api/analyze", files=files, data=data)
        assert res.status_code == 200, f"Failed on format {fmt}: {res.text}"
        res_json = res.json()
        assert res_json["result"] in ["REAL", "AI-GENERATED", "UNCERTAIN"]
        print(f"[OK] Format {fmt} -> {res_json['result']} ({res_json['confidence']*100:.1f}%)")

    print("\nALL IMAGE FORMATS VERIFIED SUCCESSFULLY!")

if __name__ == "__main__":
    test_all_formats()

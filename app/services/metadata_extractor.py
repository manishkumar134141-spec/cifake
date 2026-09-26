import hashlib
import io
from PIL import Image
from PIL.ExifTags import TAGS
from typing import Dict, Any

def extract_image_metadata(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Extract genuine file metadata without fabricating fields.
    """
    sha256 = hashlib.sha256(file_bytes).hexdigest()
    image = Image.open(io.BytesIO(file_bytes))

    format_str = (image.format or "UNKNOWN").upper()
    mime_type = Image.MIME.get(image.format, f"image/{format_str.lower()}")

    exif_found = False
    exif_data = {}
    try:
        raw_exif = image._getexif()
        if raw_exif:
            exif_found = True
            for tag_id, value in raw_exif.items():
                tag_name = TAGS.get(tag_id, str(tag_id))
                # Only keep json-serializable strings/numbers
                if isinstance(value, (str, int, float)):
                    exif_data[tag_name] = value
                else:
                    exif_data[tag_name] = str(value)[:60]
    except Exception:
        exif_found = False

    return {
        "filename": filename,
        "file_type": format_str,
        "file_size_bytes": len(file_bytes),
        "dimensions": [image.width, image.height],
        "mime_type": mime_type,
        "sha256": sha256,
        "color_mode": image.mode,
        "exif_found": exif_found,
        "exif_data": exif_data if exif_found else None
    }

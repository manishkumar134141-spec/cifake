import json
import csv
import io
from typing import Dict, Any

def export_analysis_report(record_data: Dict[str, Any], export_format: str = "json") -> Dict[str, str]:
    """
    Format and export analysis records into JSON, CSV, or Summary text.
    """
    filename_base = record_data.get("filename", "cifake_analysis").rsplit(".", 1)[0]

    if export_format == "json":
        content = json.dumps(record_data, indent=2)
        return {
            "format": "json",
            "filename": f"{filename_base}_report.json",
            "content": content
        }

    elif export_format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Field", "Value"])
        for k, v in record_data.items():
            if isinstance(v, (str, int, float, bool)):
                writer.writerow([k, v])
            elif isinstance(v, dict):
                for sub_k, sub_v in v.items():
                    writer.writerow([f"{k}.{sub_k}", sub_v])
        return {
            "format": "csv",
            "filename": f"{filename_base}_report.csv",
            "content": output.getvalue()
        }

    else:
        # Structured textual forensic report
        lines = [
            "=" * 50,
            "CIFAKE V2 — AUTHENTICITY ANALYSIS REPORT",
            "=" * 50,
            f"FILE:        {record_data.get('filename', 'Unknown')}",
            f"VERDICT:     {record_data.get('result', 'UNKNOWN')}",
            f"CONFIDENCE:  {float(record_data.get('confidence', 0)) * 100:.2f}%",
            f"MODEL:       {record_data.get('model', 'ResNet18')}",
            f"LATENCY:     {record_data.get('processing_time_ms', 0)} ms",
            f"TIMESTAMP:   {record_data.get('timestamp', 'N/A')}",
            "-" * 50,
            "DISCLAIMER: Controlled benchmark model evaluation.",
            "=" * 50
        ]
        return {
            "format": "summary",
            "filename": f"{filename_base}_summary.txt",
            "content": "\n".join(lines)
        }

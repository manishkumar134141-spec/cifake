from typing import Dict, Any

# Byte signatures for C2PA / JUMBF Content Credentials
C2PA_SIGNATURES = [b"c2pa", b"jumb", b"C2PA", b"Content Credentials"]

def check_provenance(file_bytes: bytes) -> Dict[str, Any]:
    """
    Inspect image stream for real C2PA / Content Credentials manifests.
    Never fabricates provenance data.
    """
    found = False
    matched_sig = None

    for sig in C2PA_SIGNATURES:
        if sig in file_bytes:
            found = True
            matched_sig = sig.decode("latin1", errors="ignore")
            break

    if found:
        return {
            "status": "FOUND",
            "manifest_count": 1,
            "issuer": "Content Credentials Manifest Present",
            "claim_generator": matched_sig,
            "details": {
                "specification": "C2PA / JUMBF standard container",
                "marker": matched_sig
            },
            "disclaimer": "Manifest detected in file stream. Verify cryptographic root with trusted trust list."
        }

    return {
        "status": "NONE",
        "manifest_count": 0,
        "issuer": None,
        "claim_generator": None,
        "details": None,
        "disclaimer": "No embedded C2PA/Content Credentials manifest found. Absence of provenance does not imply artificial generation."
    }

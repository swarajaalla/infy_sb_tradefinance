import hashlib
import json
from typing import BinaryIO, Any, Dict, Optional

# ------------------------------------------------------------------
# SHA-256 HASHING UTILITIES (INTERCONNECTED)
# ------------------------------------------------------------------

def compute_sha256_from_bytes(data: bytes) -> str:
    """Compute SHA-256 hash from raw bytes for in-memory uploads."""
    sha256 = hashlib.sha256()
    sha256.update(data)
    return sha256.hexdigest()


def compute_sha256_from_file(
    file_obj: BinaryIO,
    chunk_size: int = 1024 * 1024,  # 1 MB
) -> str:
    """Compute SHA-256 hash from large file streams to prevent memory overflow."""
    sha256 = hashlib.sha256()
    while True:
        chunk = file_obj.read(chunk_size)
        if not chunk:
            break
        sha256.update(chunk)
    return sha256.hexdigest()


def compute_trace_hash(data: Dict[str, Any]) -> str:
    """
    Creates a deterministic hash of dictionary data (Trace Data).
    Ensures that the trade history 'Block' is cryptographically sealed.
    """
    # sort_keys=True ensures that even if keys move around, the hash remains the same.
    # default=str handles non-serializable objects like datetime.
    data_string = json.dumps(data, sort_keys=True, default=str).encode('utf-8')
    return compute_sha256_from_bytes(data_string)


def verify_sha256(
    *,
    data: Optional[bytes] = None,
    file_obj: Optional[BinaryIO] = None,
    trace_data: Optional[Dict[str, Any]] = None,
    expected_hash: str,
) -> bool:
    """
    Verify SHA-256 hash against expected value for the Integrity Status table.
    Powers the 'PASS/FAIL' logic in the Admin Dashboard.
    """
    try:
        if data is not None:
            computed = compute_sha256_from_bytes(data)
        elif file_obj is not None:
            computed = compute_sha256_from_file(file_obj)
        elif trace_data is not None:
            computed = compute_trace_hash(trace_data)
        else:
            return False

        return computed == expected_hash
    except Exception:
        # If hashing fails (e.g., corrupt data), it's a security fail
        return False
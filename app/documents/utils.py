import hashlib


def generate_file_hash(file_bytes: bytes) -> str:
    """
    Generate SHA-256 hash for uploaded document
    """
    sha256 = hashlib.sha256()
    sha256.update(file_bytes)
    return sha256.hexdigest()

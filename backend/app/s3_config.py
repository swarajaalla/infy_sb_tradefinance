import os
import logging
from typing import Optional

import boto3
from botocore.exceptions import NoCredentialsError, ClientError
from botocore.config import Config

# ======================================================
# LOGGING
# ======================================================
logger = logging.getLogger("s3")
logging.basicConfig(level=logging.INFO)

# ======================================================
# ENV CONFIGURATION
# ======================================================
AWS_S3_BUCKET = os.getenv("AWS_S3_BUCKET")
AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")

if not AWS_S3_BUCKET:
    raise RuntimeError("AWS_S3_BUCKET environment variable is not set")

# ======================================================
# BOTO3 CLIENT
# ======================================================
s3_client = boto3.client(
    "s3",
    region_name=AWS_REGION,
    config=Config(
        retries={"max_attempts": 5, "mode": "standard"},
        signature_version="s3v4",
    ),
)

# ======================================================
# UPLOAD FILE (BYTES)
# ======================================================
def upload_file_to_s3(
    *,
    file_bytes: bytes,
    s3_key: str,
    content_type: Optional[str] = None,
    encrypt: bool = True,
) -> str:
    """
    Upload file bytes to S3.

    Returns:
        s3_key (store ONLY this in DB)
    """

    if not s3_key:
        raise ValueError("Invalid s3_key")

    extra_args = {}

    if content_type:
        extra_args["ContentType"] = content_type

    if encrypt:
        extra_args["ServerSideEncryption"] = "AES256"

    try:
        s3_client.put_object(
            Bucket=AWS_S3_BUCKET,
            Key=s3_key,
            Body=file_bytes,
            **extra_args,
        )
        logger.info(f"S3 upload successful: {s3_key}")
        return s3_key

    except NoCredentialsError:
        logger.exception("AWS credentials not found")
        raise RuntimeError("AWS credentials not found")

    except ClientError as e:
        logger.exception("S3 upload failed")
        raise RuntimeError(f"S3 upload failed: {e}")

# ======================================================
# GENERATE PRESIGNED DOWNLOAD URL
# ======================================================
def generate_presigned_url(
    *,
    s3_key: str,
    expires_in: int = 300,
) -> str:
    """
    Generate a secure, temporary download URL.
    """

    if not s3_key:
        raise ValueError("Invalid s3_key")

    try:
        url = s3_client.generate_presigned_url(
            ClientMethod="get_object",
            Params={
                "Bucket": AWS_S3_BUCKET,
                "Key": s3_key,
            },
            ExpiresIn=expires_in,
            HttpMethod="GET",
        )
        logger.info(f"Presigned URL generated for: {s3_key}")
        return url

    except NoCredentialsError:
        logger.exception("AWS credentials not found")
        raise RuntimeError("AWS credentials not found")

    except ClientError as e:
        logger.exception("Presigned URL generation failed")
        raise RuntimeError(f"Presigned URL generation failed: {e}")

# ======================================================
# CHECK OBJECT EXISTS
# ======================================================
def s3_object_exists(s3_key: str) -> bool:
    if not s3_key:
        return False

    try:
        s3_client.head_object(
            Bucket=AWS_S3_BUCKET,
            Key=s3_key,
        )
        return True
    except ClientError:
        return False

# ======================================================
# DELETE OBJECT (ADMIN / GDPR)
# ======================================================
def delete_file_from_s3(s3_key: str) -> None:
    if not s3_key:
        raise ValueError("Invalid s3_key")

    try:
        s3_client.delete_object(
            Bucket=AWS_S3_BUCKET,
            Key=s3_key,
        )
        logger.info(f"S3 object deleted: {s3_key}")
    except ClientError as e:
        logger.exception("S3 delete failed")
        raise RuntimeError(f"S3 delete failed: {e}")

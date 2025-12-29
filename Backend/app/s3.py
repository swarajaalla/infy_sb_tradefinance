# app/s3.py

import boto3
import os
import uuid
from fastapi import UploadFile

s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY"),
    aws_secret_access_key=os.getenv("AWS_SECRET_KEY"),
    region_name=os.getenv("AWS_REGION")
)

BUCKET_NAME = "tf-documents-s3"  # os.getenv("AWS_BUCKET_NAME")


def upload_file_to_s3(file: UploadFile, content_type: str | None = None) -> str:
    key = f"documents/{uuid.uuid4()}_{file.filename}"
    extra_args = {"ContentType": content_type} if content_type else {}

    s3_client.upload_fileobj(
        file.file,
        BUCKET_NAME,
        key,
        ExtraArgs=extra_args
    )

    return f"https://{BUCKET_NAME}.s3.amazonaws.com/{key}"

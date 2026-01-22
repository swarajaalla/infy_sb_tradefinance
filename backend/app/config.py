from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# ======================================================
# CORE SYSTEM CONFIG
# ======================================================
# This ensures all routers use the same Secret and Database
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "MYSECRETKEY123")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "600"))

# Database connection string (SQLite for local, Postgres for production)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./trade_finance.db")

# ======================================================
# AWS INFRASTRUCTURE (For Seller Uploads & Admin Integrity)
# ======================================================
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_S3_BUCKET = os.getenv("AWS_S3_BUCKET")
AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")
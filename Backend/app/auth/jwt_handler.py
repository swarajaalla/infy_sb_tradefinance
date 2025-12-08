from datetime import datetime, timedelta
from jose import jwt

SECRET_KEY = "Sumpe3Kq4rDdX06hN5xKJIQ9VbVLSkFoq1Bf41e0NhU"
ALGORITHM = "HS256"

def create_access_token(data: dict):
    token_data = data.copy()
    token_data["exp"] = datetime.utcnow() + timedelta(hours=1)
    return jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict):
    token_data = data.copy()
    token_data["exp"] = datetime.utcnow() + timedelta(days=7)
    return jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)

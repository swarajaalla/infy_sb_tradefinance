import os
from datetime import datetime, timedelta
from passlib.context import CryptContext
import jwt
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ENV variables
JWT_SECRET = os.getenv("JWT_SECRET", "defaultsecret")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))


# ----- HASH PASSWORD -----
def hash_password(password: str):
    """
    Hash user password using bcrypt
    """
    return pwd_context.hash(password)


# ----- VERIFY PASSWORD -----
def verify_password(plain_password: str, hashed_password: str):
    """
    Verify login password
    """
    return pwd_context.verify(plain_password, hashed_password)


# ----- CREATE JWT TOKEN -----
def create_token(data: dict):
    """
    Create JWT token with expiration
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})

    token = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token

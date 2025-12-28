import os

class Settings:
    PROJECT_NAME: str = "MyProject Backend"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:yourpassword@localhost:5432/postgres")

    JWT_SECRET: str = os.getenv("JWT_SECRET", "mysupersecretkey123")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

settings = Settings()

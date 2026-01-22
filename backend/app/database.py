from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# Import the centralized configuration
from .config import DATABASE_URL

# Create the SQLAlchemy engine
# pool_pre_ping=True is essential for blockchain explorers to handle 
# intermittent database connections without crashing
engine = create_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True
)

# SessionLocal is the factory for individual database sessions
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# Base class for all models (Trade, User, Document, etc.)
Base = declarative_base()

# Dependency used in routes to provide a database session
def get_db():
    """
    Interconnects routes with the database. 
    Automatically closes the session after the request is finished.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
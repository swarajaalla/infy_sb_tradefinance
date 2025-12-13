from sqlmodel import SQLModel, create_engine, Session

DATABASE_URL = "postgresql://postgres:bhav1234@localhost:5432/trade_finance"

engine = create_engine(DATABASE_URL, echo=False)

def get_session():
    with Session(engine) as session:
        yield session

def init_db():
    from . import models
    SQLModel.metadata.create_all(engine)


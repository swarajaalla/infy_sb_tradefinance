from fastapi import FastAPI
from app.auth.routes import router as auth_router
from app.database import Base, engine
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Trade Finance Explorer API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # later we restrict
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth_router)

@app.get("/")
def home():
    return {"message": "Backend Working Successfully 🚀"}






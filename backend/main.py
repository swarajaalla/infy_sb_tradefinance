from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.auth import router as auth_router
from backend.crud import router as crud_router

app = FastAPI(
    title="ChainDocs Backend",
    version="1.0.0",
    description="Milestone 1 Backend"
)

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(crud_router, prefix="/docs", tags=["Documents"])

@app.get("/")
def root():
    return {"message": "Backend running"}

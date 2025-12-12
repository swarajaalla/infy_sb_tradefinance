from fastapi import FastAPI, Depends
from app.auth.routes import router as auth_router
from app.database import Base, engine
from fastapi.middleware.cors import CORSMiddleware
from app.auth.dependencies import role_required
from app.routers import router as users_router
from app.document_routes import router as docs_router

app = FastAPI(title="Trade Finance Explorer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(docs_router)

@app.get("/")
def home():
    return {"message": "Backend Working Successfully 🚀"}



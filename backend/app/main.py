from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import Base, engine
from app import models  # ✅ IMPORTANT: loads TradeTransaction model

from app.auth.routes import router as auth_router
from app.documents.routes import router as document_router
from app.ledger.routes import router as ledger_router
from app.trades.routes import router as trade_router
from app.dashboard.routes import router as dashboard_router
from app.integrity.routes import router as integrity_router
from app.risk.routes import router as risk_router
from app.documents.routes import router as document_router

# ✅ CREATE ALL TABLES (NOW IT WILL WORK)
Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router)
app.include_router(document_router)
app.include_router(ledger_router)
app.include_router(trade_router)
app.include_router(dashboard_router)
app.include_router(integrity_router)
app.include_router(risk_router)
app.include_router(document_router)

@app.get("/")
def home():
    return {"message": "Backend running successfully!"}

app.mount(
    "/uploaded_docs",
    StaticFiles(directory="uploaded_docs"),
    name="uploaded_docs"
)

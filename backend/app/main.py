# 1. LOAD ENVIRONMENT VARIABLES FIRST
from . import config  # Use relative import to load .env safely

from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import json

# 2. DATABASE & MODELS
from .database import engine, get_db, Base # Relative imports
from . import models 

# 3. ROUTER REGISTRATION - RELATIVE PATHS
from .auth import router as auth_router
from .documents import router as documents_router
from .routers.trades import router as trades_router
from .routers.reports import router as reports_router      
from .routers.analytics import router as analytics_router 
from .routers.integrity import router as integrity_router 

# 4. APP INITIALIZATION
app = FastAPI(
    title="Trade Finance Blockchain Explorer",
    version="1.5.0",
    description="Secure node for Admin, Buyer, and Seller trade operations",
)

# 5. AUTO-CREATE TABLES
# This line prevents 'Failed to load' errors by ensuring DB tables exist
Base.metadata.create_all(bind=engine)

# 6. CORS CONFIGURATION
# Connects your API to the Vite Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 

# 7. WEBSOCKET MANAGER (Real-Time Role Alerts)
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast_alert(self, message: dict):
        for connection in self.active_connections:
            await connection.send_text(json.dumps(message))

manager = ConnectionManager()

# 8. ATTACH ROUTERS TO APP
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(documents_router, prefix="/documents", tags=["Digital Assets"])
app.include_router(trades_router, prefix="/trades", tags=["Trade Workflow"])    
app.include_router(reports_router, prefix="/reports", tags=["Reporting"])   
app.include_router(analytics_router, prefix="/analytics", tags=["Risk Analytics"]) 
app.include_router(integrity_router, prefix="/integrity", tags=["System Security"]) 

# 9. ENDPOINTS
@app.websocket("/ws/alerts")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/", tags=["Health"])
def home():
    return {"status": "Active", "node": "Blockchain Explorer Backend"}

@app.get("/db-test", tags=["Health"])
def db_test(db: Session = Depends(get_db)):
    return {"status": "Connected", "database": "SQL Engine Active"}
import os
import json
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any

from app.schemas import TelemetryIngestRequest, ChatQueryRequest
from app.services.telemetry_service import telemetry_service
from app.services.ai_service import master_ai
from app.db import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(title="TERRA-PULSE OS - FastAPI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
public_dir = os.path.join(BASE_DIR, "public")
views_dir = os.path.join(BASE_DIR, "views")

app.mount("/public", StaticFiles(directory=public_dir), name="public")
# Also mount root files like css/js directly if they were served from public directly
app.mount("/js", StaticFiles(directory=os.path.join(public_dir, "js")), name="js")
app.mount("/css", StaticFiles(directory=os.path.join(public_dir, "css")), name="css")
if os.path.exists(os.path.join(public_dir, "assets")):
    app.mount("/assets", StaticFiles(directory=os.path.join(public_dir, "assets")), name="assets")

# Simple EJS-like Jinja2 environment setup
templates = Jinja2Templates(directory=views_dir)
# Note: EJS syntax will need to be manually replaced or we just serve HTML files if they are available.
# The user's index.html in the root might be the main one now. Let's serve index.html directly for /

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, event: str, data: Any):
        for connection in self.active_connections:
            try:
                await connection.send_json({"event": event, "data": data})
            except Exception:
                pass

manager = ConnectionManager()

# Background task for Telemetry Broadcast
async def broadcast_telemetry_loop():
    while True:
        await asyncio.sleep(1.0)
        snapshot = telemetry_service.simulate_tick()
        ai_text = await master_ai.analyze_telemetry_stream(snapshot.dict())
        
        data = snapshot.dict()
        data['aiText'] = ai_text
        await manager.broadcast("telemetry", data)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(broadcast_telemetry_loop())

@app.get("/", response_class=HTMLResponse)
async def get_index(request: Request):
    return templates.TemplateResponse(request=request, name="index.ejs")

@app.get("/explainable-ml", response_class=HTMLResponse)
async def get_explainable_ml(request: Request):
    return templates.TemplateResponse(request=request, name="explainable-ml.ejs")

@app.get("/gods-eye-view", response_class=HTMLResponse)
async def get_gods_eye_view(request: Request):
    return templates.TemplateResponse(request=request, name="gods-eye-view.ejs")

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "FastAPI Master Engine"}

@app.post("/api/telemetry")
async def ingest_telemetry(payload: TelemetryIngestRequest):
    snapshot = telemetry_service.ingest_hardware_packet(payload.payload)
    return {"status": "success", "snapshot": snapshot}

@app.get("/api/telemetry")
async def get_telemetry():
    snapshot = telemetry_service.get_snapshot()
    return {"snapshot": snapshot}

@app.post("/api/chat")
async def chat_query(query: ChatQueryRequest):
    snapshot = telemetry_service.get_snapshot().dict()
    result = await master_ai.process_operator_query(query.query, snapshot, {"gemini_api_key": None})
    return {
        "reply": result.get("reply"),
        "source": result.get("source"),
        "isIntervention": result.get("isIntervention")
    }

@app.websocket("/ws/telemetry")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        snapshot = telemetry_service.get_snapshot().dict()
        snapshot['aiText'] = await master_ai.analyze_telemetry_stream(snapshot)
        await websocket.send_json({"event": "telemetry", "data": snapshot})
        
        while True:
            data = await websocket.receive_text()
            try:
                parsed = json.loads(data)
                if parsed.get('event') == 'chat_message':
                    msg = parsed.get('data', {}).get('message', '')
                    current_snap = telemetry_service.get_snapshot().dict()
                    
                    # Broadcast user message
                    await manager.broadcast("chat_broadcast", {
                        "sender": parsed.get('data', {}).get('user', 'Mine Operator'),
                        "text": msg,
                        "isAi": False
                    })
                    
                    result = await master_ai.process_operator_query(msg, current_snap)
                    
                    if result.get("isIntervention"):
                        override = telemetry_service.apply_operator_override(msg)
                        new_snap = override['snapshot'].dict()
                        new_snap['aiText'] = override['summary']
                        await manager.broadcast("telemetry", new_snap)
                        
                    await manager.broadcast("chat_broadcast", {
                        "sender": "TERRA-SENTINEL MASTER AI",
                        "text": result.get("reply"),
                        "source": result.get("source"),
                        "isAi": True
                    })
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)

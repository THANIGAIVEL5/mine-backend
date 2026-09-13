import os
import json
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, RedirectResponse
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

# Background auto-scanner for ESP32 / Arduino hardware on USB Serial COM ports
async def serial_com_scanner_loop():
    while True:
        try:
            import serial
            import serial.tools.list_ports
            com_ports = [p.device for p in serial.tools.list_ports.comports()]
            for port in com_ports:
                try:
                    with serial.Serial(port, 115200, timeout=0.4) as ser:
                        raw_line = ser.readline().decode('utf-8', errors='ignore').strip()
                        if raw_line.startswith('{') and raw_line.endswith('}'):
                            packet = json.loads(raw_line)
                            snap = telemetry_service.ingest_hardware_packet(packet)
                            snap_dict = snap.dict()
                            snap_dict['aiText'] = await master_ai.analyze_telemetry_stream(snap_dict)
                            await manager.broadcast("telemetry", snap_dict)
                except Exception:
                    pass
        except Exception:
            pass
        await asyncio.sleep(2.0)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(broadcast_telemetry_loop())
    asyncio.create_task(serial_com_scanner_loop())

@app.get("/", response_class=HTMLResponse)
async def get_index(request: Request):
    return templates.TemplateResponse(request=request, name="index.ejs")

@app.get("/explainable-ml", response_class=HTMLResponse)
async def get_explainable_ml(request: Request):
    return templates.TemplateResponse(request=request, name="explainable-ml.ejs")

@app.get("/gods-eye-view")
async def get_gods_eye_view():
    return RedirectResponse(url="/", status_code=302)

@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "service": "FastAPI Master Engine",
        "websocket": "/ws/telemetry",
        "telemetryConnected": True,
        "nodesOnline": 5
    }

@app.post("/api/telemetry")
async def ingest_telemetry(request: Request):
    try:
        body = await request.json()
    except Exception:
        body = {}
    
    # Handle flat JSON, nested payload, or TelemetryIngestRequest format
    if isinstance(body, dict):
        raw_data = body.get("payload", body)
    else:
        raw_data = {}

    snapshot = telemetry_service.ingest_hardware_packet(raw_data)
    snap_dict = snapshot.dict()
    ai_text = await master_ai.analyze_telemetry_stream(snap_dict)
    snap_dict['aiText'] = ai_text
    
    # Immediately broadcast to all live connected browsers/control room screens!
    await manager.broadcast("telemetry", snap_dict)
    
    return {
        "status": "success",
        "received": True,
        "phase": snapshot.phase,
        "isHardware": snapshot.isHardware,
        "snapshot": snapshot
    }

@app.post("/api/telemetry/hardware-mode")
async def toggle_hardware_mode(request: Request):
    try:
        body = await request.json()
    except Exception:
        body = {}
    enabled = body.get("enabled", True)
    telemetry_service.set_hardware_mode(enabled)
    snap_dict = telemetry_service.get_snapshot().dict()
    await manager.broadcast("telemetry", snap_dict)
    return {"status": "success", "hardwareMode": enabled}

@app.get("/api/telemetry")
async def get_telemetry():
    snapshot = telemetry_service.get_snapshot()
    return {"snapshot": snapshot, "connected": True, "nodesOnline": 5}

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

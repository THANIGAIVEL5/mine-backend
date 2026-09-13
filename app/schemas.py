from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class TelemetrySnapshot(BaseModel):
    pitch: float = 0.0
    roll: float = 0.0
    disp: float = 0.0
    rms: float = 0.0
    p2p: float = 0.0
    fft: float = 0.0
    temp: float = 0.0
    humidity: float = 0.0
    co: float = 0.0
    nh3: float = 0.0
    co2: float = 0.0
    aqi: float = 0.0
    sump: float = 0.0
    adc_sump: float = 0.0
    lat: float = 0.0
    lon: float = 0.0
    alt: float = 0.0
    sats: int = 0
    hdop: float = 0.0
    rssi: int = 0
    pkt: int = 0
    phase: str = "IDLE"
    node: str = "T1"
    isHardware: bool = False
    aiText: str = ""

class TelemetryIngestRequest(BaseModel):
    node_id: str
    payload: Dict[str, Any]

class ChatQueryRequest(BaseModel):
    query: str
    context: Optional[str] = None
    node_id: Optional[str] = None

class ChatBroadcastMessage(BaseModel):
    message: str
    source: str = "Master AI"
    severity: str = "info" # info, warning, critical

class EvacuationDirective(BaseModel):
    protocol: str = "DGMS Regulation 124"
    status: str
    escape_routes: List[str] = []
    muster_points: List[str] = []
    personnel_count: Optional[int] = None
    reason: str

class GeoJsonGeometry(BaseModel):
    type: str
    coordinates: List[Any]

class GeoJsonFeature(BaseModel):
    type: str = "Feature"
    geometry: GeoJsonGeometry
    properties: Dict[str, Any] = {}

class GeoJsonFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJsonFeature] = []

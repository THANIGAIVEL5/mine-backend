export interface TelemetryData {
  pitch: number;
  roll: number;
  disp: number;
  rms: number;
  p2p: number;
  fft: number;
  temp: number;
  humidity: number;
  aqi: number;
  co: number;
  nh3: number;
  co2: number;
  sump: number;
  lat: number;
  lon: number;
  alt: number;
  sats: number;
  hdop: number;
  rssi: number;
  pkt: number;
  phase: 'STABLE' | 'WARNING' | 'CRITICAL' | 'RECOVERY';
  node: string;
  isHardware: boolean;
  aiText: string;
}

export interface NodeData {
  id: string;
  lat: number;
  lon: number;
  status: string;
}

export interface GeoJsonGeometry {
  type: string;
  coordinates: any[];
}

export interface GeoJsonFeature {
  type: 'Feature';
  geometry: GeoJsonGeometry;
  properties: any;
}

export interface GeoJsonFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}

export interface DgmsProtocolState {
  active: boolean;
  level: string;
}

export interface ChatMessage {
  sender: string;
  text: string;
  timestamp: string;
  isAi: boolean;
  source?: string;
  isIntervention?: boolean;
}

export interface MasterAiQuery {
  message: string;
  user: string;
  geminiApiKey?: string;
}

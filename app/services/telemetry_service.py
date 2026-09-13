import time
import math
import random
from app.schemas import TelemetrySnapshot

class TelemetryService:
    def __init__(self):
        self.last_hardware_packet_time = 0.0
        
        # Baseline Geotechnical Sensor State
        self.pitch = 0.5
        self.roll = -0.2
        self.disp = 0.1
        self.rms = 0.15
        self.temp = 38.6
        self.humidity = 78.5
        self.co = 12.0
        self.sump = 2.74
        
        # NEO-6M GNSS Coordinates (Chasnala Deep Mine)
        self.gps_lat = 23.795741
        self.gps_lon = 86.430412
        self.gps_alt = 184.2
        self.gps_sats = 9
        self.gps_hdop = 0.82
        
        # LoRa Gateway RF Telemetry
        self.rssi_val = -84
        self.pkt_flow = 42
        self.force_hardware_mode = True
        
        # Autonomous Safety Phase: STABLE, WARNING, CRITICAL, RECOVERY
        self.phase = 'STABLE'
        self.ticks = 0

    def set_hardware_mode(self, enabled: bool):
        self.force_hardware_mode = enabled
        if enabled:
            self.last_hardware_packet_time = time.time()

    def ingest_hardware_packet(self, data: dict) -> TelemetrySnapshot:
        self.last_hardware_packet_time = time.time()
        self.force_hardware_mode = True

        # Map ADXL345 / MPU6050 Tilt & Flexure
        if 'pitch' in data: self.pitch = float(data['pitch'])
        if 'roll' in data: self.roll = float(data['roll'])
        if 'disp' in data: self.disp = float(data['disp'])
        else: self.disp = math.sqrt(self.pitch * self.pitch + self.roll * self.roll)

        # Map Piezo Vibration RMS
        if 'rms' in data: self.rms = float(data['rms'])

        # Map REL_35 Water Level Sensor
        if 'sump' in data: self.sump = float(data['sump'])
        elif 'water_depth' in data: self.sump = float(data['water_depth'])

        # Map DS18B20 / DHT11 Temperatures
        if 'temp' in data: self.temp = float(data['temp'])
        if 'humidity' in data: self.humidity = float(data['humidity'])

        # Map MQ135 Gases
        if 'co' in data: self.co = float(data['co'])

        # Map NEO-6M GNSS Coordinates
        if 'lat' in data: self.gps_lat = float(data['lat'])
        if 'lon' in data: self.gps_lon = float(data['lon'])
        if 'alt' in data: self.gps_alt = float(data['alt'])
        if 'sats' in data: self.gps_sats = int(data['sats'])
        if 'hdop' in data: self.gps_hdop = float(data['hdop'])

        # Map LoRa Gateway RSSI & flow
        if 'rssi' in data: self.rssi_val = int(data['rssi'])
        if 'pkt' in data: self.pkt_flow = int(data['pkt'])

        self.evaluate_phase()

        return self.get_snapshot(is_hardware=True, node=data.get('node', 'NODE-03-PILLAR-4B'))

    def evaluate_phase(self) -> str:
        if self.disp > 1.2 or self.rms > 0.35 or self.co > 50.0:
            self.phase = 'CRITICAL'
        elif self.disp > 0.4 or self.rms > 0.22 or self.co > 25.0:
            self.phase = 'WARNING'
        else:
            self.phase = 'STABLE'
        return self.phase

    def simulate_tick(self) -> TelemetrySnapshot:
        is_hardware_active = (time.time() - self.last_hardware_packet_time) < 4.0
        if is_hardware_active:
            return self.get_snapshot(is_hardware=True)

        self.ticks += 1
        if self.ticks <= 30:
            self.phase = 'STABLE'
        elif self.ticks <= 50:
            self.phase = 'WARNING'
        elif self.ticks <= 65:
            self.phase = 'CRITICAL'
        elif self.ticks <= 75:
            self.phase = 'RECOVERY'
        else:
            self.ticks = 0

        def jitter(mag):
            return (random.random() - 0.5) * mag

        if self.phase == 'STABLE':
            self.pitch = 0.5 + jitter(0.2)
            self.roll = -0.2 + jitter(0.2)
            self.rms = 0.15 + jitter(0.05)
            self.co = 12.0 + jitter(1.0)
            self.disp = 0.1 + jitter(0.05)
        elif self.phase == 'WARNING':
            self.pitch += 0.08 + jitter(0.1)
            self.roll -= 0.05 + jitter(0.1)
            self.rms += 0.01 + jitter(0.02)
            self.co += 0.5 + jitter(1.0)
            self.disp += 0.05 + jitter(0.02)
        elif self.phase == 'CRITICAL':
            self.pitch += 0.25 + jitter(0.3)
            self.rms += 0.03 + jitter(0.05)
            self.co += 1.5 + jitter(2.0)
            self.disp += 0.2 + jitter(0.1)
        elif self.phase == 'RECOVERY':
            self.pitch += (0.5 - self.pitch) * 0.2
            self.roll += (-0.2 - self.roll) * 0.2
            self.rms += (0.15 - self.rms) * 0.2
            self.co += (12.0 - self.co) * 0.2
            self.disp += (0.1 - self.disp) * 0.2

        self.temp += jitter(0.05)
        self.sump += 0.01 + jitter(0.01)

        return self.get_snapshot(is_hardware=False)

    def apply_operator_override(self, command_text: str) -> dict:
        lower = command_text.lower()
        override_summary = ''

        if any(w in lower for w in ['evacuat', 'klaxon', 'critical', 'alarm']):
            self.phase = 'CRITICAL'
            self.ticks = 52
            self.co = 68.0
            self.disp = 1.35
            self.rms = 0.38
            override_summary = '[OPERATOR INTERVENTION] Emergency evacuation override active across Sector 4B.'
        elif any(w in lower for w in ['pump', 'sump', 'dewater']):
            self.sump = max(0.4, self.sump - 1.2)
            override_summary = '[OPERATOR INTERVENTION] Shaft 12 turbine dewatering override engaged (500 GPM).'
        elif any(w in lower for w in ['chock', 'hydraulic', 'roof']):
            self.disp = max(0.05, self.disp - 0.25)
            self.pitch = max(0.3, self.pitch - 0.4)
            override_summary = '[OPERATOR INTERVENTION] Face 4B hydraulic chocks pre-tensioned to 350 bar.'
        elif any(w in lower for w in ['ventilat', 'fan', 'gas', 'co']):
            self.phase = 'RECOVERY'
            self.co = max(10, self.co - 20)
            override_summary = '[OPERATOR INTERVENTION] Auxiliary ventilation boosted to 100% capacity.'
        elif any(w in lower for w in ['reset', 'stable']):
            self.phase = 'STABLE'
            self.ticks = 5
            self.co = 12.0
            self.disp = 0.1
            self.rms = 0.15
            override_summary = '[OPERATOR INTERVENTION] Mine telemetry baseline reset to STABLE by operator command.'

        return {
            'snapshot': self.get_snapshot(is_hardware=False),
            'summary': override_summary
        }

    def get_snapshot(self, is_hardware=None, node=None) -> TelemetrySnapshot:
        if is_hardware is None:
            is_hardware = self.force_hardware_mode or ((time.time() - self.last_hardware_packet_time) < 10.0)

        latency = math.floor(random.random() * 12) + 14
        pkt = self.pkt_flow if is_hardware else math.floor(random.random() * 5) + 40
        fft = 48.0 + (0 if is_hardware else (random.random() - 0.5) * 1.0)

        snapshot_data = {
            'pitch': self.pitch,
            'roll': self.roll,
            'disp': self.disp,
            'rms': self.rms,
            'p2p': self.rms * 3.14,
            'fft': fft,
            'temp': self.temp,
            'humidity': self.humidity,
            'aqi': 180.0 + math.floor(self.co * 1.5),
            'co': math.floor(self.co),
            'nh3': 4.0,
            'co2': 1120.0 + math.floor(self.co * 8),
            'sump': self.sump,
            'lat': self.gps_lat,
            'lon': self.gps_lon,
            'alt': self.gps_alt,
            'sats': self.gps_sats,
            'hdop': self.gps_hdop,
            'rssi': self.rssi_val,
            'pkt': pkt,
            'phase': self.phase,
            'node': node or 'NODE-03-PILLAR-4B',
            'isHardware': is_hardware,
            'aiText': ""
        }
        
        return TelemetrySnapshot(**snapshot_data)

telemetry_service = TelemetryService()

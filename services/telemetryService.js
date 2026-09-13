/**
 * Telemetry Service - Terra-Pulse IoT Sensor State & Ingestion Core
 * Centralizes hardware packet parsing, DGMS safety threshold evaluation,
 * realistic simulation jitter, and physical operator command overrides.
 */

class TelemetryService {
  constructor() {
    this.lastHardwarePacketTime = 0;
    
    // Baseline Geotechnical Sensor State
    this.pitch = 0.5;
    this.roll = -0.2;
    this.disp = 0.1;
    this.rms = 0.15;
    this.temp = 38.6;
    this.humidity = 78.5;
    this.co = 12.0;
    this.sump = 2.74;
    
    // NEO-6M GNSS Coordinates (Chasnala Deep Mine)
    this.gpsLat = 23.795741;
    this.gpsLon = 86.430412;
    this.gpsAlt = 184.2;
    this.gpsSats = 9;
    this.gpsHdop = 0.82;
    
    // LoRa Gateway RF Telemetry
    this.rssiVal = -84;
    this.pktFlow = 42;
    
    // Autonomous Safety Phase: STABLE, WARNING, CRITICAL, RECOVERY
    this.phase = 'STABLE';
    this.ticks = 0;
  }

  /**
   * Ingest telemetry payload from ESP32-S3 or LoRa Gateway
   */
  ingestHardwarePacket(data = {}) {
    this.lastHardwarePacketTime = Date.now();

    // Map ADXL345 / MPU6050 Tilt & Flexure
    if (data.pitch !== undefined) this.pitch = Number(data.pitch);
    if (data.roll !== undefined) this.roll = Number(data.roll);
    if (data.disp !== undefined) this.disp = Number(data.disp);
    else this.disp = Math.sqrt(this.pitch * this.pitch + this.roll * this.roll);

    // Map Piezo Vibration RMS
    if (data.rms !== undefined) this.rms = Number(data.rms);

    // Map REL_35 Water Level Sensor
    if (data.sump !== undefined) this.sump = Number(data.sump);
    else if (data.water_depth !== undefined) this.sump = Number(data.water_depth);

    // Map DS18B20 / DHT11 Temperatures
    if (data.temp !== undefined) this.temp = Number(data.temp);
    if (data.humidity !== undefined) this.humidity = Number(data.humidity);

    // Map MQ135 Gases
    if (data.co !== undefined) this.co = Number(data.co);

    // Map NEO-6M GNSS Coordinates
    if (data.lat !== undefined) this.gpsLat = Number(data.lat);
    if (data.lon !== undefined) this.gpsLon = Number(data.lon);
    if (data.alt !== undefined) this.gpsAlt = Number(data.alt);
    if (data.sats !== undefined) this.gpsSats = Number(data.sats);
    if (data.hdop !== undefined) this.gpsHdop = Number(data.hdop);

    // Map LoRa Gateway RSSI & flow
    if (data.rssi !== undefined) this.rssiVal = Number(data.rssi);
    if (data.pkt !== undefined) this.pktFlow = Number(data.pkt);

    // Evaluate DGMS safety interlock thresholds
    this.evaluatePhase();

    return this.getSnapshot({ isHardware: true, node: data.node || 'NODE-03-PILLAR-4B' });
  }

  /**
   * Determine DGMS-compliant safety state
   */
  evaluatePhase() {
    if (this.disp > 1.2 || this.rms > 0.35 || this.co > 50.0) {
      this.phase = 'CRITICAL';
    } else if (this.disp > 0.4 || this.rms > 0.22 || this.co > 25.0) {
      this.phase = 'WARNING';
    } else {
      this.phase = 'STABLE';
    }
    return this.phase;
  }

  /**
   * Apply autonomous continuous simulation tick when no hardware is transmitting
   */
  simulateTick() {
    const isHardwareActive = (Date.now() - this.lastHardwarePacketTime) < 4000;
    if (isHardwareActive) return this.getSnapshot({ isHardware: true });

    this.ticks++;
    if (this.ticks <= 30) {
      this.phase = 'STABLE';
    } else if (this.ticks <= 50) {
      this.phase = 'WARNING';
    } else if (this.ticks <= 65) {
      this.phase = 'CRITICAL';
    } else if (this.ticks <= 75) {
      this.phase = 'RECOVERY';
    } else {
      this.ticks = 0;
    }

    const jitter = (mag) => (Math.random() - 0.5) * mag;

    switch (this.phase) {
      case 'STABLE':
        this.pitch = 0.5 + jitter(0.2);
        this.roll = -0.2 + jitter(0.2);
        this.rms = 0.15 + jitter(0.05);
        this.co = 12.0 + jitter(1.0);
        this.disp = 0.1 + jitter(0.05);
        break;

      case 'WARNING':
        this.pitch += 0.08 + jitter(0.1);
        this.roll -= 0.05 + jitter(0.1);
        this.rms += 0.01 + jitter(0.02);
        this.co += 0.5 + jitter(1.0);
        this.disp += 0.05 + jitter(0.02);
        break;

      case 'CRITICAL':
        this.pitch += 0.25 + jitter(0.3);
        this.rms += 0.03 + jitter(0.05);
        this.co += 1.5 + jitter(2.0);
        this.disp += 0.2 + jitter(0.1);
        break;

      case 'RECOVERY':
        this.pitch += (0.5 - this.pitch) * 0.2;
        this.roll += (-0.2 - this.roll) * 0.2;
        this.rms += (0.15 - this.rms) * 0.2;
        this.co += (12.0 - this.co) * 0.2;
        this.disp += (0.1 - this.disp) * 0.2;
        break;
    }

    this.temp += jitter(0.05);
    this.sump += 0.01 + jitter(0.01);

    return this.getSnapshot({ isHardware: false });
  }

  /**
   * Apply direct physical intervention overrides from the Operator
   */
  applyOperatorOverride(commandText) {
    const lower = commandText.toLowerCase();
    let overrideSummary = '';

    if (lower.includes('evacuat') || lower.includes('klaxon') || lower.includes('critical') || lower.includes('alarm')) {
      this.phase = 'CRITICAL';
      this.ticks = 52;
      this.co = 68.0;
      this.disp = 1.35;
      this.rms = 0.38;
      overrideSummary = '[OPERATOR INTERVENTION] Emergency evacuation override active across Sector 4B.';
    } else if (lower.includes('pump') || lower.includes('sump') || lower.includes('dewater')) {
      this.sump = Math.max(0.4, this.sump - 1.2);
      overrideSummary = '[OPERATOR INTERVENTION] Shaft 12 turbine dewatering override engaged (500 GPM).';
    } else if (lower.includes('chock') || lower.includes('hydraulic') || lower.includes('roof')) {
      this.disp = Math.max(0.05, this.disp - 0.25);
      this.pitch = Math.max(0.3, this.pitch - 0.4);
      overrideSummary = '[OPERATOR INTERVENTION] Face 4B hydraulic chocks pre-tensioned to 350 bar.';
    } else if (lower.includes('ventilat') || lower.includes('fan') || lower.includes('gas') || lower.includes('co')) {
      this.phase = 'RECOVERY';
      this.co = Math.max(10, this.co - 20);
      overrideSummary = '[OPERATOR INTERVENTION] Auxiliary ventilation boosted to 100% capacity.';
    } else if (lower.includes('reset') || lower.includes('stable')) {
      this.phase = 'STABLE';
      this.ticks = 5;
      this.co = 12.0;
      this.disp = 0.1;
      this.rms = 0.15;
      overrideSummary = '[OPERATOR INTERVENTION] Mine telemetry baseline reset to STABLE by operator command.';
    }

    return {
      snapshot: this.getSnapshot({ isHardware: false }),
      summary: overrideSummary
    };
  }

  /**
   * Produce standard broadcast telemetry packet
   */
  getSnapshot(extra = {}) {
    const isHardware = extra.isHardware !== undefined ? extra.isHardware : ((Date.now() - this.lastHardwarePacketTime) < 4000);
    return {
      latency: Math.floor(Math.random() * 12) + 14,
      rssi: this.rssiVal,
      pkt: isHardware ? this.pktFlow : Math.floor(Math.random() * 5) + 40,
      pitch: this.pitch,
      roll: this.roll,
      disp: this.disp,
      rms: this.rms,
      p2p: this.rms * 3.14,
      fft: 48.0 + (isHardware ? 0 : (Math.random() - 0.5) * 1.0),
      temp: this.temp,
      humidity: this.humidity,
      aqi: 180 + Math.floor(this.co * 1.5),
      co: Math.floor(this.co),
      nh3: 4,
      co2: 1120 + Math.floor(this.co * 8),
      sump: this.sump,
      lat: this.gpsLat,
      lon: this.gpsLon,
      alt: this.gpsAlt,
      sats: this.gpsSats,
      hdop: this.gpsHdop,
      phase: this.phase,
      isHardware: isHardware,
      sensorNode: extra.node || 'NODE-03-PILLAR-4B',
      ...extra
    };
  }
}

module.exports = new TelemetryService();

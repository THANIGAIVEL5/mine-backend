const express = require('express');
const router = express.Router();
const telemetryService = require('../services/telemetryService');

/**
 * POST /api/telemetry
 * Ingest sensor payload from ESP32-S3 or LoRa Gateway
 */
router.post('/', (req, res) => {
  try {
    const data = req.body || {};
    const snapshot = telemetryService.ingestHardwarePacket(data);

    // Broadcast updated telemetry to all connected control room HUDs
    const io = req.app.get('io');
    const getAiAnalysis = req.app.get('getLatestAiAnalysis');
    const aiText = getAiAnalysis ? getAiAnalysis() : undefined;

    if (io) {
      io.emit('telemetry', { ...snapshot, aiText });
    }

    return res.json({
      status: 'success',
      received: true,
      phase: snapshot.phase,
      snapshot
    });
  } catch (err) {
    console.error('Error ingesting hardware telemetry:', err);
    return res.status(500).json({ error: 'Ingestion error', message: err.message });
  }
});

/**
 * GET /api/telemetry
 * Retrieve latest telemetry snapshot
 */
router.get('/', (req, res) => {
  const snapshot = telemetryService.getSnapshot();
  const getAiAnalysis = req.app.get('getLatestAiAnalysis');
  const aiText = getAiAnalysis ? getAiAnalysis() : undefined;
  return res.json({ ...snapshot, aiText });
});

/**
 * GET /api/telemetry/geojson
 * Export live subterranean sensor nodes & subsidence vectors in standard GeoJSON format
 * for direct pairing with God's Eye View, Cesium, and spatial GIS globes.
 */
router.get('/geojson', (req, res) => {
  const s = telemetryService.getSnapshot();
  const getAiAnalysis = req.app.get('getLatestAiAnalysis');
  const aiText = getAiAnalysis ? getAiAnalysis() : '';

  const geojson = {
    type: "FeatureCollection",
    metadata: {
      title: "TERRA-PULSE OS - God's Eye View Spatial Mine Layer",
      site: "Chasnala Deep Mine Sector 4B",
      updatedAt: new Date().toISOString(),
      phase: s.phase,
      aiDirective: aiText
    },
    features: [
      {
        type: "Feature",
        id: "NODE-03",
        geometry: {
          type: "Point",
          coordinates: [s.lon, s.lat, s.alt]
        },
        properties: {
          name: "NODE-03: Pillar 4B Stope (Active Focus)",
          status: s.phase,
          pitch: s.pitch,
          roll: s.roll,
          disp: s.disp,
          rms_vibration: s.rms,
          temp_c: s.temp,
          humidity_pct: s.humidity,
          sump_depth_m: s.sump,
          co_ppm: s.co,
          aqi: s.aqi,
          satellites: s.sats,
          hdop: s.hdop,
          sensor_water: "REL_35 Resistive Sensor",
          sensor_gyro: "ADXL345",
          sensor_vibe: "Gravity Flexible Piezo",
          color: s.phase === 'CRITICAL' ? '#ef4444' : s.phase === 'WARNING' ? '#f59e0b' : '#10b981'
        }
      },
      {
        type: "Feature",
        id: "NODE-01",
        geometry: {
          type: "Point",
          coordinates: [s.lon - 0.0035, s.lat + 0.0028, s.alt + 12.5]
        },
        properties: {
          name: "NODE-01: Shaft #2 North Drift",
          status: "STABLE",
          pitch: 0.3,
          roll: 0.1,
          disp: 0.05,
          rms_vibration: 0.12,
          temp_c: 34.2,
          sump_depth_m: 0.8,
          co_ppm: 9,
          color: "#10b981"
        }
      },
      {
        type: "Feature",
        id: "NODE-02",
        geometry: {
          type: "Point",
          coordinates: [s.lon + 0.0042, s.lat + 0.0015, s.alt + 35.0]
        },
        properties: {
          name: "NODE-02: Overburden Haul Road",
          status: "WATCH",
          pitch: 1.4,
          roll: -0.8,
          disp: 0.35,
          rms_vibration: 0.22,
          temp_c: 36.5,
          sump_depth_m: 0.0,
          co_ppm: 14,
          color: "#f59e0b"
        }
      },
      {
        type: "Feature",
        id: "NODE-04",
        geometry: {
          type: "Point",
          coordinates: [s.lon - 0.0022, s.lat - 0.0031, s.alt - 42.0]
        },
        properties: {
          name: "NODE-04: Sub-Gallery Sump Basin",
          status: "STABLE",
          pitch: -0.2,
          roll: 0.3,
          disp: 0.12,
          rms_vibration: 0.14,
          temp_c: 32.1,
          sump_depth_m: s.sump,
          co_ppm: 8,
          color: "#0ea5e9"
        }
      },
      {
        type: "Feature",
        id: "SUBSIDENCE-VECTOR",
        geometry: {
          type: "LineString",
          coordinates: [
            [s.lon, s.lat, s.alt],
            [s.lon + (s.disp * 0.0001), s.lat - (s.disp * 0.00015), s.alt - (s.disp * 0.5)]
          ]
        },
        properties: {
          name: "Differential Subsidence Displacement Vector",
          rate_mm_hr: (s.disp * 1.8).toFixed(2),
          color: "#f43f5e"
        }
      }
    ]
  };

  res.setHeader('Content-Type', 'application/json');
  return res.json(geojson);
});

module.exports = router;

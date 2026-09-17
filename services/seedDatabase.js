const TelemetryLog = require('../models/TelemetryLog');
const IncidentAlert = require('../models/IncidentAlert');
const MinerShift = require('../models/MinerShift');
const SafetyAudit = require('../models/SafetyAudit');

async function seedDatabase() {
  try {
    // 1. Seed Telemetry Logs if empty
    const countLogs = await TelemetryLog.count();
    if (countLogs === 0) {
      await TelemetryLog.bulkCreate([
        { site: 'Chasnala Deep Mine Sector 4B', sector: 'Sector 4B', phase: 'STABLE', pitch: 0.5, roll: -0.2, rms: 0.15, co: 12, ch4: 0.05, disp: 0.10, sump: 1.30, temp: 38.6, timestamp: new Date(Date.now() - 3600000) },
        { site: 'Chasnala Deep Mine Sector 4B', sector: 'Sector 4B', phase: 'STABLE', pitch: 0.8, roll: -0.3, rms: 0.18, co: 15, ch4: 0.06, disp: 0.15, sump: 1.32, temp: 38.8, timestamp: new Date(Date.now() - 2700000) },
        { site: 'Chasnala Deep Mine Sector 4B', sector: 'Sector 4B', phase: 'WARNING', pitch: 2.1, roll: -0.6, rms: 0.32, co: 28, ch4: 0.12, disp: 0.42, sump: 1.45, temp: 39.5, timestamp: new Date(Date.now() - 1800000) },
        { site: 'Chasnala Deep Mine Sector 4B', sector: 'Sector 4B', phase: 'CRITICAL', pitch: 3.4, roll: -1.2, rms: 0.58, co: 54, ch4: 0.28, disp: 0.85, sump: 1.82, temp: 41.2, timestamp: new Date(Date.now() - 900000) },
        { site: 'Chasnala Deep Mine Sector 4B', sector: 'Sector 4B', phase: 'STABLE', pitch: 0.5, roll: -0.2, rms: 0.15, co: 12, ch4: 0.05, disp: 0.10, sump: 1.30, temp: 38.6, timestamp: new Date() }
      ]);
      console.log('🌱 Telemetry logs seeded successfully.');
    }

    // 2. Seed Incident Alerts if empty
    const countAlerts = await IncidentAlert.count();
    if (countAlerts === 0) {
      await IncidentAlert.bulkCreate([
        { sector: 'Sector 4B', severity: 'WARNING', alert_type: 'GAS_CO_SPIKE', description: 'Carbon Monoxide concentration spiked to 28 PPM at Pillar 4B Gallery.', action_taken: 'Auxiliary ventilation booster fans commanded to 100% duty cycle.', timestamp: new Date(Date.now() - 1800000) },
        { sector: 'Sector 4B', severity: 'CRITICAL', alert_type: 'STRATA_DELAMINATION', description: 'Roof delamination displacement velocity crossed 2.8°/hr dynamic limit at Pillar 4B.', action_taken: 'Continuous 3-tone evacuation klaxon activated across Shaft 12.', timestamp: new Date(Date.now() - 900000) },
        { sector: 'Shaft 12', severity: 'INFO', alert_type: 'SUMP_WATER_INRUSH', description: 'Hydrostatic sump water depth reached 1.82m baseline limit.', action_taken: '500 GPM primary turbine dewatering pump forced online.', timestamp: new Date(Date.now() - 450000) }
      ]);
      console.log('🌱 Incident alerts seeded successfully.');
    }

    // 3. Seed Miner Shifts if empty
    const countMiners = await MinerShift.count();
    if (countMiners === 0) {
      await MinerShift.bulkCreate([
        { miner_id: 'MNR-401', name: 'Rajesh Kumar', role: 'Shift In-Charge', sector: 'Sector 4B', zone: 'Drift 12', scsr_status: 'OPERATIONAL', status: 'ACTIVE_UNDERGROUND', shift_start: new Date(Date.now() - 14400000) },
        { miner_id: 'MNR-402', name: 'Amit Singh', role: 'Face Miner', sector: 'Sector 4B', zone: 'Pillar 4B Gallery', scsr_status: 'OPERATIONAL', status: 'ACTIVE_UNDERGROUND', shift_start: new Date(Date.now() - 14400000) },
        { miner_id: 'MNR-403', name: 'Sanjay Mahato', role: 'Ventilation Tech', sector: 'Sector 4B', zone: 'Shaft 12', scsr_status: 'OPERATIONAL', status: 'ACTIVE_UNDERGROUND', shift_start: new Date(Date.now() - 10800000) },
        { miner_id: 'MNR-404', name: 'Deepak Verma', role: 'Electrical Engineer', sector: 'Sector 4B', zone: 'Refuge Bay 3B', scsr_status: 'OPERATIONAL', status: 'ACTIVE_UNDERGROUND', shift_start: new Date(Date.now() - 7200000) },
        { miner_id: 'MNR-405', name: 'Vikram Bauri', role: 'Geotechnical Analyst', sector: 'Sector 4B', zone: 'Control Room Surface', scsr_status: 'OPERATIONAL', status: 'SURFACE_STANDBY', shift_start: new Date(Date.now() - 18000000) }
      ]);
      console.log('🌱 Miner shift records seeded successfully.');
    }

    // 4. Seed Safety Audits if empty
    const countAudits = await SafetyAudit.count();
    if (countAudits === 0) {
      await SafetyAudit.bulkCreate([
        { form_type: 'DGMS Form IV', auditor: 'Director General Inspectorate (Dhanbad Zone)', sector: 'Chasnala Deep Mine Sector 4B', compliance_rating: '100% COMPLIANT', dgms_rule_reference: 'DGMS CMR 2017 Reg 124', findings: 'All 5 telemetry sensor nodes calibrated. Atmospheric CH4 and CO continuous monitoring active.', created_at: new Date(Date.now() - 86400000) },
        { form_type: 'Statutory Strata Review', auditor: 'Chief Strata Control Officer', sector: 'Sector 4B Pillar 4B Gallery', compliance_rating: 'NEEDS_ATTENTION', dgms_rule_reference: 'DGMS CMR 2017 Reg 130', findings: 'Pre-tensioning yield pressure on hydraulic chocks verified at 320 bar.', created_at: new Date(Date.now() - 43200000) }
      ]);
      console.log('🌱 Safety audit logs seeded successfully.');
    }
  } catch (err) {
    console.error('Seed database notice:', err.message);
  }
}

module.exports = seedDatabase;

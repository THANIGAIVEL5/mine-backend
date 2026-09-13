use serde::{Deserialize, Serialize};
use rand::Rng;
use std::time::SystemTime;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SensorData {
    pub tilt_x: f64,
    pub tilt_y: f64,
    pub pore_pressure: f64,
    pub seismic_vibration: f64,
    pub water_table_depth: f64,
    pub displacement_rate: f64,
    pub factor_of_safety: f64,
    pub hazard_level: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TelemetryPayload {
    pub timestamp: String,
    pub overall_hazard_level: String,
    pub hazard_color: String,
    pub sensors: SensorData,
}

pub fn generate_telemetry() -> TelemetryPayload {
    let mut rng = rand::thread_rng();

    let tilt_x = 3.84 + rng.gen_range(-0.15..0.15);
    let tilt_y = 1.12 + rng.gen_range(-0.10..0.10);
    let pore_pressure = 48.5 + rng.gen_range(-1.2..1.2);
    let seismic_vibration = 48.0 + rng.gen_range(-2.5..2.5);
    let water_table_depth = 14.2 + rng.gen_range(-0.3..0.3);
    let displacement_rate = 1.84 + rng.gen_range(-0.08..0.08);
    let factor_of_safety = 1.15 + rng.gen_range(-0.02..0.02);

    let (overall_hazard_level, hazard_color) = if tilt_x > 3.5 || seismic_vibration > 45.0 {
        ("HAZARD LEVEL IV - CRITICAL", "#ff3366")
    } else if tilt_x > 2.5 {
        ("HAZARD LEVEL III - ELEVATED", "#f59e0b")
    } else {
        ("HAZARD LEVEL I - NOMINAL", "#10b981")
    };

    let iso_timestamp = match SystemTime::now().duration_since(SystemTime::UNIX_EPOCH) {
        Ok(n) => format!("{}", n.as_secs()),
        Err(_) => "0".to_string(),
    };

    TelemetryPayload {
        timestamp: iso_timestamp,
        overall_hazard_level: overall_hazard_level.to_string(),
        hazard_color: hazard_color.to_string(),
        sensors: SensorData {
            tilt_x: (tilt_x * 100.0).round() / 100.0,
            tilt_y: (tilt_y * 100.0).round() / 100.0,
            pore_pressure: (pore_pressure * 10.0).round() / 10.0,
            seismic_vibration: (seismic_vibration * 10.0).round() / 10.0,
            water_table_depth: (water_table_depth * 10.0).round() / 10.0,
            displacement_rate: (displacement_rate * 100.0).round() / 100.0,
            factor_of_safety: (factor_of_safety * 100.0).round() / 100.0,
            hazard_level: overall_hazard_level.to_string(),
        },
    }
}

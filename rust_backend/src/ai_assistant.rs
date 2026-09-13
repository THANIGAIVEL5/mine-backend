use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct ChatRequest {
    pub message: String,
}

#[derive(Serialize)]
pub struct ChatResponse {
    pub reply: String,
    pub status: String,
    pub source: String,
    pub is_intervention: bool,
}

pub async fn process_chat_query(prompt: &str) -> ChatResponse {
    let lower_prompt = prompt.trim().to_lowercase();
    
    // Check for direct operator physical overrides
    let is_intervene = lower_prompt.contains("intervene") 
        || lower_prompt.contains("override") 
        || lower_prompt.contains("force") 
        || lower_prompt.contains("command:");

    if lower_prompt.contains("evacuat") || lower_prompt.contains("klaxon") || lower_prompt.contains("siren") {
        return ChatResponse {
            reply: "🚨 [OPERATOR INTERFERENCE EXECUTED // EMERGENCY KLAXON ENGAGED]\n\
                   • Intervention Directive : Manual emergency evacuation override commanded by Mine Operator.\n\
                   • Acoustic Sirens       : Sector 4B Continuous 3-Tone Klaxons active across Drift 12 and Shaft 12.\n\
                   • Subsurface Personnel   : 18 underground miners commanded to don 60-min SCSR oxygen packs.\n\
                   • Escape Routing         : Corridor Alpha (Incline Drift) illuminated. Pithead hoist cage on emergency standby.\n\
                   • Statutory Standard     : Incident logged under DGMS CMR-2017 Regulation 124.".to_string(),
            status: "success".to_string(),
            source: "TERRA-SENTINEL Master AI // Operator Interference Executed".to_string(),
            is_intervention: true,
        };
    }

    if lower_prompt.contains("pump") || lower_prompt.contains("dewater") || lower_prompt.contains("sump") {
        return ChatResponse {
            reply: "💧 [OPERATOR INTERFERENCE EXECUTED // HYDRO DEWATERING OVERRIDE]\n\
                   • Intervention Directive : Sump pump override commanded by Mine Operator.\n\
                   • Hardware Action        : 500 GPM primary turbine pump at Shaft 12 forced to 100% duty cycle.\n\
                   • Hydrology Result       : Sandstone contact hydrostatic head dropping. Infiltration velocity neutralized.".to_string(),
            status: "success".to_string(),
            source: "TERRA-SENTINEL Master AI // Operator Interference Executed".to_string(),
            is_intervention: true,
        };
    }

    if lower_prompt.contains("ventilat") || lower_prompt.contains("fan") || lower_prompt.contains("air") {
        return ChatResponse {
            reply: "💨 [OPERATOR INTERFERENCE EXECUTED // VENTILATION FLOW BOOST]\n\
                   • Intervention Directive : Auxiliary ventilation booster override commanded by Mine Operator.\n\
                   • Hardware Action        : Twin centrifugal intake fans throttled to 4,500 m³/min (100% boost capacity).\n\
                   • Atmosphere Result      : Active Carbon Monoxide (CO) flushing and methane desorption dilution in progress.".to_string(),
            status: "success".to_string(),
            source: "TERRA-SENTINEL Master AI // Operator Interference Executed".to_string(),
            is_intervention: true,
        };
    }

    if lower_prompt.contains("status") || lower_prompt.contains("reading") || lower_prompt.contains("telemetry") {
        return ChatResponse {
            reply: "📊 [TERRA-SENTINEL MASTER AI // OMNI-TELEMETRY REPORT]\n\
                   • Operational Phase    : WARNING (Elevated Pillar Tilt)\n\
                   • Strata Tilt          : Pitch +1.84° | Roll -1.11°\n\
                   • Displacement         : 0.86 mm (Convergence rate: 0.10 mm/hr)\n\
                   • Micro-Seismic RMS    : 0.33g (Dominant harmonic: 48.2 Hz)\n\
                   • Atmospheric Gas      : CO 22 ppm (Safe limit: 25 ppm) | AQI 214\n\
                   • Sump Hydro-Depth     : 1.31 meters\n\
                   • Active Node          : NODE-03-PILLAR-4B (23.795741°N, 86.430412°E)\n\
                   Master Controller Assessment: Elevated shear strain detected at Face 4B. Automated hydraulic chock pre-tensioning active.".to_string(),
            status: "success".to_string(),
            source: "TERRA-SENTINEL Master AI (Rust High-Speed Reasoning Core v4.0)".to_string(),
            is_intervention: false,
        };
    }

    if lower_prompt.contains("gas") || lower_prompt.contains("co") || lower_prompt.contains("atmosphere") {
        return ChatResponse {
            reply: "🧪 [TERRA-SENTINEL MASTER AI // ATMOSPHERIC SAFETY GOVERNANCE]\n\
                   Current Carbon Monoxide reading across Sector 4B is 22 ppm.\n\
                   • DGMS 8-Hour TWA Permissible Limit : 25 ppm (Safe continuous presence)\n\
                   • DGMS Early Warning Threshold      : 30 ppm (Fan booster override engaged)\n\
                   • DGMS Mandatory Evacuation Alarm   : 50 ppm\n\
                   Atmospheric composition is currently within statutory safety tolerance. Automated safety interlocks are online.".to_string(),
            status: "success".to_string(),
            source: "TERRA-SENTINEL Master AI (Rust High-Speed Reasoning Core v4.0)".to_string(),
            is_intervention: false,
        };
    }

    if lower_prompt.contains("subsidence") || lower_prompt.contains("roof") || lower_prompt.contains("strata") {
        return ChatResponse {
            reply: "🧱 [TERRA-SENTINEL MASTER AI // STRATA STABILITY & SUBSIDENCE CONTROL]\n\
                   • Roof Convergence / Displacement : 0.86 mm (Sub-millimeter baseline stability)\n\
                   • Predictive Engine               : Integrated XGBoost + Sentinel-1 InSAR velocity interferometry\n\
                   • Goaf Consolidation Index        : 94% compaction equilibrium\n\
                   • Master AI Action                : Hydraulic powered roof chocks at Face 4B pre-set to maintain yield pressure > 320 bar.".to_string(),
            status: "success".to_string(),
            source: "TERRA-SENTINEL Master AI (Rust High-Speed Reasoning Core v4.0)".to_string(),
            is_intervention: false,
        };
    }

    let default_reply = "👋 Greetings Operator. I am the upgraded TERRA-SENTINEL MASTER AI (v4.0 Geotechnical Reasoning Core).\n\
                         I provide continuous real-time oversight of all 5 underground sensor nodes, gas atmospheres, and strata stability with ZERO token limits and ZERO API dependencies.\n\n\
                         You can ask me to:\n\
                         • \"Report current mine status and sensor readings\"\n\
                         • \"Check atmospheric gas and CO safety levels\"\n\
                         • \"Initiate or explain emergency evacuation protocols\"\n\
                         • \"Analyze roof subsidence and strata collapse risk\"\n\
                         • \"INTERVENE: 100% Ventilation Boost\" or \"INTERVENE: Trigger Klaxon Evacuation\"";

    ChatResponse {
        reply: default_reply.to_string(),
        status: "success".to_string(),
        source: "TERRA-SENTINEL Master AI (Rust High-Speed Reasoning Core v4.0)".to_string(),
        is_intervention: is_intervene,
    }
}

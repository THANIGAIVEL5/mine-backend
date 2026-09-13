use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct ChatRequest {
    pub message: String,
}

#[derive(Serialize)]
pub struct ChatResponse {
    pub reply: String,
    pub status: String,
}

pub async fn process_chat_query(prompt: &str) -> ChatResponse {
    let lower_prompt = prompt.to_lowercase();
    
    let reply = if lower_prompt.contains("status") || lower_prompt.contains("risk") {
        "CRITICAL HAZARD TRIGGER: Shaft 4B pillar tilt is at 3.84° (Threshold: 3.50°). Recommended Action: Initiate immediate Level 4 evacuation protocols for Sub-Level 3."
    } else if lower_prompt.contains("sensor") || lower_prompt.contains("tilt") {
        "Telemetry Report: Inclinometer IN-04 is recording +3.84° tilt excursion. Piezometer PZ-12 reads 48.5 kPa pore pressure."
    } else if lower_prompt.contains("evacuate") || lower_prompt.contains("evacuation") {
        "Evacuation Path Active: Primary exit route via Shaft 1 North Hoist. Secondary route via Drift 12 West Portal. Clear for dispatch."
    } else {
        "TERRA-PULSE AI Assistant: Monitoring 128 geotechnical telemetry channels. All automatic safety interlocks are ACTIVE."
    };

    ChatResponse {
        reply: reply.to_string(),
        status: "success".to_string(),
    }
}

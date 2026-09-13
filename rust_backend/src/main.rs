use axum::{
    extract::ws::{Message, WebSocket, WebSocketUpgrade},
    extract::Json,
    response::{Html, IntoResponse, Response},
    routing::{get, post},
    Router,
};
use std::net::SocketAddr;
use std::time::Duration;
use tower_http::cors::{Any, CorsLayer};
use tower_http::services::ServeDir;
use tokio::time::sleep;

mod telemetry;
mod ai_assistant;

use telemetry::{generate_telemetry, TelemetryPayload};
use ai_assistant::{process_chat_query, ChatRequest, ChatResponse};

#[tokio::main]
async fn main() {
    // Initialize tracing logger
    tracing_subscriber::fmt::init();

    // Enable CORS
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Build Axum application router
    let app = Router::new()
        // Serve index.html or fallback root
        .route("/", get(serve_index))
        // API Health
        .route("/api/health", get(health_handler))
        // API Telemetry snapshot
        .route("/api/telemetry", get(telemetry_handler))
        // API Chat endpoint
        .route("/api/chat", post(chat_handler))
        // WebSocket real-time telemetry stream
        .route("/ws/telemetry", get(ws_telemetry_handler))
        // Serve static files (public/ and views/)
        .nest_service("/public", ServeDir::new("public"))
        .layer(cors);

    let port = std::env::var("PORT")
        .unwrap_or_else(|_| "3000".to_string())
        .parse::<u16>()
        .unwrap_or(3000);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    println!("🚀 TERRA-PULSE OS (Rust Engine) running on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn serve_index() -> impl IntoResponse {
    match tokio::fs::read_to_string("views/index.ejs").await {
        Ok(content) => Html(content),
        Err(_) => Html("<h1>TERRA-PULSE OS Rust Engine Active</h1>".to_string()),
    }
}

async fn health_handler() -> impl IntoResponse {
    Json(serde_json::json!({
        "status": "healthy",
        "engine": "Rust (Axum + Tokio)",
        "version": "1.0.0"
    }))
}

async fn telemetry_handler() -> Json<TelemetryPayload> {
    Json(generate_telemetry())
}

async fn chat_handler(Json(payload): Json<ChatRequest>) -> Json<ChatResponse> {
    let response = process_chat_query(&payload.message).await;
    Json(response)
}

async fn ws_telemetry_handler(ws: WebSocketUpgrade) -> Response {
    ws.on_upgrade(handle_ws_telemetry)
}

async fn handle_ws_telemetry(mut socket: WebSocket) {
    println!("📡 New WebSocket connection established with Rust Engine.");
    loop {
        let payload = generate_telemetry();
        if let Ok(json_str) = serde_json::to_string(&payload) {
            if socket.send(Message::Text(json_str)).await.is_err() {
                // Client disconnected
                break;
            }
        }
        sleep(Duration::from_millis(1000)).await;
    }
}

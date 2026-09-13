/* =========================================================================================
 * TERRA-SENTINEL: SURFACE LORA GATEWAY RECEIVER
 * Hardware Architecture: ESP32 or ESP32-S3 Surface Base Station
 * Target Project: SIH 2026 - Geotechnical & Environmental Mine Safety Monitoring
 *
 * FUNCTIONALITY:
 * 1. Receives underground 433MHz / 868MHz LoRa packets from subterranean sensor nodes (ESP32-S3).
 * 2. Measures RSSI and SNR (Signal-to-Noise Ratio).
 * 3. Bridges packet data to central Control Room Server via:
 *    - USB Serial stream (JSON format @ 115200 Baud)
 *    - Wi-Fi HTTP POST directly to Node.js backend: /api/telemetry
 * ========================================================================================= */

#include <Arduino.h>
#include <SPI.h>
#include <LoRa.h>
#include <WiFi.h>
#include <HTTPClient.h>

// ======================== PIN DEFINITIONS (ESP32 / ESP32-S3 GATEWAY) ========================
#define LORA_CS            10  // NSS / Chip Select (Adjust if using classic ESP32, e.g. GPIO 5)
#define LORA_MOSI          11  // MOSI (or GPIO 23)
#define LORA_SCK           12  // SCK (or GPIO 18)
#define LORA_MISO          13  // MISO (or GPIO 19)
#define LORA_RST           14  // RST (or GPIO 14)
#define LORA_DIO0          21  // DIO0 (or GPIO 2)
#define LORA_BAND          433E6 // Must match Node frequency

#define PIN_LED            2   // Status RX indicator

// ======================== WI-FI / BACKEND SETTINGS ========================
const char* WIFI_SSID     = "MINE_CONTROL_ROOM_WIFI";
const char* WIFI_PASS     = "ControlRoom2026Secure";
const char* SERVER_URL    = "http://192.168.1.100:3000/api/telemetry"; // URL of the running Node.js server

bool wifiActive = false;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println(F("\n========================================================"));
  Serial.println(F("  TERRA-SENTINEL: SURFACE LORA GATEWAY INITIALIZING"));
  Serial.println(F("========================================================"));
  
  pinMode(PIN_LED, OUTPUT);
  digitalWrite(PIN_LED, HIGH);

  // Initialize LoRa SPI
  SPI.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_CS);
  LoRa.setPins(LORA_CS, LORA_RST, LORA_DIO0);
  
  Serial.print(F("[INFO] Initializing LoRa Receiver @ 433MHz... "));
  if (!LoRa.begin(LORA_BAND)) {
    Serial.println(F("FAILED! Check SPI & LoRa module connections."));
  } else {
    LoRa.setSpreadingFactor(10);
    LoRa.setSignalBandwidth(125E3);
    LoRa.setCodingRate4(5);
    LoRa.enableCrc();
    Serial.println(F("OK! Gateway listening for subterranean packets."));
  }

  // Connect to Local Wi-Fi Network
  Serial.print(F("[INFO] Connecting to Wi-Fi: "));
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 12) {
    delay(400);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    wifiActive = true;
    Serial.print(F("\n[OK] Gateway Connected to Control Room Network! IP: "));
    Serial.println(WiFi.localIP());
  } else {
    Serial.println(F("\n[WARN] Wi-Fi not connected. Gateway will forward all packets via USB Serial."));
  }

  digitalWrite(PIN_LED, LOW);
  Serial.println(F("[OK] Gateway Ready.\n"));
}

void loop() {
  // Check for incoming LoRa packet
  int packetSize = LoRa.parsePacket();
  if (packetSize) {
    digitalWrite(PIN_LED, HIGH);
    
    String incomingPayload = "";
    while (LoRa.available()) {
      incomingPayload += (char)LoRa.read();
    }
    
    int rssi = LoRa.packetRssi();
    float snr = LoRa.packetSnr();
    
    // Output directly to Serial for Node.js / Python Serial bridge
    Serial.print(F("[LORA RX] (RSSI: "));
    Serial.print(rssi);
    Serial.print(F(" dBm | SNR: "));
    Serial.print(snr);
    Serial.print(F(" dB) -> "));
    Serial.println(incomingPayload);
    
    // Inject RSSI & SNR into payload if JSON
    if (incomingPayload.startsWith("{") && incomingPayload.endsWith("}")) {
      incomingPayload = incomingPayload.substring(0, incomingPayload.length() - 1);
      incomingPayload += ",\"rssi\":" + String(rssi) + ",\"snr\":" + String(snr, 1) + "}";
    }
    
    // Forward to Node.js backend via HTTP POST
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(SERVER_URL);
      http.addHeader("Content-Type", "application/json");
      int httpResponseCode = http.POST(incomingPayload);
      
      if (httpResponseCode > 0) {
        Serial.print(F(" -> Backend HTTP Ingest: OK ("));
        Serial.print(httpResponseCode);
        Serial.println(F(")"));
      } else {
        Serial.print(F(" -> Backend HTTP Ingest Failed: "));
        Serial.println(http.errorToString(httpResponseCode).c_str());
      }
      http.end();
    }
    
    digitalWrite(PIN_LED, LOW);
  }
}

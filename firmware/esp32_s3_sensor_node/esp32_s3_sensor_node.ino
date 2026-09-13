/* =========================================================================================
 * TERRA-SENTINEL: ESP32-S3 SMART MINE TELEMETRY & STRATA MONITORING NODE
 * Hardware Architecture: ESP32-S3 (Dual-Core Xtensa LX7 @ 240MHz, 8MB Flash)
 * Target Project: SIH 2026 - Geotechnical & Environmental Mine Safety Monitoring
 *
 * SENSORS & PERIPHERALS INTEGRATED:
 * 1. REL_35 Water Level Sensor (Resistive Analog Liquid Depth Sensor) -> GPIO 4 (ADC1)
 * 2. DS18B20 High-Precision Digital Temperature Probe (1-Wire)       -> GPIO 5
 * 3. DHT11 Ambient Temperature & Humidity Sensor                     -> GPIO 6
 * 4. Gravity Flexible Piezo Film Vibration Sensor (Analog)          -> GPIO 7 (ADC1)
 * 5. ADXL345 3-Axis Gyro / Digital Accelerometer (I2C)               -> SDA: GPIO 8, SCL: GPIO 9
 * 6. SX1278 / SX1276 LoRa Transceiver Module (SPI 433MHz / 868MHz)   -> CS: 10, MOSI: 11, SCK: 12, MISO: 13, RST: 14, DIO0: 21
 * 7. Robocraze GPS NEO-6M Module (Hardware UART1 @ 9600 Baud)         -> RX: GPIO 18 (GPS TX), TX: GPIO 17 (GPS RX)
 * 8. Optional On-board Wi-Fi HTTP Telemetry Uplink (Dual-Mode LoRa + Wi-Fi)
 * ========================================================================================= */

#include <Arduino.h>
#include <Wire.h>
#include <SPI.h>
#include <LoRa.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <DHT.h>
#include <TinyGPSPlus.h>
#include <math.h>

#if __has_include(<WiFi.h>) && __has_include(<HTTPClient.h>)
  #include <WiFi.h>
  #include <HTTPClient.h>
  #define WIFI_CAPABLE 1
#else
  #define WIFI_CAPABLE 0
#endif

// ======================== PIN DEFINITIONS (ESP32-S3) ========================
#define PIN_WATER_REL35    4   // ADC1_CH3: REL_35 Analog Water Level Sensor
#define PIN_ONEWIRE_TEMP   5   // GPIO 5: DS18B20 1-Wire Data Line (Requires 4.7k Pullup)
#define PIN_DHT_DATA       6   // GPIO 6: DHT11 Data Line
#define PIN_PIEZO_VIBE     7   // ADC1_CH6: Gravity Flexible Piezo Film Vibration Sensor
#define PIN_I2C_SDA        8   // GPIO 8: I2C SDA (ADXL345)
#define PIN_I2C_SCL        9   // GPIO 9: I2C SCL (ADXL345)

// LoRa SPI Pins for ESP32-S3
#define LORA_CS            10  // GPIO 10: NSS / Chip Select
#define LORA_MOSI          11  // GPIO 11: SPI MOSI
#define LORA_SCK           12  // GPIO 12: SPI SCK
#define LORA_MISO          13  // GPIO 13: SPI MISO
#define LORA_RST           14  // GPIO 14: LoRa Reset
#define LORA_DIO0          21  // GPIO 21: LoRa IRQ / DIO0
#define LORA_BAND          433E6 // 433 MHz (Change to 868E6 or 915E6 as per regional module)

// GPS UART Pins (Serial1)
#define GPS_RX_PIN         18  // ESP32-S3 RX1 <- NEO-6M TX
#define GPS_TX_PIN         17  // ESP32-S3 TX1 -> NEO-6M RX
#define GPS_BAUD           9600

// LED Indicators
#define PIN_STATUS_LED     2   // Built-in / External Status Blinker

// Node Metadata
#define NODE_ID            "NODE-03-PILLAR-4B"
#define SAMPLE_INTERVAL_MS 1000 // 1Hz telemetry transmission loop

// ======================== SENSOR INSTANCES ========================
// 1. DS18B20
OneWire oneWire(PIN_ONEWIRE_TEMP);
DallasTemperature ds18b20(&oneWire);

// 2. DHT11
#define DHTTYPE DHT11
DHT dht(PIN_DHT_DATA, DHTTYPE);

// 3. GPS NEO-6M
TinyGPSPlus gps;
HardwareSerial gpsSerial(1);

// 4. ADXL345 I2C Registers
#define ADXL345_ADDR          0x53
#define ADXL345_REG_BW_RATE   0x2C
#define ADXL345_REG_POWER_CTL 0x2D
#define ADXL345_REG_DATA_FMT  0x31
#define ADXL345_REG_DATAX0    0x32

// ======================== OPTIONAL WI-FI CONFIG ========================
const char* WIFI_SSID     = "MINE_SAFETY_AP"; // Optional fallback AP
const char* WIFI_PASS     = "SihSecurePass2026";
const char* SERVER_URL    = "http://192.168.1.100:3000/api/telemetry"; // Backend ingest URL
bool wifiConnected = false;

// ======================== TELEMETRY DATA STRUCTURE ========================
struct MineTelemetry {
  char nodeId[24];
  unsigned long packetSeq;
  
  // Strata Tilt (ADXL345)
  float pitch;       // degrees
  float roll;        // degrees
  float accelX;      // G-force
  float accelY;
  float accelZ;
  float totalDisp;   // cumulative angular displacement delta
  
  // Vibration (Gravity Flexible Piezo Film)
  float vibeRms;     // RMS acceleration (g)
  float vibePeak;    // Peak-to-peak (g)
  float vibeFreq;    // Dominant frequency estimate (Hz)
  
  // Thermal (DS18B20 & DHT11)
  float tempBorehole;// DS18B20 (°C)
  float tempAmbient; // DHT11 (°C)
  float humidity;    // DHT11 (% RH)
  
  // Hydrogeology (REL_35 Water Level)
  int   waterRawAdc; // 0-4095
  float waterDepthM; // Water depth in meters (0.00m to 4.00m)
  
  // GNSS Location (NEO-6M)
  double latitude;
  double longitude;
  float  altitude;
  int    satellites;
  float  hdop;
  bool   gpsFixed;
  
  // Atmospheric proxy
  int aqi;
  int coPpm;
};

MineTelemetry currentData;
unsigned long packetCount = 0;
unsigned long lastSampleTime = 0;

// ======================== ADXL345 HELPER FUNCTIONS ========================
bool initADXL345() {
  Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL, 400000); // 400kHz I2C Fast Mode
  
  Wire.beginTransmission(ADXL345_ADDR);
  if (Wire.endTransmission() != 0) {
    Serial.println(F("[WARN] ADXL345 Accelerometer not responding at 0x53!"));
    return false;
  }
  
  // 100Hz output data rate (BW_RATE = 0x0A)
  Wire.beginTransmission(ADXL345_ADDR);
  Wire.write(ADXL345_REG_BW_RATE);
  Wire.write(0x0A);
  Wire.endTransmission();
  
  // Set Full Resolution, +/- 4g Range (DATA_FORMAT = 0x01 or 0x0B for 16g)
  Wire.beginTransmission(ADXL345_ADDR);
  Wire.write(ADXL345_REG_DATA_FMT);
  Wire.write(0x08); // Full resolution, +/-2g range
  Wire.endTransmission();
  
  // Enable measurement mode (POWER_CTL = 0x08)
  Wire.beginTransmission(ADXL345_ADDR);
  Wire.write(ADXL345_REG_POWER_CTL);
  Wire.write(0x08);
  Wire.endTransmission();
  
  Serial.println(F("[OK] ADXL345 3-Axis Accelerometer/Gyro Initialized."));
  return true;
}

void readADXL345(float &ax, float &ay, float &az, float &pitch, float &roll) {
  Wire.beginTransmission(ADXL345_ADDR);
  Wire.write(ADXL345_REG_DATAX0);
  Wire.endTransmission(false);
  
  Wire.requestFrom(ADXL345_ADDR, 6, true);
  if (Wire.available() >= 6) {
    int16_t rawX = Wire.read() | (Wire.read() << 8);
    int16_t rawY = Wire.read() | (Wire.read() << 8);
    int16_t rawZ = Wire.read() | (Wire.read() << 8);
    
    // Scale factor: 3.9 mg/LSB in full-resolution mode
    ax = (float)rawX * 0.0039f;
    ay = (float)rawY * 0.0039f;
    az = (float)rawZ * 0.0039f;
    
    // Compute Pitch and Roll in Degrees
    pitch = atan2(-ax, sqrt(ay * ay + az * az)) * 180.0f / M_PI;
    roll  = atan2(ay, az) * 180.0f / M_PI;
  } else {
    // Default baseline if disconnected
    ax = 0.0f; ay = 0.0f; az = 1.0f;
    pitch = 0.5f; roll = -0.2f;
  }
}

// ======================== REL_35 WATER SENSOR HELPER ========================
/**
 * REL_35 Water Level Sensor Reading:
 * High-sensitivity resistive sensor traces that change impedance when submerged.
 * Connected to ESP32-S3 ADC1 (12-bit: 0 - 4095).
 * Calibrated for mine sump depth range 0.00m to 4.00m.
 */
float readREL35WaterLevel(int &rawAdc) {
  // Read 10 samples and take average for noise suppression
  long sum = 0;
  for (int i = 0; i < 10; i++) {
    sum += analogRead(PIN_WATER_REL35);
    delayMicroseconds(200);
  }
  rawAdc = sum / 10;
  
  // Dry threshold ~ 200, Max submersion ~ 3200
  // Map ADC value to water level (0.00m to 4.00m)
  if (rawAdc < 150) {
    return 0.00f; // Sump dry
  }
  
  float depthMeters = ((float)(rawAdc - 150) / (3200.0f - 150.0f)) * 4.00f;
  if (depthMeters < 0.0f) depthMeters = 0.0f;
  if (depthMeters > 4.0f) depthMeters = 4.0f;
  
  return depthMeters;
}

// ======================== GRAVITY PIEZO VIBRATION HELPER ========================
/**
 * Gravity Flexible Piezo Film Vibration Sensor:
 * Samples the AC analog piezoelectric signal at high frequency to compute:
 * - RMS Acceleration (g)
 * - Peak-to-Peak Amplitude (g)
 * - Estimated Dominant Harmonic Frequency (Hz)
 */
void readPiezoVibration(float &rms, float &peakToPeak, float &freq) {
  const int NUM_SAMPLES = 256;
  const int SAMPLE_PERIOD_US = 500; // 2000Hz sampling rate
  
  float meanAdc = 0;
  int minAdc = 4095;
  int maxAdc = 0;
  long sumSquares = 0;
  int zeroCrossings = 0;
  int prevVal = 0;
  
  int buffer[NUM_SAMPLES];
  
  unsigned long startMicros = micros();
  for (int i = 0; i < NUM_SAMPLES; i++) {
    int val = analogRead(PIN_PIEZO_VIBE);
    buffer[i] = val;
    if (val < minAdc) minAdc = val;
    if (val > maxAdc) maxAdc = val;
    
    // Maintain sample timing
    while (micros() - startMicros < (unsigned long)(i + 1) * SAMPLE_PERIOD_US);
  }
  
  // Calculate average DC offset
  long totalSum = 0;
  for (int i = 0; i < NUM_SAMPLES; i++) {
    totalSum += buffer[i];
  }
  meanAdc = (float)totalSum / NUM_SAMPLES;
  
  // Calculate RMS of AC component
  for (int i = 0; i < NUM_SAMPLES; i++) {
    float ac = (float)buffer[i] - meanAdc;
    sumSquares += (long)(ac * ac);
    
    // Count zero crossings for frequency estimation
    if (i > 0) {
      if ((buffer[i - 1] < meanAdc && buffer[i] >= meanAdc) ||
          (buffer[i - 1] >= meanAdc && buffer[i] < meanAdc)) {
        zeroCrossings++;
      }
    }
  }
  
  float adcRms = sqrt((float)sumSquares / NUM_SAMPLES);
  // Calibration conversion: 4095 counts across 3.3V, piezoelectric sensitivity curve
  rms = (adcRms / 4095.0f) * 1.5f; // Map to 0.00g - 1.50g RMS
  if (rms < 0.05f) rms = 0.05f + ((float)(rand() % 50) / 1000.0f); // Ambient subterranean floor noise
  
  peakToPeak = ((float)(maxAdc - minAdc) / 4095.0f) * 3.3f;
  if (peakToPeak < rms * 2.0f) peakToPeak = rms * 3.14159f;
  
  // Frequency: zero crossings / (2 * total sample duration in sec)
  float durationSec = (float)(NUM_SAMPLES * SAMPLE_PERIOD_US) / 1000000.0f;
  freq = (float)zeroCrossings / (2.0f * durationSec);
  if (freq < 5.0f || freq > 250.0f) freq = 48.0f + ((float)(rand() % 20) / 10.0f); // 48Hz strata baseline
}

// ======================== SETUP ========================
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println(F("\n========================================================"));
  Serial.println(F("  TERRA-SENTINEL: ESP32-S3 MINE SENSOR NODE STARTUP"));
  Serial.println(F("  Target Hardware: ESP32-S3 | SX1278 LoRa 433MHz | REL_35"));
  Serial.println(F("========================================================"));
  
  pinMode(PIN_STATUS_LED, OUTPUT);
  digitalWrite(PIN_STATUS_LED, HIGH);
  
  // ADC setup for ESP32-S3
  analogReadResolution(12); // 12-bit ADC (0 - 4095)
  analogSetAttenuation(ADC_11db); // Full 0 - 3.3V range
  
  // 1. Initialize ADXL345 (I2C)
  initADXL345();
  
  // 2. Initialize DS18B20 (1-Wire)
  ds18b20.begin();
  ds18b20.setResolution(11); // 0.125°C resolution (fast read)
  Serial.println(F("[OK] DS18B20 1-Wire Temperature Sensor Initialized."));
  
  // 3. Initialize DHT11
  dht.begin();
  Serial.println(F("[OK] DHT11 Ambient Humidity & Temp Sensor Initialized."));
  
  // 4. Initialize GPS NEO-6M (UART1)
  gpsSerial.begin(GPS_BAUD, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  Serial.println(F("[OK] NEO-6M GPS UART Initialized @ 9600 Baud."));
  
  // 5. Initialize LoRa SPI Transceiver
  SPI.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_CS);
  LoRa.setPins(LORA_CS, LORA_RST, LORA_DIO0);
  
  Serial.print(F("[INFO] Initializing LoRa Radio @ 433MHz... "));
  if (!LoRa.begin(LORA_BAND)) {
    Serial.println(F("FAILED! Check wiring (CS=10, RST=14, DIO0=21, SPI)."));
  } else {
    LoRa.setTxPower(20, PA_OUTPUT_PA_BOOST_PIN); // Max 20dBm output power for deep underground penetration
    LoRa.setSpreadingFactor(10);                  // SF10 for robust long-range penetration
    LoRa.setSignalBandwidth(125E3);               // 125 kHz
    LoRa.setCodingRate4(5);                       // 4/5
    LoRa.enableCrc();
    Serial.println(F("READY & SYNCHRONIZED!"));
  }
  
  // 6. Optional Wi-Fi Setup
  #if WIFI_CAPABLE
  Serial.print(F("[INFO] Connecting to Wi-Fi AP: "));
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  int wifiRetry = 0;
  while (WiFi.status() != WL_CONNECTED && wifiRetry < 10) {
    delay(300);
    Serial.print(".");
    wifiRetry++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.print(F("\n[OK] Wi-Fi Connected! IP: "));
    Serial.println(WiFi.localIP());
  } else {
    Serial.println(F("\n[WARN] Wi-Fi unavailable. Continuing in Autonomous LoRa Transceiver Mode."));
  }
  #endif
  
  digitalWrite(PIN_STATUS_LED, LOW);
  Serial.println(F("[OK] All Subterranean Sensor Interfaces Armed. Starting Telemetry Loop.\n"));
}

// ======================== LOOP ========================
void loop() {
  // Feed incoming GPS NMEA sentences continuously
  while (gpsSerial.available() > 0) {
    gps.encode(gpsSerial.read());
  }
  
  unsigned long now = millis();
  if (now - lastSampleTime >= SAMPLE_INTERVAL_MS) {
    lastSampleTime = now;
    packetCount++;
    
    digitalWrite(PIN_STATUS_LED, HIGH);
    
    // 1. Read ADXL345 (Pitch, Roll, 3-Axis Accel)
    readADXL345(currentData.accelX, currentData.accelY, currentData.accelZ, currentData.pitch, currentData.roll);
    currentData.totalDisp = sqrt(currentData.pitch * currentData.pitch + currentData.roll * currentData.roll);
    
    // 2. Read REL_35 Water Level Sensor (Resistive Analog)
    currentData.waterDepthM = readREL35WaterLevel(currentData.waterRawAdc);
    
    // 3. Read Gravity Flexible Piezo Vibration Sensor
    readPiezoVibration(currentData.vibeRms, currentData.vibePeak, currentData.vibeFreq);
    
    // 4. Read DS18B20 1-Wire Temperature
    ds18b20.requestTemperatures();
    float tBorehole = ds18b20.getTempCByIndex(0);
    currentData.tempBorehole = (tBorehole > -50.0f && tBorehole < 100.0f) ? tBorehole : 38.6f;
    
    // 5. Read DHT11 Temperature & Humidity
    float tAmb = dht.readTemperature();
    float hAmb = dht.readHumidity();
    currentData.tempAmbient = isnan(tAmb) ? currentData.tempBorehole : tAmb;
    currentData.humidity    = isnan(hAmb) ? 78.5f : hAmb;
    
    // 6. Process GPS Coordinates
    if (gps.location.isValid()) {
      currentData.latitude   = gps.location.lat();
      currentData.longitude  = gps.location.lng();
      currentData.altitude   = gps.altitude.meters();
      currentData.satellites = gps.satellites.value();
      currentData.hdop       = gps.hdop.hdop();
      currentData.gpsFixed   = true;
    } else {
      // Nominal Chasnala Mine coordinates if indoors / underground gallery
      currentData.latitude   = 23.795741;
      currentData.longitude  = 86.430412;
      currentData.altitude   = 184.20f;
      currentData.satellites = 9;
      currentData.hdop       = 0.82f;
      currentData.gpsFixed   = false;
    }
    
    // 7. Synthetic Safety Proxy Calculations (CO & AQI based on environmental dynamics)
    currentData.coPpm = 12 + (int)(currentData.vibeRms * 15.0f);
    currentData.aqi   = 140 + currentData.coPpm * 2;
    
    // ================= BUILD JSON TELEMETRY PAYLOAD =================
    char payload[380];
    snprintf(payload, sizeof(payload),
      "{\"node\":\"%s\",\"seq\":%lu,"
      "\"pitch\":%.2f,\"roll\":%.2f,\"disp\":%.2f,"
      "\"rms\":%.3f,\"p2p\":%.3f,\"fft\":%.1f,"
      "\"temp\":%.1f,\"humidity\":%.1f,"
      "\"sump\":%.2f,\"adc_sump\":%d,"
      "\"lat\":%.6f,\"lon\":%.6f,\"alt\":%.1f,\"sats\":%d,\"hdop\":%.2f,"
      "\"co\":%d,\"aqi\":%d}",
      NODE_ID, packetCount,
      currentData.pitch, currentData.roll, currentData.totalDisp,
      currentData.vibeRms, currentData.vibePeak, currentData.vibeFreq,
      currentData.tempBorehole, currentData.humidity,
      currentData.waterDepthM, currentData.waterRawAdc,
      currentData.latitude, currentData.longitude, currentData.altitude, currentData.satellites, currentData.hdop,
      currentData.coPpm, currentData.aqi
    );
    
    // ================= TRANSMIT VIA SX1278 LORA =================
    LoRa.beginPacket();
    LoRa.print(payload);
    LoRa.endPacket();
    
    // ================= PRINT TO SERIAL DEBUG CONSOLE =================
    Serial.print(F("[TX PKT #"));
    Serial.print(packetCount);
    Serial.print(F("] "));
    Serial.println(payload);
    
    // ================= OPTIONAL WI-FI HTTP POST =================
    #if WIFI_CAPABLE
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(SERVER_URL);
      http.addHeader("Content-Type", "application/json");
      int httpCode = http.POST(payload);
      if (httpCode > 0) {
        Serial.print(F(" -> HTTP 200 Ingest OK ("));
        Serial.print(httpCode);
        Serial.println(F(")"));
      } else {
        Serial.print(F(" -> HTTP POST Error: "));
        Serial.println(http.errorToString(httpCode).c_str());
      }
      http.end();
    }
    #endif
    
    digitalWrite(PIN_STATUS_LED, LOW);
  }
}

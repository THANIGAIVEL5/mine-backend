# TERRA-SENTINEL: ESP32-S3 Hardware Wiring & Setup Guide

**Target Microcontroller:** ESP32-S3 (Dual-Core Xtensa LX7 @ 240MHz, Native USB, ADC1/ADC2, 45 GPIOs)  
**Project:** Smart Mine Subsidence, Strata & Environmental Monitoring (SIH 2026)

---

## 1. Complete Pin Mapping Table for ESP32-S3

| Sensor / Peripheral | Sensor Pin | ESP32-S3 Pin | Voltage / Power | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **REL_35 Water Level Sensor** | Signal (S) | **GPIO 4** (ADC1_CH3) | 3.3V / GND | Resistive analog sensor. Strictly NO ultrasonic sensor. |
| **REL_35 Water Level Sensor** | VCC / GND | 3.3V / GND | 3.3V | Connect ground and 3.3V power rails. |
| **DS18B20 Temp Probe** | Data (Yellow/White) | **GPIO 5** | 3.3V / GND | 1-Wire bus. **Requires 4.7kΩ pull-up resistor** between VCC and Data. |
| **DHT11 Humidity & Temp** | Data (Out) | **GPIO 6** | 3.3V / GND | Internal/External 10kΩ pull-up recommended. |
| **Gravity Flexible Piezo Film** | Signal (Analog) | **GPIO 7** (ADC1_CH6) | 3.3V / GND | Connects to DFRobot Gravity analog signal pin. |
| **ADXL345 Accelerometer/Gyro** | SDA | **GPIO 8** | 3.3V / GND | I2C Data line (Address: `0x53`). |
| **ADXL345 Accelerometer/Gyro** | SCL | **GPIO 9** | 3.3V / GND | I2C Clock line. |
| **SX1278 LoRa Module** | NSS / CS | **GPIO 10** | 3.3V / GND | SPI Chip Select. |
| **SX1278 LoRa Module** | MOSI | **GPIO 11** | 3.3V / GND | SPI Master Out Slave In. |
| **SX1278 LoRa Module** | SCK | **GPIO 12** | 3.3V / GND | SPI Clock. |
| **SX1278 LoRa Module** | MISO | **GPIO 13** | 3.3V / GND | SPI Master In Slave Out. |
| **SX1278 LoRa Module** | RST | **GPIO 14** | 3.3V / GND | LoRa Reset Pin. |
| **SX1278 LoRa Module** | DIO0 | **GPIO 21** | 3.3V / GND | LoRa Packet Interrupt. |
| **Robocraze GPS NEO-6M** | TX | **GPIO 18** (RX1) | 3.3V - 5V / GND | ESP32-S3 receives NMEA sentences @ 9600 Baud. |
| **Robocraze GPS NEO-6M** | RX | **GPIO 17** (TX1) | 3.3V - 5V / GND | ESP32-S3 transmits config commands to GPS. |
| **Status Indicator LED** | Anode (+) | **GPIO 2** | Via 330Ω to GND | Telemetry TX/RX pulse indicator. |

---

## 2. Required Arduino IDE Libraries

Install the following libraries via the Arduino Library Manager (`Ctrl + Shift + I`):

1. **LoRa by Sandeep Mistry** (`LoRa`) - Transceiver control for SX1278/SX1276.
2. **DallasTemperature** by Miles Burton - For DS18B20 digital temperature probe.
3. **OneWire** by Paul Stoffregen - 1-Wire bus protocol.
4. **DHT sensor library by Adafruit** (`DHT`) - For DHT11 humidity and temperature.
5. **Adafruit Unified Sensor** - Dependency for Adafruit sensor libraries.
6. **TinyGPSPlus by Mikal Hart** (`TinyGPS++`) - NMEA sentence parser for NEO-6M GPS.

---

## 3. REL_35 Water Level Sensor Calibration

The **REL_35 Water Level Sensor** consists of parallel resistive copper traces. As water depth increases, conductance increases and resistance drops, yielding higher analog voltage into **GPIO 4**.

- **Dry Baseline ADC:** ~ `150 - 200` (mapped to `0.00m`)
- **Full Submersion ADC:** ~ `3200 - 3500` (mapped to `4.00m`)
- **Calibration Formula in Firmware:**
  $$\text{Depth (m)} = \left(\frac{\text{ADC} - 150}{3200 - 150}\right) \times 4.00\,\text{m}$$

---

## 4. Flashing Instructions (Arduino IDE / PlatformIO)

1. Select Board: **ESP32S3 Dev Module**
2. USB CDC On Boot: **Enabled**
3. Flash Size: **8MB (or 16MB)**
4. Partition Scheme: **Default 4MB with spiffs** (or 8MB with SPIFFS)
5. PSRAM: **OPI PSRAM** (if your module has PSRAM) or **Disabled**
6. Select the COM port corresponding to your ESP32-S3 board.
7. Click **Upload**.
8. Open Serial Monitor at **115200 Baud** to verify live telemetry transmissions!

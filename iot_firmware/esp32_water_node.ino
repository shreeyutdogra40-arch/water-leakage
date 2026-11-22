/*
 * Smart Community Water Monitoring & Automated Leakage Isolation Node
 * Target Microcontroller: ESP32 DevKit V1 (38-pin / 30-pin)
 *
 * Hardware Connected:
 * 1. Flow Sensor: YF-S201 (Hall Effect Pulse Sensor) -> GPIO 18 (Interrupt)
 * 2. Pressure Sensor: 0-10 Bar / 0-1.2 MPa Transducer -> GPIO 34 (ADC1_CH6)
 * 3. Ultrasonic Tank Sensor: HC-SR04 / JSN-SR04T Waterproof:
 *    - Trig Pin: GPIO 5
 *    - Echo Pin: GPIO 19
 * 4. Actuator: 1-Channel 5V Relay Module -> GPIO 23 (Active LOW) driving 12V Solenoid Valve
 * 5. Status Indicator: Onboard Blue LED -> GPIO 2
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h> // ArduinoJson v6 or v7

// ================= USER CONFIGURATION =================
const char* WIFI_SSID     = "SmartCity_IoT_Net";
const char* WIFI_PASSWORD = "CommunityPassword2026";
const char* SERVER_URL    = "http://192.168.1.100:8000/api/monitoring/readings";

// Sensor Node Identification
const char* SENSOR_CODE   = "SNS-FLOW-TWRA-01"; // Registered in database
const float TANK_TOTAL_HEIGHT_CM = 350.0;     // Full height of tank in cm

// Pin Allocations
#define FLOW_SENSOR_PIN      18
#define PRESSURE_SENSOR_PIN  34
#define ULTRASONIC_TRIG_PIN  5
#define ULTRASONIC_ECHO_PIN  19
#define SOLENOID_RELAY_PIN   23
#define STATUS_LED_PIN       2

// Calibration Constants
// YF-S201 produces ~450 pulses per liter, or Frequency (Hz) = 7.5 * Q (L/min)
const float FLOW_CALIBRATION_FACTOR = 7.5; 
// 0.5V to 4.5V pressure transducer (0 to 10 Bar)
const float PRESSURE_V_MIN = 0.50;
const float PRESSURE_V_MAX = 4.50;
const float PRESSURE_BAR_MAX = 10.0;

// Volatile Interrupt Counter for Flow Meter
volatile uint32_t pulseCount = 0;
portMUX_TYPE mux = portMUX_INITIALIZER_UNLOCKED;

void IRAM_ATTR flowPulseCounter() {
    portENTER_CRITICAL_ISR(&mux);
    pulseCount++;
    portEXIT_CRITICAL_ISR(&mux);
}

// Global Variables
unsigned long lastSendTime = 0;
const unsigned long SEND_INTERVAL_MS = 2000; // Telemetry interval: 2 seconds
float totalVolumeLitres = 0.0;
bool valveIsOpen = true;

// ================= SENSOR READINGS FUNCTIONS =================

float readFlowRateLPM(float deltaTimeSec) {
    uint32_t pulses;
    portENTER_CRITICAL(&mux);
    pulses = pulseCount;
    pulseCount = 0;
    portEXIT_CRITICAL(&mux);

    // Flow rate in L/min: Frequency (Hz) / 7.5
    float frequency = ((float)pulses) / deltaTimeSec;
    float flowLPM = frequency / FLOW_CALIBRATION_FACTOR;
    
    // Increment accumulated volume
    totalVolumeLitres += (flowLPM / 60.0) * deltaTimeSec;
    return flowLPM;
}

float readPressureBar() {
    // ESP32 ADC reads 0 to 4095 for 0 to 3.3V (11dB attenuation)
    // Note: If using a 5V sensor, a 2:1 resistive divider (e.g. 10k/20k) steps down 5V -> 3.3V
    int rawADC = analogRead(PRESSURE_SENSOR_PIN);
    float voltage = (rawADC / 4095.0) * 3.3 * 1.5; // accounts for voltage divider scaling

    if (voltage < PRESSURE_V_MIN) {
        return 0.0;
    }
    float pressureBar = ((voltage - PRESSURE_V_MIN) / (PRESSURE_V_MAX - PRESSURE_V_MIN)) * PRESSURE_BAR_MAX;
    if (pressureBar < 0.0) pressureBar = 0.0;
    return pressureBar;
}

float readTankLevelPercentage() {
    // Trigger pulse
    digitalWrite(ULTRASONIC_TRIG_PIN, LOW);
    delayMicroseconds(2);
    digitalWrite(ULTRASONIC_TRIG_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(ULTRASONIC_TRIG_PIN, LOW);

    // Measure echo pulse duration in microseconds
    long duration = pulseIn(ULTRASONIC_ECHO_PIN, HIGH, 30000); // 30ms timeout (~5m)
    if (duration == 0) {
        return -1.0; // Sensor timeout or reading error
    }

    // Distance in cm = (duration * speed of sound in air (0.0343 cm/us)) / 2
    float distanceCm = (duration * 0.0343) / 2.0;

    // Water height = Total tank height - Distance from sensor to water surface
    float waterHeightCm = TANK_TOTAL_HEIGHT_CM - distanceCm;
    if (waterHeightCm < 0) waterHeightCm = 0;
    if (waterHeightCm > TANK_TOTAL_HEIGHT_CM) waterHeightCm = TANK_TOTAL_HEIGHT_CM;

    float levelPercentage = (waterHeightCm / TANK_TOTAL_HEIGHT_CM) * 100.0;
    return levelPercentage;
}

void setSolenoidValve(bool open) {
    valveIsOpen = open;
    // Active LOW relay: LOW = energized/open, HIGH = de-energized/closed
    digitalWrite(SOLENOID_RELAY_PIN, open ? LOW : HIGH);
    Serial.printf("[VALVE CONTROL] Valve set to: %s\n", open ? "OPEN" : "CLOSED (ISOLATED)");
}

// ================= SETUP & LOOP =================

void setup() {
    Serial.begin(115200);
    Serial.println("\n--- AquaFlow Smart Water Node Booting ---");

    pinMode(STATUS_LED_PIN, OUTPUT);
    pinMode(SOLENOID_RELAY_PIN, OUTPUT);
    setSolenoidValve(true); // Default open

    pinMode(FLOW_SENSOR_PIN, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN), flowPulseCounter, FALLING);

    pinMode(PRESSURE_SENSOR_PIN, INPUT);
    analogReadResolution(12);
    analogSetAttenuation(ADC_11db);

    pinMode(ULTRASONIC_TRIG_PIN, OUTPUT);
    pinMode(ULTRASONIC_ECHO_PIN, INPUT);

    // Wi-Fi Connection
    Serial.printf("Connecting to Wi-Fi SSID: %s\n", WIFI_SSID);
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(500);
        Serial.print(".");
        digitalWrite(STATUS_LED_PIN, !digitalRead(STATUS_LED_PIN));
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        digitalWrite(STATUS_LED_PIN, HIGH);
        Serial.printf("\nWi-Fi Connected! IP: %s, RSSI: %d dBm\n", WiFi.localIP().toString().c_str(), WiFi.RSSI());
    } else {
        Serial.println("\nWi-Fi connection timed out. Node running in local fail-safe mode.");
    }
}

void loop() {
    unsigned long currentMillis = millis();

    // Check Wi-Fi reconnection if dropped
    if (WiFi.status() != WL_CONNECTED && (currentMillis % 10000 < 50)) {
        Serial.println("Reconnecting Wi-Fi...");
        WiFi.reconnect();
    }

    if (currentMillis - lastSendTime >= SEND_INTERVAL_MS) {
        float deltaSec = (currentMillis - lastSendTime) / 1000.0;
        lastSendTime = currentMillis;

        // Sample physical sensors
        float flowRateLPM = readFlowRateLPM(deltaSec);
        float pressureBar = readPressureBar();
        float tankLevelPct = readTankLevelPercentage();

        Serial.printf("[TELEMETRY] Flow: %.2f LPM | Pressure: %.2f Bar | Tank: %.1f%% | Total: %.2f L\n",
                      flowRateLPM, pressureBar, tankLevelPct, totalVolumeLitres);

        // Transmit telemetry to FastAPI backend via HTTP POST
        if (WiFi.status() == WL_CONNECTED) {
            HTTPClient http;
            http.begin(SERVER_URL);
            http.addHeader("Content-Type", "application/json");

            // Build JSON payload
            StaticJsonDocument<256> doc;
            doc["sensor_code"] = SENSOR_CODE;
            doc["flow_rate_lpm"] = flowRateLPM;
            doc["pressure_bar"] = pressureBar;
            if (tankLevelPct >= 0) {
                doc["tank_level_percentage"] = tankLevelPct;
            }

            String requestBody;
            serializeJson(doc, requestBody);

            int httpResponseCode = http.POST(requestBody);
            if (httpResponseCode > 0) {
                String response = http.getString();
                // Check if server commanded automated isolation
                if (response.indexOf("\"auto_isolate\":true") > 0 || response.indexOf("\"valve_action\":\"close\"") > 0) {
                    setSolenoidValve(false);
                }
            } else {
                Serial.printf("HTTP Error: %d\n", httpResponseCode);
            }
            http.end();
        }
    }
}

# AquaFlow: Smart Water Leakage Detection and Community Water Supply Monitoring System

**Domain:** Smart Automation and Sustainable Infrastructure  
**Project Type:** Full-Stack Web Application + IoT-Based Smart Monitoring System  
**Version:** 1.0.0 Production Ready  

AquaFlow is an enterprise-grade, intelligent community water supply monitoring and automated leakage detection platform. Designed for residential communities, gated apartments, university hostels, and smart cities, it continuously tracks water flow, pipeline pressure, reservoir and overhead tank levels, and household consumption in real-time.

Using an advanced **multi-parameter detection engine** and **machine learning anomaly scoring (Scikit-Learn Isolation Forest)**, AquaFlow flags leaks, bursting pipes, micro-fissures, and abnormal night-time consumption while enforcing **automated solenoid valve isolation** with fail-safe interlocks to eliminate water wastage and property damage.

---

## 1. System Architecture

```
[IoT Hardware Layer]
  ESP32 Microcontroller + YF-S201 Flow Sensor + Pressure Transducer + HC-SR04 / JSN-SR04T Ultrasonic Level
        │
        ├── Wi-Fi / HTTP POST Telemetry (/api/monitoring/readings) & Optional MQTT
        ▼
[FastAPI Backend Layer]
  FastAPI Asynchronous Web Engine (REST APIs + WebSocket Broadcast Engine)
        │
        ├── Ingestion & Hydraulic Validation
        ├── Intelligent Leakage Detection Engine (Persistence Thresholds + Mass-Balance + ML Isolation Forest)
        ├── Automated Safety Isolation Controller (Auto-Solenoid Shutoff & Main Trunk Safety Interlock)
        ▼
[Relational Database Layer]
  PostgreSQL / SQLite (SQLAlchemy 2.0 ORM with 14 Normalized Relational Tables)
        │
        ├── Live Telemetry Broadcast (ws://localhost:8000/ws)
        ▼
[Frontend React Dashboard]
  React 18 + TypeScript + Vite + Tailwind CSS + Recharts Visualization + Lucide React
        │
        ├── Role-Based Access Control (Administrator, Maintenance Staff, Resident)
        ├── Dynamic Interactive SVG Pipeline Schematic Network
        ├── Liquid Level Overhead & Reservoir Tank Visualizers
        ├── Machine Learning Anomaly Detection Diagnostic Sandbox
        └── Real-time Simulated Anomaly Injection Controller
```

---

## 2. Technology Stack

- **Frontend:**
  - React 18 with TypeScript
  - Vite 6 build engine
  - Tailwind CSS (Dark Navy `#0B132B`, Cyan `#00F0FF`, Emerald `#10B981`, Rose `#F43F5E`)
  - Recharts for high-frequency time-series graphs, diurnal flow curves, and consumption comparison bar charts
  - Lucide React for modern iconography
  - Axios with JWT authentication interceptors
  - Native WebSockets for real-time live streaming telemetry updates and alert toasts

- **Backend:**
  - Python 3.12
  - FastAPI (RESTful endpoints, automated OpenAPI `/docs`, asynchronous lifespan management)
  - WebSockets (`ws://localhost:8000/ws`) for telemetry broadcast
  - Passlib & PyJWT with bcrypt password hashing
  - Pytest & HTTPX for automated unit and integration testing

- **Intelligent Analytics & ML:**
  - Scikit-Learn `IsolationForest` (unsupervised anomaly detection trained on 24-hour diurnal residential usage baselines)
  - Pandas & NumPy for mass-balance discrepancies, non-revenue water auditing, and CSV report generation

- **Database:**
  - PostgreSQL / SQLite via SQLAlchemy 2.0 ORM (14 normalized relational tables, foreign key constraints, indexes)

- **IoT Hardware & Firmware:**
  - ESP32 DevKit V1 C++ Arduino Firmware (`iot_firmware/esp32_water_node.ino`)
  - YF-S201 Hall-Effect turbine flow sensor (Interrupt-driven pulse counting, $K = 7.5\text{ Hz/LPM}$)
  - 0-1.2 MPa (0-12 Bar) Piezoresistive pressure transmitter (ADC sampling with 10k/20k voltage divider)
  - HC-SR04 / JSN-SR04T Waterproof Ultrasonic liquid level sensor
  - 5V Optocoupler Relay Module actuating 12V DC Solenoid Valve

---

## 3. Database Design (14 Specified Tables)

The schema supports multi-community, multi-building, multi-sensor hierarchy:

1. **`users`**: User authentication, bcrypt hash, role (`admin`, `maintenance`, `resident`), household linkage.
2. **`communities`**: Central community details, total capacity (140,000 L), daily water budget.
3. **`buildings`**: 4 Residential Towers (Lotus Block A, Orchid Block B, Magnolia Block C, Jasmine Block D).
4. **`households`**: 24 apartment units with smart meters, resident contacts, daily water quotas.
5. **`pipelines`**: Arterial distribution trunks and building risers, diameter, material, nominal pressure, valve status.
6. **`sensors`**: Flow transmitters, pressure transducers, ultrasonic depth gauges, hardware models, battery levels.
7. **`sensor_readings`**: High-frequency telemetry time-series (flow LPM, pressure Bar, tank level %, anomaly flags).
8. **`water_tanks`**: Central underground reservoir (80,000 L) + 4 rooftop overhead tanks (15,000 L each) with low-level warning thresholds.
9. **`water_supply_records`**: Municipal grid replenishments, tanker sourcing, volume, timestamps, cost estimations.
10. **`leakage_incidents`**: Identified leaks with severity (`low`, `medium`, `high`, `critical`), confidence scores, detection reasons, resolution workflows.
11. **`notifications`**: Real-time alerts, broadcast advisories, unread tracking.
12. **`maintenance_records`**: Technician repair logs, replaced parts (couplings, solvent cement), repair costs.
13. **`valve_actions`**: Comprehensive audit log of manual actuations and automated emergency isolations.
14. **`consumption_records`**: Daily metered consumption records per household and building over 30 days.

---

## 4. Intelligent Leakage Detection Engine

The leakage engine employs a multi-tiered evaluation pipeline to eliminate false positives:

1. **Catastrophic Pipe Burst:**
   - Evaluates whether pressure has collapsed ($\Delta P \ge 0.85\text{ Bar}$) while flow surges to $> 130\%$ of normal capacity.
   - Severity: **CRITICAL**.
   - Action: Validates persistence, creates incident, and commands immediate automated solenoid isolation on branch risers.
2. **Mass-Balance Discrepancy:**
   - Compares inflow measured at the building supply riser against the sum of downstream apartment sub-meters:
     $$\text{Loss } (\%) = \frac{Q_{\text{riser}} - \sum Q_{\text{apartments}}}{Q_{\text{riser}}} \times 100\%$$
   - Discrepancy $> 12\%$ triggers Medium/High incident.
3. **Temporal Persistence Buffer:**
   - Maintains an in-memory rolling window requiring **3 consecutive abnormal telemetry ticks** before confirming an incident, preventing false alarms from water hammer or momentary pump surges.
4. **Zero-Hour Night Flow Audit:**
   - Audits continuous flow between 01:00 and 05:00 UTC. Any continuous flow exceeding 8 LPM during zero-demand hours is flagged as an insidious leak.
5. **Machine Learning Isolation Forest:**
   - Ingests 24-hour diurnal usage profiles and calculates anomaly decision scores against residential diurnal profiles.

---

## 5. Automated Valve Control & Safety Interlock

When a critical pipe burst occurs:
1. Engine validates the condition across persistence buffer.
2. Generates a Critical Incident and broadcasts a priority alert over WebSockets.
3. **Safety Rule 10 Enforcement:** If the affected line is a **Central Community Arterial Line** (`TRUNK-MAIN-01`), automated closure is **blocked by policy** to protect community fire-fighting readiness and prevent pump burnout. Manual Administrator override is required.
4. If the affected line is a **Building Branch Riser** (`PIPE-TWR-A`..`D`), the relay immediately isolates the pipeline, sets `valve_status = CLOSED`, records the action in `valve_actions`, and notifies maintenance.
5. Operators can manually open, close, or trigger Emergency Shutdown with mandatory audit logging.

---

## 6. Pre-Seeded Evaluation Accounts

The platform includes a 1-click role switcher in the UI header and login screen:

| Role | Username | Password | Permissions & Views |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` (Shreeyut) | `admin123` | Full control: all pipelines, valve shutoffs, ML sandbox, incident resolution, settings |
| **Maintenance Staff** | `technician` | `tech123` | Operational view: assigned leakage incidents, maintenance records, sensor health |
| **Resident** | `resident` | `resident123` | Personal apartment meter (Apt A-101), daily quota tracking, community water availability |

---

## 7. Quickstart Guide

### Option A: Launch Everything with One Script
```bash
./run_system.sh
```
This automatically initializes the virtual environment, verifies the database, starts the FastAPI backend on `http://localhost:8000`, and launches the Vite React frontend on `http://localhost:5173`.

### Option B: C# (.NET 8) Backend Setup

The platform includes a native **C# / ASP.NET Core 8 Web API** backend (`backend_csharp/AquaFlow.Server`), providing high-throughput asynchronous processing with identical REST endpoints and WebSockets:

```bash
# In project root, run the C# backend
./backend_csharp/run.sh
```
Or manually:
```bash
cd backend_csharp/AquaFlow.Server
dotnet run
```

- Swagger UI: `http://localhost:8000/swagger`
- Health Endpoint: `http://localhost:8000/`
- WebSocket Telemetry: `ws://localhost:8000/ws`

To run the built-in C# comprehensive verification test suite:
```bash
cd backend_csharp/AquaFlow.Server
dotnet run -- --verify
```

### Option C: Python (FastAPI) Backend Setup
```bash
# In project root
source .venv/bin/activate
cd backend

# Initialize database & seed 30 days of data
PYTHONPATH=. python seed_data.py

# Run FastAPI Server
PYTHONPATH=. uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- API Docs (Swagger): `http://localhost:8000/docs`
- Health Endpoint: `http://localhost:8000/`
- WebSocket Telemetry: `ws://localhost:8000/ws`

#### Frontend Setup (Shared)
```bash
# In a separate terminal
cd frontend

# Install dependencies (if not already done)
npm install

# Start Vite dev server
npm run dev
```

Open `http://localhost:5173` in your web browser.

---

## 8. Automated Testing & Verification

### C# (.NET 8) Backend Verification
Run the automated verification suite built directly into the C# server:
```bash
cd backend_csharp/AquaFlow.Server
dotnet run -- --verify
```
**Results:**
- `[TEST 1/5]` Database Seeding & Admin User `Shreeyut` (Role: Admin) -> **PASSED**
- `[TEST 2/5]` Pre-Seeded Leakage Incidents (6 diverse incidents) -> **PASSED**
- `[TEST 3/5]` Multi-Parameter Leakage Detection (Pipe burst detection) -> **PASSED**
- `[TEST 4/5]` Safety Rule 10 Enforcement (`TRUNK-MAIN-01` auto-isolation block) -> **PASSED**
- `[TEST 5/5]` 24h Diurnal Consumption Pattern Scoring -> **PASSED**
- **Total: 5/5 Passed (100%)**

### Python (FastAPI) Test Suite
```bash
source .venv/bin/activate
cd backend
PYTHONPATH=. pytest -v
```

**Results:**
- `tests/test_auth.py`: 4 tests passed
- `tests/test_leakage_engine.py`: 3 tests passed
- `tests/test_valves_automation.py`: 2 tests passed
- `tests/test_analytics.py`: 3 tests passed
- `tests/test_telemetry_api.py`: 5 tests passed
- **Total: 17 Passed, 0 Failed.**

---

## 9. Interactive Demonstration Scenarios

Use the **IoT Simulator Control Panel** embedded directly in the frontend dashboard to test the system live:

1. **Trigger Pipe Burst (Critical):**
   - Click **"Pipe Burst"**.
   - Notice flow surge to > 70 LPM while pressure collapses to ~1.1 Bar.
   - The persistence engine confirms the anomaly after 3 ticks.
   - An instant Red Toast appears: **"Critical Leakage Incident Detected"**.
   - Watch the solenoid valve automatically trip to **ISOLATED (CLOSED)**.
2. **Trigger Micro-Leak (Medium):**
   - Click **"Micro-Fissure"**.
   - Mass-balance discrepancy is detected between the building riser and sub-meters.
   - An amber incident is logged with confidence score > 84%.
3. **Trigger Tank Drain Event:**
   - Click **"Tank Drain Event"**.
   - Watch the rooftop overhead tank drop below the 20% low threshold line.
   - An ultrasonic alarm notification is automatically dispatched.
4. **Click "Reset Normal":**
   - Restores all hydraulic lines, resets valves to open, and restores steady-state normal telemetry.

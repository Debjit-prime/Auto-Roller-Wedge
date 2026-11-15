# Auto-Roller Wedge: Connected Repose Angle & Static Friction Rig

An end-to-end cyber-physical instrumentation system featuring:
1. **Arduino Firmware (`/firmware/wedge_wifi`)**: Non-blocking state machine with an embedded HTTP REST server running on an Arduino UNO R4 WiFi.
2. **Web Dashboard (`/web`)**: Real-time React + Vite + TypeScript + Tailwind CSS telemetry console based on the Stitch physics laboratory design system.
3. **Mock Hardware Server (`/web/mock-arduino`)**: High-fidelity Node.js simulator replicating the exact embedded HTTP contract and timing for testing without hardware.

---

## Architecture Overview

```
                                      +---------------------------------------------+
                                      |            Browser Web Dashboard            |
                                      |     (React + TypeScript + Tailwind CSS)     |
                                      +---------------------------------------------+
                                                              |
                                           HTTP Poll (every 200ms) / REST
                                                              v
+-------------------------------------------------------------------------------------------------------------------+
|                                            Arduino UNO R4 WiFi Rig                                                |
|                                                                                                                   |
|   +------------------------------------+                         +--------------------------------------------+   |
|   |         WiFiS3 HTTP Server         |                         |        Non-Blocking State Machine          |   |
|   |  - GET  /status (Telemetry JSON)   | <---------------------> |  - PHASE_RESETTING   (25ms/deg return)     |   |
|   |  - POST /reset  (Start sequence)   |                         |  - PHASE_PLACE_BLOCK (3s placement)        |   |
|   |  - OPTIONS      (CORS Preflight)   |                         |  - PHASE_RUNNING     (+1 deg/s ramp)       |   |
|   +------------------------------------+                         |  - PHASE_SLIPPED     (Acoustic hold)       |   |
|                     |                                            +--------------------------------------------+   |
|                     v                                                                   |                         |
|   +------------------------------------+                                                v                         |
|   |       12x8 LED Matrix Frame        |                                 +----------------------------+           |
|   |  - Scrolls WiFi IP on boot         |                                 |       Peripherals          |           |
|   |  - Real-time angle & degree ring   |                                 | - Dual Servos (D9, D10)    |           |
|   +------------------------------------+                                 | - HC-SR04 Ultrasonic (D11,12)          |
|                                                                          | - Active Piezo Buzzer (D13)|           |
|                                                                          | - Touch Sensor (D8)        |           |
|                                                                          +----------------------------+           |
+-------------------------------------------------------------------------------------------------------------------+
```

---

## Part A: Arduino Firmware Setup (`/firmware/wedge_wifi`)

### Hardware Pin Mapping
* **Green Status LED (Experiment Performing)**: Pin `D2` (Digital OUTPUT, glows during `RUNNING`)
* **Red Alert LED (Block Slipped)**: Pin `D3` (Digital OUTPUT, glows during `SLIPPED`)
* **Touch Sensor (Short Press Reset)**: Pin `D8` (Digital INPUT)
* **Servo 1**: Pin `D9` (`servo1.write(90 + angle)`)
* **Servo 2**: Pin `D10` (`servo2.write(90 - angle)`)
* **HC-SR04 Ultrasonic Trigger**: Pin `D11` (Digital OUTPUT)
* **HC-SR04 Ultrasonic Echo**: Pin `D12` (Digital INPUT)
* **Active Piezo Buzzer**: Pin `D13` (Digital OUTPUT, active HIGH)
* *(Potentiometer `A5` has been removed completely — the rig is fully automated).*

### Required Board Core & Libraries
* **Board Package**: Arduino UNO R4 Boards (`arduino:renesas_uno:unor4wifi`)
* **Libraries**:
  1. `WiFiS3` (Bundled with the Arduino UNO R4 Core)
  2. `Servo` (Official Arduino Servo library)
  3. `ArduinoGraphics` (Install via Arduino IDE Library Manager)
  4. `Arduino_LED_Matrix` (Bundled with the Arduino UNO R4 Core)

### Step 1: Configure WiFi Credentials
Navigate to `/firmware/wedge_wifi/` and copy the secrets template:
```bash
cp firmware/wedge_wifi/arduino_secrets.example.h firmware/wedge_wifi/arduino_secrets.h
```
Edit `arduino_secrets.h` with your local 2.4 GHz WiFi network credentials:
```cpp
#define SECRET_SSID "YourNetworkSSID"
#define SECRET_PASS "YourNetworkPassword"
```

### Step 2: Compile & Upload via Arduino IDE or CLI
#### Using the Arduino IDE:
1. Open `firmware/wedge_wifi/wedge_wifi.ino`.
2. Select **Board**: `Arduino UNO R4 WiFi`.
3. Select your serial port and click **Upload**.

#### Using `arduino-cli`:
```bash
# Install core and required libraries
arduino-cli core install arduino:renesas_uno
arduino-cli lib install ArduinoGraphics
arduino-cli lib install Servo

# Compile
arduino-cli compile --fqbn arduino:renesas_uno:unor4wifi firmware/wedge_wifi

# Upload (replace /dev/cu.usbmodem* with your port)
arduino-cli upload -p /dev/cu.usbmodem* --fqbn arduino:renesas_uno:unor4wifi firmware/wedge_wifi
```

### Step 3: Identify the Arduino IP Address
1. Open the Serial Monitor at **115200 baud**.
2. Upon connection, the Arduino prints:
   ```
   [WIFI] Connected! Assigned IP: 192.168.4.105
   [HTTP] Server listening on port 80
   ```
3. The board also scrolls its IP address across the built-in 12x8 LED matrix.

---

## Part B: Web Application Setup (`/web`)

The web console is built with **React 19**, **Vite**, **TypeScript**, and **Tailwind CSS**. It runs locally over plain `http://` to ensure that browsers do not block mixed-content requests when communicating with the Arduino's local HTTP server.

### Installation & Launch
```bash
cd web
npm install
npm run dev
```
Open your browser to `http://localhost:5173`.

### Connecting to Hardware
1. Click the **Settings (tune icon)** in the top bar.
2. Enter the IP address shown in your Arduino Serial Monitor (e.g. `192.168.4.105`).
3. Click **Save & Connect**.
4. The connection pill will turn green (`LIVE`) and live telemetry will stream at 5 Hz.

---

## Part C: Mock Arduino Server (`/web/mock-arduino`)

You can develop and verify the entire UI without needing physical hardware using the included mock server:

```bash
cd web
npm run mock
```
The mock server starts on `http://127.0.0.1:8080`.
In the web application Settings modal, set the IP to `127.0.0.1:8080` (or click **DEMO** in the top bar to use the in-browser simulator).

---

## API Contract Specification

All endpoints return permissive CORS headers (`Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: GET, POST, OPTIONS`, `Access-Control-Allow-Headers: Content-Type`).

### 1. `GET /status`
Returns the real-time kinematic and acoustic state of the wedge.

**Response (`200 OK`, `application/json`):**
```json
{
  "angle": 27,
  "distance": 182,
  "initialDist": 170,
  "slipped": true,
  "slipAngle": 27,
  "phase": "SLIPPED",
  "maxAngle": 60,
  "slipTolerance": 25,
  "uptimeMs": 48290
}
```

* `angle` *(integer)*: Live inclination of the plank in degrees (`0` to `60`).
* `distance` *(integer | null)*: Current ultrasonic reading in millimeters. Returns `null` when the sensor times out (`NO_ECHO = 10000`).
* `initialDist` *(integer | null)*: Baseline position established at the end of `PLACE_BLOCK` phase. Returns `null` during `RESETTING`.
* `slipped` *(boolean)*: `true` if displacement `|distance - initialDist| >= slipTolerance`.
* `slipAngle` *(integer | null)*: The exact angle recorded at the instant of slip; preserved until the next reset.
* `phase` *(string)*: One of `"RESETTING"`, `"PLACE_BLOCK"`, `"RUNNING"`, `"SLIPPED"`.
* `maxAngle` *(integer)*: Maximum physical travel (`60`).
* `slipTolerance` *(integer)*: Threshold displacement (`25` mm).
* `uptimeMs` *(long)*: Milliseconds elapsed on the controller.

### 2. `POST /reset` (or `GET /reset`)
Initiates the non-blocking reset sequence:
1. Returns the plank to 0° at 1° per 25 ms.
2. Sounds a single 100 ms acoustic cue.
3. Holds at 0° for 3 seconds (`PLACE_BLOCK`) to allow placing the specimen block.
4. Samples 8 ultrasonic measurements 50 ms apart to calculate the fresh baseline.
5. Resumes automated inclination at 1° per second (`RUNNING`).

**Success Response (`200 OK`):**
```json
{ "ok": true }
```

**Busy Response (`200 OK` - when already resetting or in block placement):**
```json
{ "ok": false, "reason": "busy" }
```

### 3. `OPTIONS *`
CORS preflight request. Returns `204 No Content` with appropriate headers.

---

## Verification & Curl Checklist

Use these curl commands in your terminal to verify that your Arduino UNO R4 WiFi or Mock server is responding correctly:

```bash
# 1. Verify telemetry response
curl -i http://<IP_OR_HOST>/status

# 2. Verify CORS preflight
curl -i -X OPTIONS http://<IP_OR_HOST>/status

# 3. Verify reset command dispatch
curl -i -X POST http://<IP_OR_HOST>/reset

# 4. Verify 404 handling on unknown paths
curl -i http://<IP_OR_HOST>/unknown
```

---

## Tunable Constants Reference

| Constant | Location | Default | Description |
| :--- | :--- | :--- | :--- |
| `slipTolerance` | Firmware & Types | `25` mm | Displacement delta required to trip slip latch |
| `autoStepMs` | Firmware | `1000` ms | Automated inclination slew rate (+1° per second) |
| `returnStepMs` | Firmware | `25` ms | Reset descent rate (1° per 25 ms; 60° = 1.5s) |
| `placeBlockMs` | Firmware | `3000` ms | Placement window countdown before baseline lock |
| `SENSOR_RANGE_MM` | Web (`SimulationCanvas.tsx`) | `150` mm | Total wedge distance covered by the sonar |
| Polling Interval | Web (`useWedge.ts`) | `200` ms | Client telemetry polling frequency (5 Hz) |
| Request Timeout | Web (`api.ts`) | `1500` ms | AbortController request watchdog |

---

## Manual Hardware Test Checklist

Follow this checklist to verify real hardware functionality step-by-step:

- [ ] **1. Firmware Flashing**: Upload `wedge_wifi.ino` to the Arduino UNO R4 WiFi.
- [ ] **2. Serial Inspection**: Open Serial Monitor (115200 baud). Confirm WiFi connects, prints assigned IP, and starts the HTTP server on port 80.
- [ ] **3. LED Matrix Verification**: Confirm the assigned IP scrolls smoothly across the 12x8 matrix on boot.
- [ ] **4. Web App Connection**: Start the web app (`npm run dev`), open Settings, enter the IP, and verify the connection pill turns green (`LIVE`).
- [ ] **5. Angle Sync**: Tilt wedge and verify that the angle on the web dashboard matches the numeral on the Arduino's LED matrix within 1°.
- [ ] **6. Web Reset Verification**: Click **RESET** in the web app. Confirm:
  - Plank eases down to 0° smoothly (at 25 ms/deg).
  - Controller plays one brief 100 ms acoustic beep at 0°.
  - Status banner displays "Place the block on the plank (3s)".
- [ ] **7. Acoustic Ranging**: Place the specimen block on the plank. Verify that the web app displays the measured distance (e.g., ~170 mm) rather than "No echo".
- [ ] **8. Automated Tilting & Green LED**: Watch the plank tilt +1° every second in `RUNNING` phase. Confirm the **Green LED (Pin D2)** glows continuously while the experiment is performing.
- [ ] **9. Repose Angle & Slip Latch & Red LED**: Let the block slide. Confirm:
  - Distance jumps by ≥25 mm.
  - **Red LED (Pin D3)** immediately turns ON, and Green LED turns OFF.
  - Piezo buzzer sounds for exactly 500 ms and then silences.
  - Servos immediately halt and wedge freezes at that exact angle.
  - Web console shows the red alert banner, computes $\mu_s = \tan(\theta)$, and logs the run to the History table.
- [ ] **10. Touch Sensor Reset**: Short-press the physical touch sensor (Pin 8). Confirm that the controller initiates the reset sequence, turns off both LEDs, and returns the wedge to 0°.

> **Verification Status**:
> * **Tested with the Mock Server**: Contract shape checks, phase state machine, duplicate history suppression, CORS headers, Vitest unit tests, and Vite production bundle.
> * **Needs Testing on Real Board**: Physical servo torque / travel alignment, analog acoustic reflection variance of HC-SR04 with specific wood specimens, and local router Wi-Fi RSSI stability.

---

## Troubleshooting Guide

1. **Browser cannot reach the Arduino**:
   - Ensure the laptop and Arduino are on the **exact same WiFi network SSID**.
   - The Arduino UNO R4 WiFi only supports **2.4 GHz WiFi networks** (it does not connect to 5 GHz-only SSIDs).
   - Check if your router has **AP Client Isolation** enabled (which prevents local WiFi devices from communicating with each other). If so, disable it in your router settings.
2. **Mixed-Content Blocking**:
   - Do **NOT** deploy or open the web dashboard via `https://`. When a page is loaded via HTTPS, modern browsers block HTTP requests to local IPs due to mixed-content security restrictions. Always use `http://localhost:5173`.
3. **Arduino IP address changes**:
   - Routers assign dynamic IPs via DHCP. If the Arduino restarts, it may obtain a different IP. Configure a **DHCP Reservation (static IP binding)** for the Arduino's MAC address in your router dashboard.
4. **CORS Errors**:
   - The firmware and mock server send `Access-Control-Allow-Origin: *` on every response, including `OPTIONS` preflight requests. If CORS errors appear, ensure no proxy or browser extension is intercepting HTTP calls.
5. **Acoustic "No Echo" / Jitter**:
   - Ultrasonic HC-SR04 sensors require a perpendicular reflective surface. Ensure the front face of your test block is flat, smooth, and facing the transducer directly.

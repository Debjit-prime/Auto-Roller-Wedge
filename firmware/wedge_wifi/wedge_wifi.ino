/*
 * Auto-Roller Wedge - Connected Inclined Plane Repose Rig
 * Target Board: Arduino UNO R4 WiFi
 * Architecture: Non-blocking state machine with embedded HTTP REST API on WiFiS3
 *
 * Pins:
 *   - Green LED:       D2  (Digital OUTPUT, glows when experiment is running)
 *   - Red LED:         D3  (Digital OUTPUT, glows when block slips)
 *   - Touch Sensor:    D8  (Digital INPUT, active HIGH)
 *   - Servo 1:         D9  (PWM output, 90 + angle)
 *   - Servo 2:         D10 (PWM output, 90 - angle)
 *   - HC-SR04 Trig:    D11 (Digital OUTPUT)
 *   - HC-SR04 Echo:    D12 (Digital INPUT)
 *   - Active Buzzer:   D13 (Digital OUTPUT, active HIGH)
 *   - OLED SDA:        A4  (I2C, 1.3" SH1106 128x64, address 0x3C)
 *   - OLED SCL:        A5  (I2C)
 *
 * Required Libraries:
 *   - WiFiS3              (Bundled with Arduino UNO R4 Core)
 *   - Servo               (Bundled or official Arduino Servo)
 *   - ArduinoGraphics     (Install via Arduino Library Manager)
 *   - Arduino_LED_Matrix  (Bundled with Arduino UNO R4 Core)
 *   - U8g2                (Install via Library Manager, by olikraus)
 */

#include "ArduinoGraphics.h"      // MUST be included before Arduino_LED_Matrix
#include "Arduino_LED_Matrix.h"
#include <Servo.h>
#include <WiFiS3.h>
#include <Wire.h>
#include <U8g2lib.h>
#include "arduino_secrets.h"

// ---------- Hardware Pins ----------
const int greenLedPin = 2; // Green LED: glows during experiment execution (PHASE_RUNNING)
const int redLedPin   = 3; // Red LED: glows when block slips (PHASE_SLIPPED)
const int touchPin    = 8;
const int servo1Pin   = 9;
const int servo2Pin   = 10;
const int trigPin     = 11;
const int echoPin     = 12;
const int buzzPin     = 13;

// ---------- Rig Parameters & Constants ----------
const int  maxAngle          = 60;      // Maximum wedge tilt (degrees)
const int  slipTolerance     = 25;      // Delta distance (mm) triggering slip event
const int  NO_ECHO           = 10000;   // Ultrasonic timeout sentinel value
const unsigned long autoStepMs   = 1000; // Step duration: +1 degree per second
const unsigned long returnStepMs = 25;   // Reset slew rate: 1 degree per 25 ms
const unsigned long placeBlockMs = 3000; // Duration to place specimen block
const unsigned long minPressMs   = 50;   // Debounce threshold for physical touch sensor

// ---------- System Phases (State Machine) ----------
enum Phase {
  PHASE_RESETTING,    // Easing back down to 0 degrees at 25ms per degree
  PHASE_PLACE_BLOCK,  // 3-second block placement countdown
  PHASE_RUNNING,      // Automated 1 deg/sec angle ramp with continuous acoustic ranging
  PHASE_SLIPPED       // Motion latched upon slip detection, buzzer sounded, repose angle locked
};

Phase currentPhase = PHASE_RESETTING;

// ---------- Rig State Variables ----------
int  angle          = 0;
int  lastWritten    = -1;
int  shown          = -1;
int  currentDist    = NO_ECHO;
int  initialDist    = NO_ECHO;
bool slipped        = false;
int  slipAngle      = -1;       // -1 represents null/unset

// Timing state
unsigned long lastAutoStepTime    = 0;
unsigned long lastReturnStepTime  = 0;
unsigned long placeBlockStartTime = 0;
unsigned long buzzerStartTime     = 0;
bool buzzerActive                 = false;

// Touch sensor debouncing
bool lastTouch = false;
unsigned long pressStart = 0;

// WiFi & Network state
WiFiServer server(80);
unsigned long lastWifiCheck = 0;
const unsigned long wifiRetryInterval = 5000;
unsigned long lastIpLogTime = 0;
const unsigned long ipLogInterval = 10000; // Periodically log IP to Serial for easy discovery

// Peripherals
ArduinoLEDMatrix matrix;
Servo servo1;
Servo servo2;

// 1.3" OLED: SH1106 controller, 128x64, hardware I2C, full frame buffer (1 KB RAM)
// If your module is a true SSD1306, swap for: U8G2_SSD1306_128X64_NONAME_F_HW_I2C
U8G2_SH1106_128X64_NONAME_F_HW_I2C u8g2(U8G2_R0, U8X8_PIN_NONE);

// What the OLED currently shows (redraw only when these change)
int oledPhase = -1;
int oledAngle = -1;

// Forward Declarations
void serviceNetwork();
void startReset();
int  getDistance();
int  baselineDistance();
void showAngle();
void writeServos();
void beepOnce(int ms);
void checkTouchSensor();
void handleStateMachine();
void checkWiFiConnection();
void oledUpdate();

// ---------- LED Matrix Display Helpers ----------
void showText(const char *s, int x, bool degree) {
  matrix.beginDraw();
  matrix.clear();
  matrix.stroke(0xFFFFFFFF);
  matrix.textFont(Font_4x6);
  matrix.beginText(x, 1, 0xFFFFFFFF);
  matrix.print(s);
  matrix.endText();
  if (degree) { // Distinctive 4-pixel degree ring in top right
    matrix.point(10, 0);
    matrix.point(9, 1);
    matrix.point(11, 1);
    matrix.point(10, 2);
  }
  matrix.endDraw();
}

void showAngle() {
  if (angle == shown) return; // Redraw only on value change
  char buf[6];
  snprintf(buf, sizeof(buf), "%d", angle);
  showText(buf, angle < 10 ? 4 : 1, true);
  shown = angle;
}

void scrollMessage(const char *msg) {
  matrix.beginDraw();
  matrix.stroke(0xFFFFFFFF);
  matrix.textScrollSpeed(55);
  matrix.textFont(Font_5x7);
  matrix.beginText(0, 1, 0xFFFFFFFF);
  matrix.println(msg);
  matrix.endText(SCROLL_LEFT);
  matrix.endDraw();
}

// ---------- OLED Display Helpers ----------
// Formats tan(deg) with 3 decimals without relying on printf float support
void formatMu(char *buf, size_t n, int deg) {
  long v = (long)(tan(deg * DEG_TO_RAD) * 1000.0 + 0.5);
  snprintf(buf, n, "%ld.%03ld", v / 1000, v % 1000);
}

void drawCentered(const char *s, int y) {
  u8g2.drawStr((128 - u8g2.getStrWidth(s)) / 2, y, s);
}

// 5x7 theta glyph drawn from shapes (ellipse + bar); (x, y) = top-left corner
void drawTheta(int x, int y) {
  u8g2.drawEllipse(x + 2, y + 3, 2, 3);
  u8g2.drawHLine(x + 1, y + 3, 3);
}

void oledDraw() {
  char mu[12];
  char line[24];

  u8g2.clearBuffer();

  switch (currentPhase) {
    case PHASE_RESETTING:
      u8g2.setFont(u8g2_font_helvB12_tr);
      drawCentered("Resetting...", 30);
      u8g2.setFont(u8g2_font_6x10_tr);
      drawCentered("Wedge returning to level", 48);
      break;

    case PHASE_PLACE_BLOCK:
      u8g2.setFont(u8g2_font_helvB12_tr);
      drawCentered("Place block", 30);
      u8g2.setFont(u8g2_font_6x10_tr);
      drawCentered("on the wedge", 48);
      break;

    case PHASE_RUNNING:
    case PHASE_SLIPPED: {
      bool done = (currentPhase == PHASE_SLIPPED);
      int  deg  = (done && slipAngle >= 0) ? slipAngle : angle;
      formatMu(mu, sizeof(mu), deg);

      // Header
      u8g2.setFont(u8g2_font_6x10_tr);
      {
        int wl = u8g2.getStrWidth("u = tan(");
        int wr = u8g2.getStrWidth(")");
        int x0 = (128 - (wl + 6 + wr)) / 2;     // centre "u = tan(θ)"
        u8g2.drawStr(x0, 9, "u = tan(");
        drawTheta(x0 + wl, 2);
        u8g2.drawStr(x0 + wl + 6, 9, ")");
      }

      // Big coefficient value
      u8g2.setFont(u8g2_font_logisoso28_tn);
      drawCentered(mu, 46);

      // Bottom line: theta on the left, status on the right
      u8g2.setFont(u8g2_font_6x10_tr);
      drawTheta(0, 54);                            // θ symbol
      snprintf(line, sizeof(line), "= %d", deg);
      u8g2.drawStr(8, 61, line);
      u8g2.drawCircle(8 + u8g2.getStrWidth(line) + 3, 54, 2); // degree ring

      const char *status = done ? "SLIPPED" : "RUNNING";
      int sw = u8g2.getStrWidth(status);
      if (done) {                                  // inverted tag for the final result
        u8g2.drawBox(128 - sw - 4, 51, sw + 4, 13);
        u8g2.setDrawColor(0);
        u8g2.drawStr(128 - sw - 2, 61, status);
        u8g2.setDrawColor(1);
      } else {
        u8g2.drawStr(128 - sw, 61, status);
      }
      break;
    }
  }

  u8g2.sendBuffer();
}

// Redraws only when something visible changed. During RESETTING and PLACE_BLOCK
// the screen is static, so no I2C traffic slows the servo return.
void oledUpdate() {
  int ph = (int)currentPhase;
  bool changed = (ph != oledPhase) ||
                 (currentPhase == PHASE_RUNNING && angle != oledAngle);
  if (!changed) return;

  oledDraw();
  oledPhase = ph;
  oledAngle = angle;
}

// ---------- Servo Positioning Helper ----------
void writeServos() {
  if (angle == lastWritten) return;
  servo1.write(90 + angle);
  servo2.write(90 - angle);
  lastWritten = angle;
}

// ---------- Sound & Acoustic Feedback ----------
void beepOnce(int ms) {
  digitalWrite(buzzPin, HIGH);
  unsigned long start = millis();
  while (millis() - start < (unsigned long)ms) {
    serviceNetwork(); // Keep servicing network even during blocking beeps
    delayMicroseconds(250);
  }
  digitalWrite(buzzPin, LOW);
}

// ---------- Ultrasonic Ranging ----------
// Reads distance in mm using speed of sound (343 m/s = 0.1715 mm/us round-trip)
int getDistance() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  // 30ms timeout (covers up to ~5.1 meters)
  long duration = pulseIn(echoPin, HIGH, 30000UL);
  if (duration == 0) return NO_ECHO;
  return (int)(duration * 0.1715);
}

// Computes reference baseline as the average of 8 valid acoustic measurements
int baselineDistance() {
  long sum = 0;
  int n = 0;
  for (int i = 0; i < 8; i++) {
    int d = getDistance();
    if (d != NO_ECHO) {
      sum += d;
      n++;
    }
    // Delay 50ms between pulses while servicing HTTP server
    unsigned long waitStart = millis();
    while (millis() - waitStart < 50) {
      serviceNetwork();
      delayMicroseconds(500);
    }
  }
  return n ? (int)(sum / n) : NO_ECHO;
}

// ---------- Reset Sequence Initiator ----------
void startReset() {
  currentPhase = PHASE_RESETTING;
  slipped = false;
  slipAngle = -1;
  buzzerActive = false;
  digitalWrite(buzzPin, LOW);
  digitalWrite(greenLedPin, LOW);
  digitalWrite(redLedPin, LOW);
  lastReturnStepTime = millis();
  shown = -1;
  Serial.println(F("[BENCH] Reset triggered. Returning to 0 deg..."));
}

// ---------- Non-blocking State Machine Handler ----------
void handleStateMachine() {
  unsigned long now = millis();

  // Manage non-blocking slip buzzer duration
  if (buzzerActive && (now - buzzerStartTime >= 500)) {
    digitalWrite(buzzPin, LOW);
    buzzerActive = false;
  }

  switch (currentPhase) {
    case PHASE_RESETTING: {
      if (angle > 0) {
        if (now - lastReturnStepTime >= returnStepMs) {
          angle--;
          writeServos();
          showAngle();
          lastReturnStepTime = now;
        }
      } else {
        // Reached 0 degrees
        writeServos();
        showAngle();
        // Give 200ms settling time
        unsigned long settleStart = millis();
        while (millis() - settleStart < 200) {
          serviceNetwork();
          delayMicroseconds(500);
        }
        beepOnce(100); // 100 ms acoustic cue: "place block now"
        currentPhase = PHASE_PLACE_BLOCK;
        placeBlockStartTime = millis();
        Serial.println(F("[BENCH] 0 deg reached. Phase -> PLACE_BLOCK (3s)"));
      }
      break;
    }

    case PHASE_PLACE_BLOCK: {
      // Hold at 0 deg during 3-second block positioning window
      showAngle();
      if (now - placeBlockStartTime >= placeBlockMs) {
        Serial.println(F("[BENCH] Taking acoustic baseline distance..."));
        initialDist = baselineDistance();
        currentDist = initialDist;
        Serial.print(F("[BENCH] Baseline established: "));
        if (initialDist == NO_ECHO) {
          Serial.println(F("NO_ECHO"));
        } else {
          Serial.print(initialDist);
          Serial.println(F(" mm"));
        }
        currentPhase = PHASE_RUNNING;
        digitalWrite(greenLedPin, HIGH); // Green LED D2 glows when experiment is performing
        digitalWrite(redLedPin, LOW);
        lastAutoStepTime = millis();
        Serial.println(F("[BENCH] Phase -> RUNNING (Green LED D2 ON)"));
      }
      break;
    }

    case PHASE_RUNNING: {
      // Ensure Green LED is ON and Red LED is OFF while experiment is performing
      digitalWrite(greenLedPin, HIGH);
      digitalWrite(redLedPin, LOW);

      // 1. Single ultrasonic measurement per loop
      currentDist = getDistance();

      // 2. Slip detection evaluation
      if (currentDist != NO_ECHO && initialDist != NO_ECHO) {
        if (abs(currentDist - initialDist) >= slipTolerance) {
          slipped = true;
          slipAngle = angle;
          currentPhase = PHASE_SLIPPED;
          digitalWrite(greenLedPin, LOW); // Green LED OFF
          digitalWrite(redLedPin, HIGH);  // Red LED D3 glows when block gets slipped
          buzzerActive = true;
          buzzerStartTime = millis();
          digitalWrite(buzzPin, HIGH); // 500ms buzzer activated non-blockingly

          Serial.print(F("[BENCH] *** SLIP DETECTED at "));
          Serial.print(slipAngle);
          Serial.print(F(" deg! Delta: "));
          Serial.print(abs(currentDist - initialDist));
          Serial.println(F(" mm ***"));
          return;
        }
      }

      // 3. Automated angular increment (1 degree per second)
      if (angle < maxAngle && (now - lastAutoStepTime >= autoStepMs)) {
        angle++;
        lastAutoStepTime = now;
        writeServos();
        showAngle();
      }
      break;
    }

    case PHASE_SLIPPED: {
      // Wedge stays frozen at slip angle; LED matrix retains angle
      // Red LED remains glowing until reset
      digitalWrite(greenLedPin, LOW);
      digitalWrite(redLedPin, HIGH);
      currentDist = getDistance();
      showAngle();
      break;
    }
  }
}

// ---------- Physical Touch Sensor Handler ----------
void checkTouchSensor() {
  bool touch = (digitalRead(touchPin) == HIGH);

  if (touch && !lastTouch) {
    pressStart = millis();
  }

  // Detect release after valid debounce duration (short press)
  if (!touch && lastTouch) {
    if (millis() - pressStart >= minPressMs) {
      if (currentPhase != PHASE_RESETTING && currentPhase != PHASE_PLACE_BLOCK) {
        Serial.println(F("[BENCH] Touch sensor pressed -> Resetting"));
        startReset();
      } else {
        Serial.println(F("[BENCH] Touch sensor ignored (reset already in progress)"));
      }
    }
  }

  lastTouch = touch;
}

// ---------- HTTP REST Server & Network Servicing ----------
void serviceNetwork() {
  WiFiClient client = server.available();
  if (!client) return;

  // Read the first line of the HTTP request: METHOD PATH PROTOCOL
  String reqLine = "";
  unsigned long timeout = millis() + 500;
  while (client.connected() && millis() < timeout) {
    if (client.available()) {
      char c = client.read();
      if (c == '\n') break;
      if (c != '\r') reqLine += c;
    }
  }

  // Parse HTTP Method and Path
  int firstSpace = reqLine.indexOf(' ');
  int secondSpace = reqLine.indexOf(' ', firstSpace + 1);
  String method = "";
  String path = "";
  if (firstSpace > 0) {
    method = reqLine.substring(0, firstSpace);
    if (secondSpace > firstSpace) {
      path = reqLine.substring(firstSpace + 1, secondSpace);
    } else {
      path = reqLine.substring(firstSpace + 1);
    }
  }

  // Read and discard remainder of headers until blank line
  while (client.connected() && millis() < timeout) {
    if (client.available()) {
      String line = client.readStringUntil('\n');
      if (line == "\r" || line.length() == 0) break;
    }
  }

  // --- Endpoint: OPTIONS (CORS Preflight) ---
  if (method == "OPTIONS") {
    client.println("HTTP/1.1 204 No Content");
    client.println("Access-Control-Allow-Origin: *");
    client.println("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    client.println("Access-Control-Allow-Headers: Content-Type");
    client.println("Connection: close");
    client.println();
    client.stop();
    return;
  }

  // Standard JSON response headers
  #define SEND_CORS_HEADERS(statusLine) \
    client.println(statusLine); \
    client.println("Access-Control-Allow-Origin: *"); \
    client.println("Access-Control-Allow-Methods: GET, POST, OPTIONS"); \
    client.println("Access-Control-Allow-Headers: Content-Type"); \
    client.println("Content-Type: application/json"); \
    client.println("Connection: close"); \
    client.println();

  // --- Endpoint: GET /status ---
  if (method == "GET" && (path == "/status" || path == "/status/")) {
    SEND_CORS_HEADERS("HTTP/1.1 200 OK");

    const char* phaseStr = "RUNNING";
    switch (currentPhase) {
      case PHASE_RESETTING:   phaseStr = "RESETTING";   break;
      case PHASE_PLACE_BLOCK: phaseStr = "PLACE_BLOCK"; break;
      case PHASE_RUNNING:     phaseStr = "RUNNING";     break;
      case PHASE_SLIPPED:     phaseStr = "SLIPPED";     break;
    }

    client.print("{\"angle\":");
    client.print(angle);

    client.print(",\"distance\":");
    if (currentDist == NO_ECHO) client.print("null");
    else client.print(currentDist);

    client.print(",\"initialDist\":");
    if (initialDist == NO_ECHO) client.print("null");
    else client.print(initialDist);

    client.print(",\"slipped\":");
    client.print(slipped ? "true" : "false");

    client.print(",\"slipAngle\":");
    if (slipAngle < 0) client.print("null");
    else client.print(slipAngle);

    client.print(",\"phase\":\"");
    client.print(phaseStr);
    client.print("\"");

    client.print(",\"maxAngle\":");
    client.print(maxAngle);

    client.print(",\"slipTolerance\":");
    client.print(slipTolerance);

    client.print(",\"uptimeMs\":");
    client.print(millis());

    client.println("}");
    client.stop();
    return;
  }

  // --- Endpoint: POST /reset or GET /reset ---
  if ((method == "POST" || method == "GET") && (path == "/reset" || path == "/reset/")) {
    if (currentPhase == PHASE_RESETTING || currentPhase == PHASE_PLACE_BLOCK) {
      SEND_CORS_HEADERS("HTTP/1.1 200 OK");
      client.println("{\"ok\":false,\"reason\":\"busy\"}");
    } else {
      startReset();
      SEND_CORS_HEADERS("HTTP/1.1 200 OK");
      client.println("{\"ok\":true}");
    }
    client.stop();
    return;
  }

  // --- Any Other Endpoint: 404 Not Found ---
  SEND_CORS_HEADERS("HTTP/1.1 404 Not Found");
  client.println("{\"error\":\"not found\"}");
  client.stop();
}

// ---------- Non-blocking WiFi Auto-Reconnect ----------
void checkWiFiConnection() {
  if (WiFi.status() != WL_CONNECTED) {
    unsigned long now = millis();
    if (now - lastWifiCheck >= wifiRetryInterval) {
      lastWifiCheck = now;
      Serial.println(F("[WIFI] Link down. Attempting background reconnect..."));
      WiFi.begin(SECRET_SSID, SECRET_PASS);
    }
  }
}

// ---------- Main Setup ----------
void setup() {
  Serial.begin(115200);
  delay(100);
  Serial.println(F("\n============================================="));
  Serial.println(F("  Auto-Roller Wedge Rig - UNO R4 WiFi Online  "));
  Serial.println(F("============================================="));

  // Initialize hardware pins
  pinMode(greenLedPin, OUTPUT);
  pinMode(redLedPin, OUTPUT);
  digitalWrite(greenLedPin, LOW);
  digitalWrite(redLedPin, LOW);
  pinMode(touchPin, INPUT);
  pinMode(buzzPin, OUTPUT);
  digitalWrite(buzzPin, LOW);
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);

  // Initialize LED matrix
  matrix.begin();

  // Initialize OLED (400 kHz I2C keeps each full-frame redraw near 25 ms)
  u8g2.begin();
  u8g2.setBusClock(400000);
  u8g2.clearBuffer();
  u8g2.setFont(u8g2_font_7x13B_tr);
  drawCentered("Auto Roller Wedge", 28);
  u8g2.setFont(u8g2_font_6x10_tr);
  drawCentered("Starting...", 46);
  u8g2.sendBuffer();

  // Attach servos
  servo1.attach(servo1Pin);
  servo2.attach(servo2Pin);

  // Check for default template credentials
  if (strcmp(SECRET_SSID, "your-wifi-ssid") == 0) {
    Serial.println(F("\n[!] ========================================================="));
    Serial.println(F("[!] WARNING: Default placeholder credentials detected!"));
    Serial.println(F("[!] Please edit firmware/wedge_wifi/arduino_secrets.h"));
    Serial.println(F("[!] with your 2.4 GHz WiFi SSID and Password, then re-upload."));
    Serial.println(F("[!] =========================================================\n"));
    scrollMessage(" SET SSID IN SECRETS.H ");
  }

  // Connect to WiFi
  Serial.print(F("[WIFI] Connecting to SSID: "));
  Serial.println(SECRET_SSID);

  int wifiAttempts = 0;
  while (WiFi.status() != WL_CONNECTED && wifiAttempts < 20) {
    WiFi.begin(SECRET_SSID, SECRET_PASS);
    delay(500);
    Serial.print(".");
    wifiAttempts++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    IPAddress ip = WiFi.localIP();
    Serial.println(F("\n**************************************************"));
    Serial.print(F(">>> ARDUINO IP ADDRESS: "));
    Serial.println(ip);
    Serial.print(F(">>> Web Dashboard Target: http://"));
    Serial.println(ip);
    Serial.println(F("**************************************************\n"));

    // Start HTTP server on port 80
    server.begin();
    Serial.println(F("[HTTP] Server listening on port 80"));

    // Scroll IP once across the LED matrix
    String ipStr = " IP: " + String(ip[0]) + "." + String(ip[1]) + "." + String(ip[2]) + "." + String(ip[3]) + " ";
    scrollMessage(ipStr.c_str());
  } else {
    Serial.println(F("[WIFI] Connection timed out. Running in standalone mode."));
    Serial.println(F("[WIFI] Tip: Ensure your WiFi is 2.4 GHz and credentials in arduino_secrets.h match."));
  }

  // Execute initial zeroing and baseline calibration
  startReset();
}

// ---------- Main Loop ----------
void loop() {
  // 1. Maintain HTTP REST API responsiveness
  serviceNetwork();

  // 2. Physical touch sensor monitoring
  checkTouchSensor();

  // 3. Wedge kinematic & acoustic state machine execution
  handleStateMachine();

  // 3b. OLED: show tan(theta) (redraws only when something changed)
  oledUpdate();

  // 4. Non-blocking WiFi status check & auto-reconnect
  checkWiFiConnection();

  // 5. On-demand Serial Monitor IP Query & Periodic Heartbeat
  if (Serial.available()) {
    while (Serial.available()) Serial.read(); // Flush input
    if (WiFi.status() == WL_CONNECTED) {
      IPAddress ip = WiFi.localIP();
      Serial.println(F("\n-----------------------------------------"));
      Serial.print(F(">>> ARDUINO IP ADDRESS: "));
      Serial.println(ip);
      Serial.print(F(">>> Enter this in Web Settings: http://"));
      Serial.println(ip);
      Serial.println(F("-----------------------------------------"));
      String ipStr = " IP: " + String(ip[0]) + "." + String(ip[1]) + "." + String(ip[2]) + "." + String(ip[3]) + " ";
      scrollMessage(ipStr.c_str());
    } else {
      Serial.print(F("[WIFI] Offline. Configured SSID: "));
      Serial.println(SECRET_SSID);
    }
  }

  // Periodic Serial IP reminder every 10 seconds
  if (WiFi.status() == WL_CONNECTED && millis() - lastIpLogTime >= ipLogInterval) {
    lastIpLogTime = millis();
    Serial.print(F("[LIVE LINK] Arduino IP: http://"));
    Serial.print(WiFi.localIP());
    Serial.print(F(" | Angle: "));
    Serial.print(angle);
    Serial.print(F(" deg | Phase: "));
    switch (currentPhase) {
      case PHASE_RESETTING:   Serial.println(F("RESETTING"));   break;
      case PHASE_PLACE_BLOCK: Serial.println(F("PLACE_BLOCK")); break;
      case PHASE_RUNNING:     Serial.println(F("RUNNING"));     break;
      case PHASE_SLIPPED:     Serial.println(F("SLIPPED"));     break;
    }
  }

  // 6. Standard non-blocking loop pacing (20ms)
  delay(20);
}
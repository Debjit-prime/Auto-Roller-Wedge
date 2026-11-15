/**
 * Mock Arduino UNO R4 WiFi Server
 * Implements the exact HTTP REST contract of the physical Auto-Roller Wedge rig.
 * 
 * Endpoints:
 *   - GET  /status -> Current rig telemetry & state JSON
 *   - POST /reset  -> Triggers physical reset sequence
 *   - GET  /reset  -> Also triggers physical reset sequence
 *   - OPTIONS *    -> 204 No Content with full CORS preflight headers
 */

import http from 'node:http';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
const serverStartTime = Date.now();

// State machine configuration
const MAX_ANGLE = 60;
const SLIP_TOLERANCE = 25;
const RETURN_STEP_MS = 25;   // 1 deg per 25ms during reset
const PLACE_BLOCK_MS = 3000; // 3 seconds countdown
const BASELINE_DIST = 75;    // Typical initial placement distance in mm (sonar range ~150mm)

// Simulation state
let currentPhase = 'RESETTING'; // 'RESETTING' | 'PLACE_BLOCK' | 'RUNNING' | 'SLIPPED'
let angle = 0;
let distance = BASELINE_DIST;
let initialDist = BASELINE_DIST;
let slipped = false;
let slipAngle = null;

// Target slip angle between 22 and 36 degrees
let targetSlipAngle = 27;

function pickRandomSlipAngle() {
  return Math.floor(Math.random() * (36 - 22 + 1)) + 22;
}

// Timer references
let simulationInterval = null;
let resetStepTimer = null;
let placeBlockTimeout = null;

function broadcastState() {
  // Add subtle sensor noise (+- 0.4 mm)
  const noise = (Math.random() - 0.5) * 0.8;
  if (currentPhase === 'RUNNING') {
    distance = Math.round((initialDist + noise) * 10) / 10;
  } else if (currentPhase === 'SLIPPED') {
    distance = Math.round((initialDist + 28.4 + noise) * 10) / 10;
  }
}

function startResetSequence() {
  clearInterval(simulationInterval);
  clearTimeout(placeBlockTimeout);
  clearInterval(resetStepTimer);

  currentPhase = 'RESETTING';
  slipped = false;
  slipAngle = null;
  targetSlipAngle = pickRandomSlipAngle();
  console.log(`[MOCK ARDUINO] Starting reset sequence. Target slip angle for next run: ${targetSlipAngle}°`);

  // Slew angle down to 0 at 25ms per degree
  resetStepTimer = setInterval(() => {
    if (angle > 0) {
      angle--;
    } else {
      clearInterval(resetStepTimer);
      console.log('[MOCK ARDUINO] Leveled at 0°. Transitioning to PLACE_BLOCK (3s)...');
      currentPhase = 'PLACE_BLOCK';
      angle = 0;

      // 3-second block placement countdown
      placeBlockTimeout = setTimeout(() => {
        initialDist = BASELINE_DIST;
        distance = initialDist;
        currentPhase = 'RUNNING';
        console.log(`[MOCK ARDUINO] Baseline set (${initialDist} mm). Transitioning to RUNNING (+1°/s)...`);

        // Run angle ramp (+1 deg / sec)
        simulationInterval = setInterval(() => {
          if (currentPhase === 'RUNNING') {
            angle++;
            broadcastState();

            if (angle >= targetSlipAngle) {
              // Trigger slip
              slipped = true;
              slipAngle = angle;
              currentPhase = 'SLIPPED';
              distance = initialDist + 28.4;
              console.log(`[MOCK ARDUINO] *** SLIP DETECTED at ${slipAngle}°! Δd = +28.4 mm ***`);
              clearInterval(simulationInterval);
            } else if (angle >= MAX_ANGLE) {
              // End of travel limit
              clearInterval(simulationInterval);
              console.log('[MOCK ARDUINO] Reached max tilt limit (60°).');
            }
          }
        }, 1000);
      }, PLACE_BLOCK_MS);
    }
  }, RETURN_STEP_MS);
}

// Initial boot reset
angle = 15; // Start tilted so initial leveling is visible
startResetSequence();

// Periodic sensor noise ticker
setInterval(broadcastState, 200);

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;
  const method = req.method;

  // Set mandatory CORS headers on EVERY response
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Connection', 'close');

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // GET /status
  if (method === 'GET' && (pathname === '/status' || pathname === '/status/')) {
    const statusPayload = {
      angle: angle,
      distance: (currentPhase === 'RESETTING' || currentPhase === 'PLACE_BLOCK') ? null : distance,
      initialDist: currentPhase === 'RESETTING' ? null : initialDist,
      slipped: slipped,
      slipAngle: slipAngle,
      phase: currentPhase,
      maxAngle: MAX_ANGLE,
      slipTolerance: SLIP_TOLERANCE,
      uptimeMs: Date.now() - serverStartTime,
    };

    res.statusCode = 200;
    res.end(JSON.stringify(statusPayload));
    return;
  }

  // POST /reset or GET /reset
  if ((method === 'POST' || method === 'GET') && (pathname === '/reset' || pathname === '/reset/')) {
    if (currentPhase === 'RESETTING' || currentPhase === 'PLACE_BLOCK') {
      res.statusCode = 200;
      res.end(JSON.stringify({ ok: false, reason: 'busy' }));
      return;
    }

    startResetSequence();
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // 404 handler
  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'not found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`  Auto-Roller Wedge Mock Arduino Server Listening      `);
  console.log(`  Port: http://127.0.0.1:${PORT}                      `);
  console.log(`  Endpoints:                                           `);
  console.log(`    GET  http://127.0.0.1:${PORT}/status              `);
  console.log(`    POST http://127.0.0.1:${PORT}/reset               `);
  console.log(`=======================================================`);
});

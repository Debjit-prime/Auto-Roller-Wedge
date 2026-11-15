import React from 'react';
import type { Phase } from '../lib/types';

interface SimulationCanvasProps {
  angle: number;           // Live interpolated angle in degrees
  distance: number | null; // Ultrasonic distance in mm
  initialDist: number | null;
  phase: Phase;
  slipped: boolean;
  maxAngle?: number;
  sensorRangeMm?: number;  // Tunable constant, default 150mm
}

export const SENSOR_RANGE_MM_DEFAULT = 150;

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({
  angle,
  distance,
  initialDist,
  phase,
  slipped,
  sensorRangeMm = SENSOR_RANGE_MM_DEFAULT,
}) => {
  // Clamped angle (0 to 60 degrees)
  const clampedAngle = Math.max(0, Math.min(60, angle));

  // Base coordinate system
  const pivotX = 90;
  const pivotY = 390;
  const plankLengthPx = 540;

  // Block positioning mapping:
  // Sensor sits at offset ~30px from pivot along the plank.
  // Physical distance mm maps proportionally along the plank (0 to sensorRangeMm, default 150mm).
  const sensorOffsetX = 120;
  const effectiveDistance = distance !== null ? distance : initialDist !== null ? initialDist : 75;
  const clampedDist = Math.max(5, Math.min(sensorRangeMm, effectiveDistance));
  const distRatio = clampedDist / sensorRangeMm;
  const blockX = sensorOffsetX + distRatio * (plankLengthPx - 180);

  // Compute Protractor Angle Arc Path
  const arcRadius = 110;
  const angleRad = (clampedAngle * Math.PI) / 180;
  const arcEndX = pivotX + arcRadius * Math.cos(angleRad);
  const arcEndY = pivotY - arcRadius * Math.sin(angleRad);

  let arcPathD = `M ${pivotX} ${pivotY} L ${pivotX + arcRadius} ${pivotY} Z`;
  if (clampedAngle > 0.4) {
    const largeArcFlag = clampedAngle > 180 ? 1 : 0;
    arcPathD = `M ${pivotX + arcRadius} ${pivotY} A ${arcRadius} ${arcRadius} 0 ${largeArcFlag} 0 ${arcEndX.toFixed(1)} ${arcEndY.toFixed(1)} L ${pivotX} ${pivotY} Z`;
  }

  // Label position on the arc
  const halfRad = angleRad / 2;
  const labelDist = arcRadius * 0.7;
  const labelX = pivotX + labelDist * Math.cos(halfRad);
  const labelY = pivotY - labelDist * Math.sin(halfRad);

  const displayDistance = distance !== null ? `${distance.toFixed(1)} mm` : 'No echo';

  return (
    <div className="relative w-full bg-[#FFFFFF] border border-[#D9E1DC] rounded-lg p-3 sm:p-4 card-shadow flex flex-col overflow-hidden">
      {/* Viewport Header */}
      <div className="flex items-center justify-between mb-2 text-xs">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#16322F]">
          <span className="material-symbols-outlined text-[16px] text-[#8A6A1F]">square_foot</span>
          <span className="font-serif">Kinematic Wedge Viewport</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] text-[#4A6460]">
          <span>SCALE: 1:2.5</span>
          <span className="hidden sm:inline">|</span>
          <span className="hidden sm:inline">HC-SR04 40kHz</span>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative w-full aspect-[16/10] bg-[#FFFFFF] border border-[#E6ECE8] rounded select-none overflow-hidden flex items-center justify-center">
        <svg
          viewBox="0 0 760 480"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          aria-label={`Inclined plane simulation at ${clampedAngle.toFixed(1)} degrees`}
        >
          <defs>
            {/* Block Gradient */}
            <linearGradient id="blockBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#F7F8F5" />
            </linearGradient>

            {/* Sound Wave Pattern */}
            <filter id="subtleGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#16322F" floodOpacity="0.1" />
            </filter>
          </defs>

          {/* Angular Reference Lines (Calibrated hairline guides) */}
          <g stroke="#E6ECE8" strokeDasharray="3,3" strokeWidth="1">
            <line x1={pivotX} y1={pivotY} x2="680" y2="390" />
            <line x1={pivotX} y1={pivotY} x2="660" y2="237" />
            <line x1={pivotX} y1={pivotY} x2="600" y2="95" />
            <line x1={pivotX} y1={pivotY} x2="490" y2="-10" />
            <text x="660" y="385" fill="#8A9C98" fontFamily="JetBrains Mono" fontSize="10" fontWeight="600">
              0°
            </text>
            <text x="640" y="232" fill="#8A9C98" fontFamily="JetBrains Mono" fontSize="10" fontWeight="600">
              15°
            </text>
            <text x="585" y="90" fill="#8A9C98" fontFamily="JetBrains Mono" fontSize="10" fontWeight="600">
              30°
            </text>
            <text x="475" y="30" fill="#8A9C98" fontFamily="JetBrains Mono" fontSize="10" fontWeight="600">
              45°
            </text>
          </g>

          {/* Heavy Bench Base (Deep Forest Green #16322F) */}
          <g id="benchBase">
            <rect x="50" y={pivotY} width="670" height="42" rx="2" fill="#16322F" stroke="#0E211F" strokeWidth="1.5" />
            <line x1="50" y1={pivotY} x2="720" y2={pivotY} stroke="#C9A24B" strokeWidth="2" />
            {/* Rubber Dampers */}
            <rect x="70" y="432" width="40" height="12" rx="2" fill="#EEF2EF" stroke="#16322F" strokeWidth="1.5" />
            <rect x="660" y="432" width="40" height="12" rx="2" fill="#EEF2EF" stroke="#16322F" strokeWidth="1.5" />
            {/* Spirit Level Bubble Indicator */}
            <rect x="340" y="405" width="80" height="14" rx="7" fill="#EEF2EF" stroke="#C9A24B" strokeWidth="1.5" />
            <circle cx="380" cy="412" r="4" fill="#1F8A5B" opacity="0.9" />
            <text x="348" y="430" fill="#16322F" fontFamily="JetBrains Mono" fontSize="10" fontWeight="bold">
              LEVEL 0.0°
            </text>
          </g>

          {/* Dynamic Goniometer Arc Sector at Pivot */}
          {clampedAngle > 0.4 && (
            <g id="protractorArc">
              <path d={arcPathD} fill="rgba(201, 162, 75, 0.22)" stroke="#C9A24B" strokeWidth="1.8" />
              <text
                x={labelX}
                y={labelY + 4}
                fill="#8A6A1F"
                fontFamily="JetBrains Mono"
                fontSize="12"
                fontWeight="bold"
                textAnchor="middle"
              >
                θ = {clampedAngle.toFixed(0)}°
              </text>
            </g>
          )}

          {/* Pivot Hinge Pin (Forest green body + gold core) */}
          <circle cx={pivotX} cy={pivotY} r="12" fill="#16322F" stroke="#C9A24B" strokeWidth="2.5" />
          <circle cx={pivotX} cy={pivotY} r="4" fill="#C9A24B" />

          {/* DYNAMIC ROTATING PLANK ASSEMBLY */}
          <g id="rotatingPlank" transform={`rotate(-${clampedAngle}, ${pivotX}, ${pivotY})`}>
            {/* Main Hardwood Plank */}
            <rect
              x={pivotX}
              y={pivotY - 10}
              width={plankLengthPx}
              height="14"
              rx="2"
              fill="#16322F"
              stroke="#0E211F"
              strokeWidth="1.5"
            />

            {/* Millimeter Scale Ticks on Top Surface in Gold */}
            <path
              d="M 120 380 L 120 375 M 170 380 L 170 373 M 220 380 L 220 375 M 270 380 L 270 373 M 320 380 L 320 375 M 370 380 L 370 373 M 420 380 L 420 375 M 470 380 L 470 373 M 520 380 L 520 375 M 570 380 L 570 373 M 620 380 L 620 375"
              stroke="#C9A24B"
              strokeWidth="1.2"
            />

            {/* HC-SR04 Ultrasonic Sensor Mount at Hinge End */}
            <g id="ultrasonicSensor" transform="translate(100, 350)">
              {/* PCB Plate */}
              <rect x="0" y="6" width="30" height="24" rx="1.5" fill="#EEF2EF" stroke="#16322F" strokeWidth="1.5" />
              {/* Dual Transducer Barrels */}
              <rect x="6" y="0" width="18" height="7" rx="1" fill="#FFFFFF" stroke="#C9A24B" strokeWidth="1.2" />
              <circle cx="15" cy="3.5" r="2" fill="#16322F" />
              <text x="3" y="24" fill="#16322F" fontFamily="JetBrains Mono" fontSize="10" fontWeight="bold">
                SR04
              </text>

              {/* Subtle Acoustic Sound Wave Arcs */}
              <path
                d="M 32 4 A 12 12 0 0 1 32 20 M 40 0 A 18 18 0 0 1 40 24 M 48 -4 A 26 26 0 0 1 48 28"
                fill="none"
                stroke="#C9A24B"
                strokeWidth="1.5"
                opacity="0.8"
                className="animate-pulse"
              />
            </g>

            {/* CALIBRATED SPECIMEN TEST BLOCK */}
            <g id="testBlock" transform={`translate(${blockX.toFixed(1)}, 336)`}>
              {/* Block Body */}
              <rect
                x="0"
                y="0"
                width="65"
                height="44"
                rx="2"
                fill="url(#blockBodyGrad)"
                stroke="#16322F"
                strokeWidth="2"
                filter="url(#subtleGlow)"
              />
              {/* Specimen Info Label */}
              <rect x="8" y="10" width="49" height="24" rx="2" fill="#EEF2EF" stroke="#D9E1DC" />
              <text
                x="32.5"
                y="26"
                fill="#16322F"
                fontFamily="JetBrains Mono"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
              >
                BLOCK
              </text>
              {/* Acoustic Reflector Gold Strip on Front Edge */}
              <rect x="0" y="0" width="3.5" height="44" fill="#C9A24B" />

              {/* Red Slip Motion Lines (active when slipped) */}
              {slipped && (
                <g id="slipMotionLines">
                  <line x1="68" y1="12" x2="84" y2="12" stroke="#C73A32" strokeWidth="2" strokeDasharray="2,2" />
                  <line x1="68" y1="22" x2="92" y2="22" stroke="#C73A32" strokeWidth="2" strokeDasharray="2,2" />
                  <line x1="68" y1="32" x2="82" y2="32" stroke="#C73A32" strokeWidth="2" strokeDasharray="2,2" />
                </g>
              )}
            </g>

            {/* Dashed Ultrasonic Measurement Dimension Line */}
            <g id="dimensionLine">
              <line
                x1="130"
                y1="362"
                x2={blockX.toFixed(1)}
                y2="362"
                stroke="#4A6460"
                strokeWidth="1.5"
                strokeDasharray="4,3"
              />
              <circle cx="130" cy="362" r="3" fill="#16322F" />
              <circle cx={blockX.toFixed(1)} cy="362" r="3" fill="#16322F" />

              {/* Floating Distance Badge Chip */}
              {blockX > 190 && (
                <g transform={`translate(${((130 + blockX) / 2 - 45).toFixed(1)}, 342)`}>
                  <rect
                    x="0"
                    y="0"
                    width="90"
                    height="20"
                    rx="2"
                    fill="#FFFFFF"
                    stroke="#16322F"
                    strokeWidth="1.2"
                  />
                  <text
                    x="45"
                    y="14"
                    fill={distance === null ? '#C77A12' : '#16322F'}
                    fontFamily="JetBrains Mono"
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    d = {displayDistance}
                  </text>
                </g>
              )}
            </g>
          </g>
        </svg>

        {/* Floating Telemetry HUD Inset Pill */}
        <div className="absolute top-3 left-3 bg-[#FFFFFF]/90 border border-[#D9E1DC] backdrop-blur px-2.5 py-1 rounded flex items-center gap-2 card-shadow text-[11px] font-mono">
          <span
            className={`w-2 h-2 rounded-full ${
              phase === 'RUNNING' ? 'bg-[#1F8A5B] animate-ping' : 'bg-[#8A9C98]'
            }`}
          />
          <span className="font-bold text-[#16322F]">
            {phase === 'RUNNING'
              ? 'RANGING ACTIVE'
              : phase === 'SLIPPED'
              ? 'LATCHED'
              : 'CALIBRATING'}
          </span>
          <span className="text-[#D9E1DC]">|</span>
          <span className="text-[#4A6460]">θ = {clampedAngle.toFixed(1)}°</span>
        </div>
      </div>

      {/* Slipped Alert Notification - Positioned lower below the canvas so it never overlaps the simulation setup */}
      {slipped && (
        <div className="mt-2.5 bg-[rgba(199,58,50,0.12)] border border-[#C73A32] px-3.5 py-2 rounded flex items-center justify-between text-[#16322F] card-shadow animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#C73A32]">alarm_on</span>
            <span className="font-slab text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C73A32]">
              SLIP TRIGGERED (Δd ≥ 25mm)
            </span>
          </div>
          <span className="font-mono text-xs font-bold text-[#16322F]">
            RIG FROZEN AT θ = {clampedAngle.toFixed(1)}°
          </span>
        </div>
      )}

      {/* Footer Specs Line */}
      <div className="mt-2 flex flex-wrap items-center justify-between text-[11px] font-mono text-[#4A6460]">
        <span>Plank: 480mm • Sonar Range: 150mm</span>
        <span className="text-[#8A6A1F] font-semibold">Slip Threshold: 25mm • Sensor Cone: 15°</span>
      </div>
    </div>
  );
};

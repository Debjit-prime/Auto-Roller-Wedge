import React from 'react';
import type { TelemetryPoint } from '../lib/types';

interface DetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: TelemetryPoint[];
  initialDist: number | null;
  currentDist: number | null;
  currentAngle: number;
}

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
  isOpen,
  onClose,
  telemetry,
  initialDist,
  currentDist,
  currentAngle,
}) => {
  if (!isOpen) return null;

  // Chart coordinate mapping
  // Telemetry contains up to 90 points (~18-60 seconds depending on stream)
  const width = 320;
  const height = 110;
  const paddingLeft = 35;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 25;
  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  // Normalize points for Angle Chart (0 to 60 deg)
  const anglePoints = telemetry.map((pt, i) => {
    const x = paddingLeft + (i / Math.max(1, telemetry.length - 1)) * plotWidth;
    const y = paddingTop + plotHeight - (Math.min(60, Math.max(0, pt.angle)) / 60) * plotHeight;
    return { x, y, isSlip: pt.isSlip };
  });

  const anglePathD =
    anglePoints.length > 0
      ? `M ${anglePoints.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ')}`
      : `M ${paddingLeft} ${paddingTop + plotHeight} L ${paddingLeft + plotWidth} ${paddingTop + plotHeight}`;

  // Area path for angle chart
  const angleAreaD =
    anglePoints.length > 0
      ? `${anglePathD} L ${paddingLeft + plotWidth} ${paddingTop + plotHeight} L ${paddingLeft} ${paddingTop + plotHeight} Z`
      : '';

  // Distance range (0 to 150mm sonar range)
  const minD = 0;
  const maxD = 150;
  const distPoints = telemetry.map((pt, i) => {
    const x = paddingLeft + (i / Math.max(1, telemetry.length - 1)) * plotWidth;
    const val = pt.distance !== null ? pt.distance : initialDist !== null ? initialDist : 75;
    const clamped = Math.max(minD, Math.min(maxD, val));
    const y = paddingTop + plotHeight - ((clamped - minD) / (maxD - minD)) * plotHeight;
    return { x, y, isSlip: pt.isSlip, val };
  });

  const distPathD =
    distPoints.length > 0
      ? `M ${distPoints.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ')}`
      : `M ${paddingLeft} ${paddingTop + plotHeight} L ${paddingLeft + plotWidth} ${paddingTop + plotHeight}`;

  const distAreaD =
    distPoints.length > 0
      ? `${distPathD} L ${paddingLeft + plotWidth} ${paddingTop + plotHeight} L ${paddingLeft} ${paddingTop + plotHeight} Z`
      : '';

  // Find slip point for marker line
  const slipIdx = telemetry.findIndex((t) => t.isSlip);
  const slipX =
    slipIdx >= 0 ? paddingLeft + (slipIdx / Math.max(1, telemetry.length - 1)) * plotWidth : null;

  const deltaDist =
    currentDist !== null && initialDist !== null
      ? (currentDist - initialDist).toFixed(1)
      : '--';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#16322F]/40 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="details-drawer-title"
    >
      <div className="bg-[#FFFFFF] border border-[#D9E1DC] rounded-xl modal-shadow max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#D9E1DC] pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-[#EEF2EF] text-[#8A6A1F]">
              <span className="material-symbols-outlined text-[20px]">ssid_chart</span>
            </span>
            <h2 id="details-drawer-title" className="font-serif text-lg font-bold text-[#16322F]">
              Live Telemetry Analytics (Last 60s)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[#EEF2EF] text-[#4A6460] hover:text-[#16322F] transition-colors cursor-pointer"
            aria-label="Close details"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 font-mono text-xs">
          <div className="bg-[#EEF2EF] p-2.5 rounded border border-[#D9E1DC]">
            <span className="text-[#8A9C98] text-[10px] uppercase font-bold block">Current Angle</span>
            <span className="text-sm font-bold text-[#16322F]">{currentAngle.toFixed(1)}°</span>
          </div>
          <div className="bg-[#EEF2EF] p-2.5 rounded border border-[#D9E1DC]">
            <span className="text-[#8A9C98] text-[10px] uppercase font-bold block">Initial Baseline</span>
            <span className="text-sm font-bold text-[#16322F]">
              {initialDist !== null ? `${initialDist.toFixed(1)} mm` : '--'}
            </span>
          </div>
          <div className="bg-[#EEF2EF] p-2.5 rounded border border-[#D9E1DC]">
            <span className="text-[#8A9C98] text-[10px] uppercase font-bold block">Net Displacement (Δd)</span>
            <span className="text-sm font-bold text-[#C9A24B]">+{deltaDist} mm</span>
          </div>
        </div>

        {/* Chart 1: Angle vs Time */}
        <div className="bg-[#FFFFFF] border border-[#D9E1DC] rounded p-3 flex flex-col gap-1 card-shadow">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono font-bold text-[#8A6A1F] uppercase">CH-1: ANGLE θ vs TIME</span>
            <span className="font-mono text-[11px] text-[#8A9C98]">RATE: 1.0°/s</span>
          </div>

          <div className="w-full h-32 bg-[#EEF2EF] border border-[#D9E1DC] rounded relative overflow-hidden flex items-center justify-center">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
              {/* Grid Lines */}
              <line x1={paddingLeft} y1="20" x2={width - paddingRight} y2="20" stroke="#D9E1DC" strokeDasharray="2,2" />
              <line x1={paddingLeft} y1="55" x2={width - paddingRight} y2="55" stroke="#D9E1DC" strokeDasharray="2,2" />
              <line x1={paddingLeft} y1="85" x2={width - paddingRight} y2="85" stroke="#D9E1DC" />
              <line x1={paddingLeft} y1="10" x2={paddingLeft} y2="85" stroke="#D9E1DC" strokeWidth="1.5" />

              {/* Ticks */}
              <text x="6" y="24" fill="#8A9C98" fontFamily="JetBrains Mono" fontSize="9">
                60°
              </text>
              <text x="6" y="58" fill="#8A9C98" fontFamily="JetBrains Mono" fontSize="9">
                30°
              </text>
              <text x="6" y="88" fill="#8A9C98" fontFamily="JetBrains Mono" fontSize="9">
                0°
              </text>

              {/* Area Fill */}
              {angleAreaD && <path d={angleAreaD} fill="rgba(201, 162, 75, 0.14)" />}

              {/* Line */}
              <path d={anglePathD} fill="none" stroke="#C9A24B" strokeWidth="2.5" strokeLinecap="round" />

              {/* Slip marker */}
              {slipX !== null && (
                <g>
                  <line x1={slipX} y1="10" x2={slipX} y2="85" stroke="#C73A32" strokeDasharray="3,2" strokeWidth="1.5" />
                  <circle cx={slipX} cy="35" r="3.5" fill="#C73A32" />
                  <text x={slipX - 30} y="15" fill="#C73A32" fontFamily="JetBrains Mono" fontSize="9" fontWeight="bold">
                    SLIP
                  </text>
                </g>
              )}
            </svg>
          </div>
        </div>

        {/* Chart 2: Ultrasonic Distance vs Time */}
        <div className="bg-[#FFFFFF] border border-[#D9E1DC] rounded p-3 flex flex-col gap-1 card-shadow">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono font-bold text-[#16322F] uppercase">CH-2: ULTRASONIC d (mm) vs TIME</span>
            <span className="font-mono text-[11px] text-[#4A6460]">THRESHOLD: 10mm</span>
          </div>

          <div className="w-full h-32 bg-[#EEF2EF] border border-[#D9E1DC] rounded relative overflow-hidden flex items-center justify-center">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
              {/* Grid Lines */}
              <line x1={paddingLeft} y1="20" x2={width - paddingRight} y2="20" stroke="#D9E1DC" strokeDasharray="2,2" />
              <line x1={paddingLeft} y1="55" x2={width - paddingRight} y2="55" stroke="#D9E1DC" strokeDasharray="2,2" />
              <line x1={paddingLeft} y1="85" x2={width - paddingRight} y2="85" stroke="#D9E1DC" />
              <line x1={paddingLeft} y1="10" x2={paddingLeft} y2="85" stroke="#D9E1DC" strokeWidth="1.5" />

              {/* Ticks */}
              <text x="4" y="24" fill="#8A9C98" fontFamily="JetBrains Mono" fontSize="9">
                150
              </text>
              <text x="4" y="58" fill="#8A9C98" fontFamily="JetBrains Mono" fontSize="9">
                75
              </text>
              <text x="4" y="88" fill="#8A9C98" fontFamily="JetBrains Mono" fontSize="9">
                0
              </text>

              {/* Area */}
              {distAreaD && <path d={distAreaD} fill="rgba(22, 50, 47, 0.08)" />}

              {/* Line */}
              <path d={distPathD} fill="none" stroke="#16322F" strokeWidth="2.5" strokeLinecap="round" />

              {/* Slip marker */}
              {slipX !== null && (
                <g>
                  <line x1={slipX} y1="10" x2={slipX} y2="85" stroke="#C73A32" strokeDasharray="3,2" strokeWidth="1.5" />
                  <circle cx={slipX} cy="55" r="3.5" fill="#C73A32" />
                </g>
              )}
            </svg>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#16322F] text-white text-xs font-semibold hover:bg-[#1F433F] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

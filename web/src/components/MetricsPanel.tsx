import React from 'react';
import type { Phase } from '../lib/types';

interface MetricsPanelProps {
  angle: number;
  distance: number | null;
  initialDist: number | null;
  phase: Phase;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({
  angle,
  distance,
  initialDist,
  phase,
}) => {
  const isNoEcho = distance === null;
  const zeroDisplay = initialDist !== null ? `${initialDist.toFixed(1)} mm` : '-- mm';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      {/* Tile 1: Angle Readout (θ) */}
      <div className="bg-[#FFFFFF] border border-[#D9E1DC] p-4 rounded-lg card-shadow relative overflow-hidden flex flex-col justify-between">
        <div className="w-full h-1 bg-[#C9A24B] absolute top-0 left-0" />
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#4A6460]">
            INCLINATION ANGLE (θ)
          </span>
          <span className="px-1.5 py-0.5 rounded bg-[#EEF2EF] border border-[#C9A24B]/40 text-[#8A6A1F] text-[10px] font-mono font-bold uppercase">
            LIVE
          </span>
        </div>

        <div className="my-2 flex items-baseline gap-1">
          <span className="font-mono tabular-nums text-4xl sm:text-5xl font-bold tracking-tight text-[#16322F]">
            {angle.toFixed(1)}
          </span>
          <span className="font-mono text-xl text-[#4A6460]">°</span>
        </div>

        <div className="flex items-center justify-between font-mono tabular-nums text-[11px] text-[#4A6460]">
          <span>
            RATE:{' '}
            <strong className="text-[#16322F]">
              {phase === 'RUNNING' ? '+1.00°/s' : phase === 'RESETTING' ? '-40°/s' : '0.00°/s'}
            </strong>
          </span>
          <span>LIMIT: 60°</span>
        </div>
      </div>

      {/* Tile 2: Ultrasonic Distance Readout (D) */}
      <div className="bg-[#FFFFFF] border border-[#D9E1DC] p-4 rounded-lg card-shadow relative overflow-hidden flex flex-col justify-between">
        <div className="w-full h-1 bg-[#1F8A5B] absolute top-0 left-0" />
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#4A6460]">
            POSITION DISTANCE (D)
          </span>
          <span
            className={`px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold uppercase ${
              isNoEcho
                ? 'bg-[#FFF8ED] border-[#C77A12]/40 text-[#C77A12]'
                : 'bg-[rgba(31,138,91,0.12)] border-[#1F8A5B]/30 text-[#1F8A5B]'
            }`}
          >
            {isNoEcho ? 'TIMEOUT' : 'ULTRASONIC'}
          </span>
        </div>

        <div className="my-2 flex items-baseline gap-1">
          {isNoEcho ? (
            <span className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-[#C77A12]">
              No echo
            </span>
          ) : (
            <>
              <span className="font-mono tabular-nums text-4xl sm:text-5xl font-bold tracking-tight text-[#16322F]">
                {distance.toFixed(1)}
              </span>
              <span className="font-mono text-xl text-[#4A6460]">mm</span>
            </>
          )}
        </div>

        <div className="flex items-center justify-between font-mono tabular-nums text-[11px] text-[#4A6460]">
          <span>ZERO: {zeroDisplay}</span>
          <span className={isNoEcho ? 'text-[#C77A12] font-semibold' : 'text-[#1F8A5B] font-semibold'}>
            {isNoEcho ? 'AWAITING REFLECTION' : 'STABLE ECHO'}
          </span>
        </div>
      </div>
    </div>
  );
};

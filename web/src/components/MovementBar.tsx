import React from 'react';

interface MovementBarProps {
  distance: number | null;
  initialDist: number | null;
  slipTolerance?: number; // default 25mm
  slipped: boolean;
}

export const MovementBar: React.FC<MovementBarProps> = ({
  distance,
  initialDist,
  slipTolerance = 25,
  slipped,
}) => {
  const delta =
    distance !== null && initialDist !== null
      ? Math.max(0, Math.round(Math.abs(distance - initialDist) * 10) / 10)
      : 0;

  const isExceeded = slipped || delta >= slipTolerance;

  // Max display scale 35mm to comfortably accommodate 25mm threshold with room to exceed
  const maxScale = Math.max(35, Math.round(slipTolerance * 1.4));
  const percentage = Math.min(100, Math.max(3, (delta / maxScale) * 100));
  const thresholdPercentage = (slipTolerance / maxScale) * 100;

  return (
    <div className="bg-[#FFFFFF] border border-[#D9E1DC] p-3 sm:p-4 rounded-lg card-shadow flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-sans font-bold uppercase tracking-wider text-[#4A6460]">
          DISPLACEMENT SLIP GAUGE (Δd)
        </span>
        <span
          className={`font-mono tabular-nums font-bold ${
            isExceeded ? 'text-[#C73A32]' : 'text-[#1F8A5B]'
          }`}
        >
          {delta > 0 ? `+${delta.toFixed(1)} mm` : '0.0 mm'}{' '}
          {isExceeded ? '(EXCEEDED)' : '(NOMINAL)'}
        </span>
      </div>

      {/* Progress Track */}
      <div className="relative w-full h-5 bg-[#EEF2EF] border border-[#D9E1DC] rounded overflow-hidden flex items-center">
        {/* Threshold marker (25mm) */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-[#C73A32] z-20"
          style={{ left: `${thresholdPercentage}%` }}
        />
        <span
          className="absolute -top-0.5 font-mono text-[9px] font-bold text-[#C73A32] z-20"
          style={{ left: `calc(${thresholdPercentage}% - 38px)` }}
        >
          {slipTolerance}mm LATCH
        </span>

        {/* Dynamic Filled Bar */}
        <div
          className={`h-full transition-all duration-300 ${
            isExceeded ? 'bg-[#C73A32]' : 'bg-[#1F8A5B]'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between font-mono text-[10px] text-[#8A9C98]">
        <span>0.0 mm</span>
        <span className="font-semibold text-[#4A6460]">
          Movement: {delta.toFixed(1)} mm of {slipTolerance} mm
        </span>
        <span>{maxScale}.0 mm</span>
      </div>
    </div>
  );
};

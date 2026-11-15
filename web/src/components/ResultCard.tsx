import React from 'react';
import { calculateMu } from '../lib/api';

interface ResultCardProps {
  slipAngle: number | null;
  buzzerActive: boolean;
  isResetDisabled: boolean;
  onReset: () => void;
  onViewDetails: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  slipAngle,
  buzzerActive,
  isResetDisabled,
  onReset,
  onViewDetails,
}) => {
  const angle = slipAngle ?? 0;
  const mu = calculateMu(angle);

  return (
    <div
      className="bg-[#FFFFFF] border-2 border-[#16322F] p-4 sm:p-6 rounded-lg card-shadow-elevated relative overflow-hidden flex flex-col gap-4 animate-in fade-in duration-300"
      role="region"
      aria-label="Experimental Result: Repose Angle and Friction Coefficient"
    >
      <div className="w-full h-1.5 bg-[#C9A24B] absolute top-0 left-0" />

      {/* Header and Buzzer Indicator */}
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded bg-[#FAF5EB] border border-[#C9A24B] text-[#8A6A1F] flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">verified</span>
          </span>
          <div>
            <span className="font-serif text-sm sm:text-base text-[#8A6A1F] font-bold uppercase tracking-wider">
              PHYSICS RESULT: SLIP CONFIRMED
            </span>
            <p className="font-sans text-xs sm:text-sm text-[#4A6460]">
              The block started sliding at {angle}°.
            </p>
          </div>
        </div>

        {/* Real Hardware Buzzer Acoustic Cue Badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-slab font-bold transition-all ${
            buzzerActive
              ? 'bg-[rgba(199,58,50,0.15)] border-[#C73A32] text-[#C73A32] animate-pulse shadow-xs'
              : 'bg-[#EEF2EF] border-[#D9E1DC] text-[#4A6460]'
          }`}
          title="Physical Piezo Buzzer on Arduino D13 triggered for 500ms"
        >
          <span className="material-symbols-outlined text-[16px]">
            {buzzerActive ? 'volume_up' : 'volume_mute'}
          </span>
          <span>{buzzerActive ? 'BUZZER 500ms ACTIVE' : 'BUZZER OFF'}</span>
        </div>
      </div>

      {/* Main Calculated Values */}
      <div className="bg-[#EEF2EF] border border-[#D9E1DC] p-4 rounded flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-sans font-bold uppercase tracking-wider">
          <span className="text-[#4A6460]">COEFFICIENT OF STATIC FRICTION (μs)</span>
          <span className="text-[#8A6A1F]">STANDARD MODEL: μs = tan(θ)</span>
        </div>

        <div className="flex items-baseline justify-between flex-wrap gap-2 pt-1">
          <div className="flex items-baseline gap-2">
            <span className="font-slab text-xl sm:text-2xl text-[#8A6A1F] font-bold">
              μs = tan({angle}°) =
            </span>
            <span className="font-slab text-4xl sm:text-5xl leading-none text-[#16322F] font-bold tabular-nums">
              {mu.toFixed(3)}
            </span>
          </div>
          <span className="font-slab text-sm text-[#1F8A5B] font-bold tabular-nums">
            Angle of Repose: {angle}°
          </span>
        </div>

        {/* Analytical Derivation Box */}
        <div className="pt-2 text-[11px] font-mono text-[#4A6460] border-t border-[#D9E1DC] mt-1 space-y-0.5">
          <div>ΣFx = mg·sin(θ) − Fs = 0 ⟹ Fs = mg·sin(θ)</div>
          <div>ΣFy = Fn − mg·cos(θ) = 0 ⟹ Fn = mg·cos(θ)</div>
          <div className="text-[#8A6A1F] font-semibold">
            μs = Fs / Fn = sin(θ) / cos(θ) = tan({angle}°) = {mu.toFixed(3)}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
        <button
          type="button"
          onClick={onViewDetails}
          className="flex items-center gap-1.5 px-3 py-2 rounded bg-[#FFFFFF] hover:bg-[#EEF2EF] border border-[#16322F] text-[#16322F] font-sans text-xs font-semibold transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px] text-[#8A6A1F]">analytics</span>
          <span>View Details &amp; Charts</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          disabled={isResetDisabled}
          className="flex items-center gap-2 px-4 py-2 rounded bg-[#16322F] hover:bg-[#1F433F] text-white font-sans text-xs font-bold uppercase transition-all card-shadow border-b-2 border-[#C9A24B] cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px] text-[#C9A24B]">restart_alt</span>
          <span>Run Another Test</span>
        </button>
      </div>
    </div>
  );
};

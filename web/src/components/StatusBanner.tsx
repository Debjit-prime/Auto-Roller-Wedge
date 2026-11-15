import React, { useState, useEffect } from 'react';
import type { Phase } from '../lib/types';

interface StatusBannerProps {
  phase: Phase;
  angle: number;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({ phase, angle }) => {
  const [countdown, setCountdown] = useState<number>(3);

  // Manage 3-second visual countdown during PLACE_BLOCK
  useEffect(() => {
    if (phase === 'PLACE_BLOCK') {
      setCountdown(3);
      const interval = setInterval(() => {
        setCountdown((prev) => (prev > 1 ? prev - 1 : 1));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [phase]);

  // Determine active step index: 0, 1, 2, 3
  const stepIndex =
    phase === 'RESETTING' ? 0 : phase === 'PLACE_BLOCK' ? 1 : phase === 'RUNNING' ? 2 : 3;

  // Plain-language user guidance
  let statusText = 'Getting ready…';
  if (phase === 'RESETTING') {
    statusText = `Getting ready… leveling plank (${angle}° → 0°)`;
  } else if (phase === 'PLACE_BLOCK') {
    statusText = `Place the block on the plank (${countdown}s)`;
  } else if (phase === 'RUNNING') {
    statusText = 'Test running… tilting slowly (+1°/s)';
  } else if (phase === 'SLIPPED') {
    statusText = 'The block slipped! Repose angle locked.';
  }

  return (
    <div className="w-full bg-[#FFFFFF] border border-[#D9E1DC] rounded-lg p-3 sm:p-4 card-shadow flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      {/* 4-Step Visual Stepper */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-mono">
        {/* Step 1: Resetting */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all whitespace-nowrap ${
            stepIndex === 0
              ? 'bg-[#EEF2EF] border border-[#16322F] text-[#16322F] font-bold'
              : 'text-[#8A9C98]'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              stepIndex === 0 ? 'bg-[#C9A24B] animate-pulse' : 'bg-[#D9E1DC]'
            }`}
          />
          <span>01. RESETTING</span>
        </div>

        <span className="text-[#8A9C98]">›</span>

        {/* Step 2: Place Block */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all whitespace-nowrap ${
            stepIndex === 1
              ? 'bg-[#FAF5EB] border border-[#C9A24B] text-[#8A6A1F] font-bold'
              : 'text-[#8A9C98]'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              stepIndex === 1 ? 'bg-[#1F8A5B] animate-pulse' : 'bg-[#D9E1DC]'
            }`}
          />
          <span>02. PLACE BLOCK</span>
        </div>

        <span className="text-[#8A9C98]">›</span>

        {/* Step 3: Running */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all whitespace-nowrap ${
            stepIndex === 2
              ? 'bg-[#EEF2EF] border border-[#1F8A5B] text-[#16322F] font-bold'
              : 'text-[#8A9C98]'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              stepIndex === 2 ? 'bg-[#1F8A5B] animate-ping' : 'bg-[#D9E1DC]'
            }`}
          />
          <span>03. RUNNING</span>
        </div>

        <span className="text-[#8A9C98]">›</span>

        {/* Step 4: Slipped */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all whitespace-nowrap ${
            stepIndex === 3
              ? 'bg-[rgba(199,58,50,0.12)] border border-[#C73A32] text-[#C73A32] font-bold'
              : 'text-[#8A9C98]'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              stepIndex === 3 ? 'bg-[#C73A32] animate-pulse' : 'bg-[#D9E1DC]'
            }`}
          />
          <span>04. SLIP TRIGGERED</span>
        </div>
      </div>

      {/* One-Line Plain Language Announcement (ARIA live) */}
      <div
        className="flex items-center gap-2 text-xs sm:text-sm font-sans font-medium text-[#16322F] shrink-0"
        aria-live="polite"
        role="status"
      >
        <span
          className={`w-2 h-2 rounded-full ${
            phase === 'SLIPPED'
              ? 'bg-[#C73A32]'
              : phase === 'RUNNING'
              ? 'bg-[#1F8A5B]'
              : 'bg-[#C9A24B]'
          }`}
        />
        <span>{statusText}</span>
      </div>
    </div>
  );
};

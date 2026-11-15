import React from 'react';
import type { ConnectionState } from '../lib/types';
import { ConnectionPill } from './ConnectionPill';

interface TopBarProps {
  connectionState: ConnectionState;
  arduinoIp: string;
  isDemo: boolean;
  isResetDisabled: boolean;
  isResetInFlight: boolean;
  onReset: () => void;
  onToggleDemo: () => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onOpenDetails: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  connectionState,
  arduinoIp,
  isDemo,
  isResetDisabled,
  isResetInFlight,
  onReset,
  onToggleDemo,
  onOpenSettings,
  onOpenHistory,
  onOpenDetails,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FFFFFF] border-b border-[#D9E1DC] card-shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Heading */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] uppercase tracking-wider font-bold">
              <span className="text-[#8A6A1F]">APEX INSTRUMENTS</span>
              <span className="text-[#8A9C98]">/</span>
              <span className="text-[#4A6460]">PHYSICS LAB</span>
            </div>
            <h1 className="font-serif text-base sm:text-lg lg:text-xl font-bold tracking-tight text-[#16322F]">
              Auto-Roller Wedge Live Simulator
            </h1>
          </div>
        </div>

        {/* Center Connection Pill (visible on tablet+) */}
        <div className="hidden sm:flex items-center">
          <ConnectionPill
            state={connectionState}
            ip={arduinoIp}
            isDemo={isDemo}
            onOpenSettings={onOpenSettings}
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Demo toggle */}
          <button
            type="button"
            onClick={onToggleDemo}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold border transition-all cursor-pointer ${
              isDemo
                ? 'bg-[#FAF5EB] border-[#C9A24B] text-[#8A6A1F]'
                : 'bg-[#FFFFFF] hover:bg-[#EEF2EF] border-[#D9E1DC] text-[#4A6460]'
            }`}
            title="Toggle between hardware link and synthetic physics simulator"
          >
            <span className="material-symbols-outlined text-[16px] text-[#8A6A1F]">labs</span>
            <span className="hidden md:inline">{isDemo ? 'DEMO ACTIVE' : 'DEMO'}</span>
          </button>

          {/* Details Drawer Toggle */}
          <button
            type="button"
            onClick={onOpenDetails}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#FFFFFF] hover:bg-[#EEF2EF] border border-[#D9E1DC] text-[#4A6460] hover:text-[#16322F] text-xs font-medium transition-colors cursor-pointer"
            title="View Live Telemetry Charts (Angle & Distance vs Time)"
          >
            <span className="material-symbols-outlined text-[16px]">ssid_chart</span>
            <span className="hidden lg:inline">Details</span>
          </button>

          {/* History Drawer Toggle */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#FFFFFF] hover:bg-[#EEF2EF] border border-[#D9E1DC] text-[#4A6460] hover:text-[#16322F] text-xs font-medium transition-colors cursor-pointer"
            title="View Session Run History Logs"
          >
            <span className="material-symbols-outlined text-[16px]">history_edu</span>
            <span className="hidden lg:inline">History</span>
          </button>

          {/* Settings Modal Toggle */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1.5 rounded bg-[#FFFFFF] hover:bg-[#EEF2EF] border border-[#D9E1DC] text-[#4A6460] hover:text-[#16322F] transition-colors cursor-pointer"
            title="Network & Hardware IP Configuration"
            aria-label="Settings"
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
          </button>

          {/* Reset Test Button (Primary) */}
          <button
            type="button"
            onClick={onReset}
            disabled={isResetDisabled}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-bold uppercase transition-all card-shadow border-b-2 border-[#C9A24B] cursor-pointer ${
              isResetDisabled
                ? 'bg-[#EEF2EF] text-[#8A9C98] border-[#D9E1DC] cursor-not-allowed opacity-60'
                : 'bg-[#16322F] hover:bg-[#1F433F] text-white active:scale-95'
            }`}
            title="Ease wedge back to 0° and initiate fresh baseline calibration"
          >
            <span
              className={`material-symbols-outlined text-[16px] text-[#C9A24B] ${
                isResetInFlight ? 'animate-spin' : ''
              }`}
            >
              restart_alt
            </span>
            <span>{isResetInFlight ? 'RESETTING...' : 'RESET'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

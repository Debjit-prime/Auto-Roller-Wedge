import React, { useState, useEffect } from 'react';
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
  onSaveIp: (ip: string) => void;
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
  onSaveIp,
  onOpenSettings,
  onOpenHistory,
  onOpenDetails,
}) => {
  const [inputIp, setInputIp] = useState<string>(arduinoIp);

  useEffect(() => {
    setInputIp(arduinoIp);
  }, [arduinoIp]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputIp.trim()) {
      onSaveIp(inputIp.trim());
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FFFFFF] border-b border-[#D9E1DC] card-shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand & Heading */}
        <div className="flex items-center gap-3 shrink-0">
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

        {/* Center Quick IP Bar (Visible on tablet+) */}
        <div className="hidden md:flex items-center">
          <form
            onSubmit={handleSubmit}
            className="flex items-center bg-[#EEF2EF] border border-[#D9E1DC] rounded-lg p-0.5 focus-within:ring-2 focus-within:ring-[#16322F] focus-within:border-transparent transition-all shadow-xs"
          >
            <div className="flex items-center gap-1 px-2 text-[#4A6460]">
              <span className="material-symbols-outlined text-[16px] text-[#8A6A1F]">router</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">IP:</span>
            </div>
            <input
              type="text"
              value={inputIp}
              onChange={(e) => setInputIp(e.target.value)}
              placeholder="e.g. 10.62.117.48"
              className="bg-transparent font-mono text-xs text-[#16322F] px-1.5 py-1 w-32 lg:w-36 outline-none"
              title="Enter Arduino IP to connect & run immediately"
            />
            <button
              type="submit"
              className="px-2.5 py-1 bg-[#16322F] hover:bg-[#1F433F] text-white text-[10px] font-bold uppercase rounded cursor-pointer transition-colors shadow-xs active:scale-95"
              title="Save IP and start live telemetry streaming"
            >
              {connectionState === 'connected' && !isDemo ? 'Update' : 'Connect & Run'}
            </button>
            <div className="pl-1 pr-1">
              <ConnectionPill
                state={connectionState}
                ip={arduinoIp}
                isDemo={isDemo}
                compact
                onOpenSettings={onOpenSettings}
              />
            </div>
          </form>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Mobile IP button */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="md:hidden flex items-center gap-1 px-2 py-1.5 rounded bg-[#EEF2EF] border border-[#D9E1DC] text-[#16322F] text-xs font-mono font-bold cursor-pointer"
            title="Configure Arduino IP"
          >
            <span className="material-symbols-outlined text-[16px] text-[#8A6A1F]">router</span>
            <span className="text-[11px] truncate max-w-[80px]">{arduinoIp}</span>
          </button>

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
            <span className="hidden lg:inline">{isDemo ? 'DEMO ACTIVE' : 'DEMO'}</span>
          </button>

          {/* Details Drawer Toggle */}
          <button
            type="button"
            onClick={onOpenDetails}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#FFFFFF] hover:bg-[#EEF2EF] border border-[#D9E1DC] text-[#4A6460] hover:text-[#16322F] text-xs font-medium transition-colors cursor-pointer"
            title="View Live Telemetry Charts (Angle & Distance vs Time)"
          >
            <span className="material-symbols-outlined text-[16px]">ssid_chart</span>
            <span className="hidden xl:inline">Details</span>
          </button>

          {/* History Drawer Toggle */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#FFFFFF] hover:bg-[#EEF2EF] border border-[#D9E1DC] text-[#4A6460] hover:text-[#16322F] text-xs font-medium transition-colors cursor-pointer"
            title="View Session Run History Logs"
          >
            <span className="material-symbols-outlined text-[16px]">history_edu</span>
            <span className="hidden xl:inline">History</span>
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

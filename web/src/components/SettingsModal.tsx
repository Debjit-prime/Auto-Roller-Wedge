import React, { useState } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  arduinoIp: string;
  isDemo: boolean;
  onSaveIp: (ip: string) => void;
  onToggleDemo: (demo: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  arduinoIp,
  isDemo,
  onSaveIp,
  onToggleDemo,
}) => {
  const [inputIp, setInputIp] = useState<string>(arduinoIp);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveIp(inputIp);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#16322F]/40 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="bg-[#FFFFFF] border border-[#D9E1DC] rounded-xl modal-shadow max-w-lg w-full p-4 sm:p-6 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#D9E1DC] pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded bg-[#EEF2EF] text-[#8A6A1F]">
              <span className="material-symbols-outlined text-[20px]">tune</span>
            </span>
            <div>
              <h2 id="settings-modal-title" className="font-serif text-lg font-bold text-[#16322F]">
                Hardware &amp; Network Configuration
              </h2>
              <span className="text-xs text-[#4A6460]">Arduino UNO R4 WiFi Benchmark Connection</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[#EEF2EF] text-[#4A6460] hover:text-[#16322F] transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {/* IP Input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="arduino-ip-input" className="text-xs font-bold uppercase tracking-wider text-[#4A6460]">
              Arduino IP Address / Host
            </label>
            <div className="relative">
              <input
                id="arduino-ip-input"
                type="text"
                value={inputIp}
                onChange={(e) => setInputIp(e.target.value)}
                placeholder="10.62.117.48 or 127.0.0.1:8080"
                className="w-full bg-[#EEF2EF] border border-[#D9E1DC] px-3 py-2 rounded font-mono text-sm text-[#16322F] focus:outline-none focus:ring-2 focus:ring-[#16322F]"
                disabled={isDemo}
              />
            </div>
            <span className="text-[11px] text-[#8A9C98]">
              Read the IP displayed in the Serial Monitor (115200 baud) or scrolling on the LED matrix.
            </span>
          </div>

          {/* Mode Switcher */}
          <div className="flex flex-col gap-1.5 pt-1">
            <label className="text-xs font-bold uppercase tracking-wider text-[#4A6460]">
              Operational Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onToggleDemo(false)}
                className={`py-2 px-3 rounded text-xs font-semibold border transition-all cursor-pointer ${
                  !isDemo
                    ? 'bg-[#16322F] text-white border-[#16322F]'
                    : 'bg-[#FFFFFF] hover:bg-[#EEF2EF] border-[#D9E1DC] text-[#4A6460]'
                }`}
              >
                Physical Hardware
              </button>
              <button
                type="button"
                onClick={() => onToggleDemo(true)}
                className={`py-2 px-3 rounded text-xs font-semibold border transition-all cursor-pointer ${
                  isDemo
                    ? 'bg-[#FAF5EB] text-[#8A6A1F] border-[#C9A24B] font-bold'
                    : 'bg-[#FFFFFF] hover:bg-[#EEF2EF] border-[#D9E1DC] text-[#4A6460]'
                }`}
              >
                Demo Simulator
              </button>
            </div>
          </div>

          {/* Diagnostics Specs */}
          <div className="bg-[#EEF2EF] p-3 rounded border border-[#D9E1DC] text-xs font-mono text-[#4A6460] space-y-1">
            <div className="flex justify-between">
              <span>Polling Interval:</span>
              <span className="text-[#16322F] font-bold">200 ms (Sequential)</span>
            </div>
            <div className="flex justify-between">
              <span>Request Timeout:</span>
              <span className="text-[#16322F] font-bold">1500 ms (AbortController)</span>
            </div>
            <div className="flex justify-between">
              <span>CORS Policy:</span>
              <span className="text-[#1F8A5B] font-bold">Open (* allowed)</span>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="text-[11px] text-[#4A6460] bg-[#FAF5EB] border border-[#C9A24B]/30 p-2.5 rounded">
            <strong>Important:</strong> Your browser and the Arduino must be connected to the same local WiFi network (2.4 GHz).
            Ensure router AP client isolation is disabled.
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D9E1DC]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded text-xs font-semibold text-[#4A6460] hover:bg-[#EEF2EF] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-[#16322F] hover:bg-[#1F433F] text-white text-xs font-bold uppercase transition-all card-shadow cursor-pointer"
            >
              Save &amp; Connect
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

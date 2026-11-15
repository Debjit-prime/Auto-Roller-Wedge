import React, { useState } from 'react';
import { useWedge } from './lib/useWedge';
import { TopBar } from './components/TopBar';
import { StatusBanner } from './components/StatusBanner';
import { SimulationCanvas } from './components/SimulationCanvas';
import { MetricsPanel } from './components/MetricsPanel';
import { MovementBar } from './components/MovementBar';
import { ResultCard } from './components/ResultCard';
import { HistoryTable } from './components/HistoryTable';
import { DetailDrawer } from './components/DetailDrawer';
import { SettingsModal } from './components/SettingsModal';

export const App: React.FC = () => {
  const {
    status,
    connectionState,
    history,
    telemetry,
    interpolatedAngle,
    isDemo,
    arduinoIp,
    isResetDisabled,
    isResetInFlight,
    slipAlertActive,
    buzzerActive,
    setArduinoIp,
    setIsDemo,
    triggerReset,
    clearHistory,
    deleteHistoryEntry,
  } = useWedge();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const phase = status?.phase ?? 'RESETTING';
  const distance = status?.distance ?? null;
  const initialDist = status?.initialDist ?? null;
  const slipped = status?.slipped ?? false;
  const slipAngle = status?.slipAngle ?? null;

  const isConnLost = connectionState === 'lost';

  return (
    <div className="min-h-screen bg-[#F7F8F5] text-[#16322F] flex flex-col font-sans selection:bg-[#C9A24B]/30 pb-20 sm:pb-8">
      {/* Visual Slip Flash Accent Banner */}
      {slipAlertActive && (
        <div
          className="w-full bg-[#C73A32] text-white py-1.5 px-4 text-center text-xs font-bold uppercase tracking-wider animate-in fade-in duration-200 z-50 flex items-center justify-center gap-2"
          role="alert"
        >
          <span className="material-symbols-outlined text-[18px]">alarm_on</span>
          <span>CRITICAL SLIP EVENT DETECTED — RIG FROZEN</span>
        </div>
      )}

      {/* Top Application Bar */}
      <TopBar
        connectionState={connectionState}
        arduinoIp={arduinoIp}
        isDemo={isDemo}
        isResetDisabled={isResetDisabled}
        isResetInFlight={isResetInFlight}
        onReset={triggerReset}
        onToggleDemo={() => setIsDemo(!isDemo)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(!isHistoryOpen)}
        onOpenDetails={() => setIsDetailsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1 w-full flex flex-col gap-4 sm:gap-6">
        {/* Connection Lost Friendly Banner */}
        {isConnLost && (
          <div
            className="w-full bg-[#FFF8ED] border-2 border-[#C77A12] p-3 rounded-lg flex items-center justify-between text-xs sm:text-sm card-shadow"
            role="alert"
          >
            <div className="flex items-center gap-2 text-[#C77A12]">
              <span className="material-symbols-outlined text-[20px]">cloud_off</span>
              <span className="font-semibold">
                Connection to Arduino lost at <strong className="font-mono">{arduinoIp}</strong>. Telemetry frozen. Retrying in background...
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="px-2.5 py-1 rounded bg-[#FFFFFF] border border-[#C77A12] text-[#C77A12] hover:bg-[#EEF2EF] font-bold text-xs uppercase cursor-pointer"
            >
              Configure IP
            </button>
          </div>
        )}

        {/* Experiment State Stepper Banner */}
        <StatusBanner phase={phase} angle={Math.round(interpolatedAngle)} />

        {/* Main Grid: Simulation (Left 7 cols) & Controls / Readouts (Right 5 cols) */}
        <div
          className={`grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start transition-opacity duration-300 ${
            isConnLost ? 'opacity-40 pointer-events-none' : 'opacity-100'
          }`}
        >
          {/* Left: 2D Simulation Stage */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <SimulationCanvas
              angle={interpolatedAngle}
              distance={distance}
              initialDist={initialDist}
              phase={phase}
              slipped={slipped}
            />

            {/* In-view Session Run History (Collapsible or Drawer on smaller screens) */}
            {isHistoryOpen && (
              <HistoryTable
                entries={history}
                onClose={() => setIsHistoryOpen(false)}
                onClearAll={clearHistory}
                onDeleteEntry={deleteHistoryEntry}
              />
            )}
          </div>

          {/* Right: Metrics, Movement Bar & Result Cards */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Jumbo Projector Numbers */}
            <MetricsPanel
              angle={interpolatedAngle}
              distance={distance}
              initialDist={initialDist}
              phase={phase}
            />

            {/* Displacement Movement Gauge */}
            <MovementBar
              distance={distance}
              initialDist={initialDist}
              slipTolerance={status?.slipTolerance ?? 25}
              slipped={slipped}
            />

            {/* Result Card (shown when slipped) */}
            {slipped && (
              <ResultCard
                slipAngle={slipAngle}
                buzzerActive={buzzerActive}
                isResetDisabled={isResetDisabled}
                onReset={triggerReset}
                onViewDetails={() => setIsDetailsOpen(true)}
              />
            )}
          </div>
        </div>
      </main>

      {/* Mobile Sticky Reset Button at Bottom */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 bg-[#FFFFFF] border-t border-[#D9E1DC] p-3 z-30 card-shadow flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-[#4A6460]">Live θ</span>
          <span className="font-mono text-lg font-bold text-[#16322F]">
            {interpolatedAngle.toFixed(1)}°
          </span>
        </div>
        <button
          type="button"
          onClick={triggerReset}
          disabled={isResetDisabled}
          className={`flex-1 py-2.5 px-4 rounded font-sans text-xs font-bold uppercase transition-all card-shadow border-b-2 border-[#C9A24B] flex items-center justify-center gap-2 cursor-pointer ${
            isResetDisabled
              ? 'bg-[#EEF2EF] text-[#8A9C98] border-[#D9E1DC] cursor-not-allowed'
              : 'bg-[#16322F] text-white active:scale-95'
          }`}
        >
          <span
            className={`material-symbols-outlined text-[16px] text-[#C9A24B] ${
              isResetInFlight ? 'animate-spin' : ''
            }`}
          >
            restart_alt
          </span>
          <span>{isResetInFlight ? 'RESETTING RIG...' : 'RESET BENCH (0°)'}</span>
        </button>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        arduinoIp={arduinoIp}
        isDemo={isDemo}
        onSaveIp={setArduinoIp}
        onToggleDemo={setIsDemo}
      />

      {/* Live Telemetry Detail Drawer */}
      <DetailDrawer
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        telemetry={telemetry}
        initialDist={initialDist}
        currentDist={distance}
        currentAngle={interpolatedAngle}
      />
    </div>
  );
};

export default App;

import React from 'react';
import type { ConnectionState } from '../lib/types';

interface ConnectionPillProps {
  state: ConnectionState;
  ip: string;
  isDemo: boolean;
  compact?: boolean;
  onOpenSettings?: () => void;
}

export const ConnectionPill: React.FC<ConnectionPillProps> = ({
  state,
  ip,
  isDemo,
  compact = false,
  onOpenSettings,
}) => {
  let dotColor = 'bg-[#8A9C98]';
  let badgeText = ip;
  let statusText = 'DISCONNECTED';
  let containerBg = 'bg-[#EEF2EF]';
  let textColor = 'text-[#16322F]';
  let pulse = false;

  if (isDemo) {
    dotColor = 'bg-[#C9A24B]';
    badgeText = 'DEMO SIMULATOR';
    statusText = 'OFFLINE MODE';
    containerBg = 'bg-[#FAF5EB]';
    textColor = 'text-[#8A6A1F]';
  } else if (state === 'connected') {
    dotColor = 'bg-[#1F8A5B]';
    statusText = 'LIVE';
    containerBg = 'bg-[#EEF2EF]';
    textColor = 'text-[#16322F]';
    pulse = true;
  } else if (state === 'connecting') {
    dotColor = 'bg-[#C77A12]';
    statusText = 'CONNECTING...';
    containerBg = 'bg-[#FFF8ED]';
    textColor = 'text-[#C77A12]';
    pulse = true;
  } else if (state === 'lost') {
    dotColor = 'bg-[#C73A32]';
    statusText = 'LINK LOST';
    containerBg = 'bg-[#FBEBEB]';
    textColor = 'text-[#C73A32]';
    pulse = true;
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={onOpenSettings}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border border-[#D9E1DC] ${containerBg} ${textColor} hover:brightness-95 transition-all cursor-pointer`}
        title="Click to view network diagnostics"
        aria-label={`Connection status: ${statusText}`}
      >
        <span className="relative flex h-2 w-2">
          {pulse && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
        </span>
        <span>{statusText}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpenSettings}
      className={`inline-flex items-center gap-2 px-3 py-1 rounded text-xs font-mono tabular-nums border border-[#D9E1DC] ${containerBg} ${textColor} hover:brightness-95 transition-all cursor-pointer`}
      title="Click to configure IP or toggle demo mode"
      aria-label={`Connection status: ${statusText}, Target: ${badgeText}`}
    >
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
      </span>
      <span className="font-semibold">{badgeText}</span>
      <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">[{statusText}]</span>
    </button>
  );
};

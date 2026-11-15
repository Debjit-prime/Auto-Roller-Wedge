export type Phase = 'RESETTING' | 'PLACE_BLOCK' | 'RUNNING' | 'SLIPPED';

export interface WedgeStatus {
  angle: number;
  distance: number | null;
  initialDist: number | null;
  slipped: boolean;
  slipAngle: number | null;
  phase: Phase;
  maxAngle: number;
  slipTolerance: number;
  uptimeMs: number;
}

export interface ResetResponse {
  ok: boolean;
  reason?: string;
}

export type ConnectionState = 'connected' | 'connecting' | 'lost' | 'disconnected';

export interface HistoryEntry {
  id: number;
  slipAngle: number;
  mu: number;
  displacement: number;
  timestamp: string;
}

export interface TelemetryPoint {
  timestamp: number; // seconds offset or relative ms
  angle: number;
  distance: number | null;
  isSlip?: boolean;
}

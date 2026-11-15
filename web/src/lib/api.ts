import type { WedgeStatus, ResetResponse, Phase } from './types';

const VALID_PHASES: Phase[] = ['RESETTING', 'PLACE_BLOCK', 'RUNNING', 'SLIPPED'];

/**
 * Validates that an arbitrary response object strictly matches the WedgeStatus shape contract.
 */
export function validateStatus(data: unknown): data is WedgeStatus {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const s = data as Record<string, unknown>;

  if (typeof s.angle !== 'number' || Number.isNaN(s.angle)) {
    return false;
  }

  if (s.distance !== null && (typeof s.distance !== 'number' || Number.isNaN(s.distance))) {
    return false;
  }

  if (s.initialDist !== null && (typeof s.initialDist !== 'number' || Number.isNaN(s.initialDist))) {
    return false;
  }

  if (typeof s.slipped !== 'boolean') {
    return false;
  }

  if (s.slipAngle !== null && (typeof s.slipAngle !== 'number' || Number.isNaN(s.slipAngle))) {
    return false;
  }

  if (typeof s.phase !== 'string' || !VALID_PHASES.includes(s.phase as Phase)) {
    return false;
  }

  if (typeof s.maxAngle !== 'number' || Number.isNaN(s.maxAngle)) {
    return false;
  }

  if (typeof s.slipTolerance !== 'number' || Number.isNaN(s.slipTolerance)) {
    return false;
  }

  if (typeof s.uptimeMs !== 'number' || Number.isNaN(s.uptimeMs)) {
    return false;
  }

  return true;
}

/**
 * Normalizes host/IP string to prevent duplicate protocols or trailing slashes.
 */
export function normalizeBaseUrl(ipOrHost: string): string {
  let cleaned = ipOrHost.trim();
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = `http://${cleaned}`;
  }
  return cleaned.replace(/\/+$/, '');
}

/**
 * Polls the Arduino /status endpoint with an AbortController timeout.
 */
export async function fetchStatus(ipOrHost: string, externalSignal?: AbortSignal): Promise<WedgeStatus> {
  const baseUrl = normalizeBaseUrl(ipOrHost);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1500);

  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    externalSignal.addEventListener('abort', onExternalAbort);
  }

  try {
    const res = await fetch(`${baseUrl}/status`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();
    if (!validateStatus(json)) {
      throw new Error('Invalid telemetry payload shape received from Arduino');
    }

    return json;
  } finally {
    clearTimeout(timeoutId);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
  }
}

/**
 * Dispatches a POST /reset call to the Arduino.
 */
export async function sendReset(ipOrHost: string): Promise<ResetResponse> {
  const baseUrl = normalizeBaseUrl(ipOrHost);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000);

  try {
    const res = await fetch(`${baseUrl}/reset`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    return {
      ok: Boolean(data.ok),
      reason: data.reason ? String(data.reason) : undefined,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Calculates the coefficient of static friction:
 * μs = tan(θ) where θ is converted from degrees to radians.
 * Result rounded to 3 decimal places.
 */
export function calculateMu(angleDegrees: number): number {
  if (angleDegrees < 0) return 0;
  const radians = (angleDegrees * Math.PI) / 180;
  const mu = Math.tan(radians);
  return Math.round(mu * 1000) / 1000;
}

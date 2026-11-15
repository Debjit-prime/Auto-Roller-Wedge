import { describe, it, expect } from 'vitest';
import { validateStatus, calculateMu, normalizeBaseUrl } from '../lib/api';
import type { WedgeStatus } from '../lib/types';

describe('API Client & Validation', () => {
  const validStatus: WedgeStatus = {
    angle: 27,
    distance: 182,
    initialDist: 170,
    slipped: true,
    slipAngle: 27,
    phase: 'SLIPPED',
    maxAngle: 60,
    slipTolerance: 25,
    uptimeMs: 145000,
  };

  it('validates a complete, valid WedgeStatus response payload', () => {
    expect(validateStatus(validStatus)).toBe(true);
  });

  it('accepts null distance when HC-SR04 returns NO_ECHO', () => {
    const statusWithNullDist = {
      ...validStatus,
      distance: null,
    };
    expect(validateStatus(statusWithNullDist)).toBe(true);
  });

  it('accepts null initialDist prior to baseline establishment', () => {
    const statusWithNullInitial = {
      ...validStatus,
      initialDist: null,
      phase: 'RESETTING',
      slipped: false,
      slipAngle: null,
    };
    expect(validateStatus(statusWithNullInitial)).toBe(true);
  });

  it('rejects payloads missing required fields', () => {
    const missingAngle = {
      distance: 180,
      phase: 'RUNNING',
    };
    expect(validateStatus(missingAngle)).toBe(false);
  });

  it('rejects invalid phase values', () => {
    const invalidPhase = {
      ...validStatus,
      phase: 'UNKNOWN_PHASE',
    };
    expect(validateStatus(invalidPhase)).toBe(false);
  });

  it('rejects non-numeric angle or uptimeMs', () => {
    const badTypes = {
      ...validStatus,
      angle: '27', // string instead of number
    };
    expect(validateStatus(badTypes)).toBe(false);
  });

  it('normalizes hostnames and IP strings correctly', () => {
    expect(normalizeBaseUrl('192.168.4.105')).toBe('http://192.168.4.105');
    expect(normalizeBaseUrl('http://192.168.4.105/')).toBe('http://192.168.4.105');
    expect(normalizeBaseUrl('127.0.0.1:8080')).toBe('http://127.0.0.1:8080');
  });

  it('computes static friction coefficient μs = tan(θ) to 3 decimal places', () => {
    expect(calculateMu(0)).toBe(0);
    expect(calculateMu(45)).toBe(1.0);
    expect(calculateMu(30)).toBe(0.577);
    expect(calculateMu(27.4)).toBe(0.518);
  });
});

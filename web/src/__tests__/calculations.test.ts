import { describe, it, expect } from 'vitest';
import { calculateMu } from '../lib/api';

describe('Physics & Telemetry Calculations', () => {
  it('correctly calculates μs across key standard physics benchmark angles', () => {
    // tan(0) = 0
    expect(calculateMu(0)).toBe(0);

    // tan(15°) = 0.2679... -> 0.268
    expect(calculateMu(15)).toBe(0.268);

    // tan(26.8°) = 0.5050... -> 0.505
    expect(calculateMu(26.8)).toBe(0.505);

    // tan(27.4°) = 0.5183... -> 0.518
    expect(calculateMu(27.4)).toBe(0.518);

    // tan(30°) = 0.5773... -> 0.577
    expect(calculateMu(30)).toBe(0.577);

    // tan(45°) = 1.000
    expect(calculateMu(45)).toBe(1.0);

    // tan(60°) = 1.7320... -> 1.732
    expect(calculateMu(60)).toBe(1.732);
  });

  it('computes displacement delta correctly with null safety', () => {
    const calcDelta = (dist: number | null, init: number | null) => {
      if (dist === null || init === null) return null;
      return Math.round(Math.abs(dist - init) * 10) / 10;
    };

    expect(calcDelta(null, 170)).toBe(null);
    expect(calcDelta(182.4, null)).toBe(null);
    expect(calcDelta(182.4, 170.6)).toBe(11.8);
    expect(calcDelta(170.6, 170.6)).toBe(0);
    expect(calcDelta(160.0, 170.0)).toBe(10.0);
  });

  it('evaluates slip condition according to tolerance', () => {
    const isSlipTriggered = (dist: number | null, init: number | null, tolerance = 25) => {
      if (dist === null || init === null) return false;
      return Math.abs(dist - init) >= tolerance;
    };

    expect(isSlipTriggered(170, 170)).toBe(false);
    expect(isSlipTriggered(194.9, 170)).toBe(false);
    expect(isSlipTriggered(195.0, 170)).toBe(true);
    expect(isSlipTriggered(198.4, 170.0)).toBe(true);
    expect(isSlipTriggered(null, 170)).toBe(false);
  });
});

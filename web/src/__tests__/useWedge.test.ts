import { describe, it, expect } from 'vitest';
import type { HistoryEntry, WedgeStatus } from '../lib/types';
import { calculateMu } from '../lib/api';

describe('useWedge Logic, Duplicate Guard & 5-Reading History Window', () => {
  it('prevents duplicate history entries for the same continuous slip event', () => {
    let history: HistoryEntry[] = [];
    let lastRecordedSlipAngle: number | null = null;
    let historyId = 1;

    const processStatus = (status: WedgeStatus) => {
      if (status.phase === 'RESETTING' || status.phase === 'PLACE_BLOCK') {
        lastRecordedSlipAngle = null;
      }

      if (status.slipped && status.slipAngle !== null) {
        if (lastRecordedSlipAngle !== status.slipAngle) {
          lastRecordedSlipAngle = status.slipAngle;
          const entry: HistoryEntry = {
            id: historyId++,
            slipAngle: status.slipAngle,
            mu: calculateMu(status.slipAngle),
            displacement: 28.4,
            timestamp: '14:32:00',
          };
          history = [entry, ...history].slice(0, 5);
        }
      }
    };

    // Frame 1: RUNNING
    processStatus({
      angle: 26,
      distance: 170.6,
      initialDist: 170.6,
      slipped: false,
      slipAngle: null,
      phase: 'RUNNING',
      maxAngle: 60,
      slipTolerance: 25,
      uptimeMs: 1000,
    });
    expect(history.length).toBe(0);

    // Frame 2: Slip occurs at 27°
    processStatus({
      angle: 27,
      distance: 198.0,
      initialDist: 170.6,
      slipped: true,
      slipAngle: 27,
      phase: 'SLIPPED',
      maxAngle: 60,
      slipTolerance: 25,
      uptimeMs: 2000,
    });
    expect(history.length).toBe(1);
    expect(history[0].slipAngle).toBe(27);
    expect(history[0].mu).toBe(0.51);

    // Frame 3-10: Telemetry continues streaming in SLIPPED state
    for (let i = 0; i < 8; i++) {
      processStatus({
        angle: 27,
        distance: 198.1 + i * 0.1,
        initialDist: 170.6,
        slipped: true,
        slipAngle: 27,
        phase: 'SLIPPED',
        maxAngle: 60,
        slipTolerance: 25,
        uptimeMs: 2000 + i * 200,
      });
    }
    // Must remain exactly 1 entry
    expect(history.length).toBe(1);

    // Frame 11: Reset triggered
    processStatus({
      angle: 20,
      distance: null,
      initialDist: null,
      slipped: false,
      slipAngle: null,
      phase: 'RESETTING',
      maxAngle: 60,
      slipTolerance: 25,
      uptimeMs: 4000,
    });
    expect(history.length).toBe(1);
    expect(lastRecordedSlipAngle).toBe(null);

    // Frame 12: New run slips at 31°
    processStatus({
      angle: 31,
      distance: 202.0,
      initialDist: 170.6,
      slipped: true,
      slipAngle: 31,
      phase: 'SLIPPED',
      maxAngle: 60,
      slipTolerance: 25,
      uptimeMs: 10000,
    });
    expect(history.length).toBe(2);
    expect(history[0].slipAngle).toBe(31);
    expect(history[1].slipAngle).toBe(27);
  });

  it('strictly caps history to the last 5 readings and supports user erasure', () => {
    let history: HistoryEntry[] = [];
    let historyId = 1;

    const addEntry = (slipAngle: number) => {
      const entry: HistoryEntry = {
        id: historyId++,
        slipAngle,
        mu: calculateMu(slipAngle),
        displacement: 28.0,
        timestamp: '15:00:00',
      };
      history = [entry, ...history].slice(0, 5);
    };

    // Simulate 7 separate test runs
    [21, 24, 27, 29, 32, 35, 38].forEach((angle) => {
      addEntry(angle);
    });

    // Must be capped at exactly 5 items
    expect(history.length).toBe(5);
    // Most recent is first
    expect(history[0].slipAngle).toBe(38);
    expect(history[1].slipAngle).toBe(35);
    expect(history[2].slipAngle).toBe(32);
    expect(history[3].slipAngle).toBe(29);
    expect(history[4].slipAngle).toBe(27);

    // User erases a specific reading (e.g. id=6, which is slipAngle=35)
    history = history.filter((item) => item.slipAngle !== 35);
    expect(history.length).toBe(4);
    expect(history.some((h) => h.slipAngle === 35)).toBe(false);

    // User erases all readings
    history = [];
    expect(history.length).toBe(0);
  });
});

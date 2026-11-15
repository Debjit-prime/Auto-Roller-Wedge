import { useState, useEffect, useRef, useCallback } from 'react';
import type { WedgeStatus, ConnectionState, HistoryEntry, TelemetryPoint } from './types';
import { fetchStatus, sendReset, calculateMu } from './api';
import { DemoSimulator } from './demo';

const LOCAL_STORAGE_IP_KEY = 'auto_roller_wedge_arduino_ip';
const LOCAL_STORAGE_DEMO_KEY = 'auto_roller_wedge_is_demo';
const DEFAULT_IP = '10.62.117.48';

export function useWedge() {
  const [arduinoIp, setArduinoIpState] = useState<string>(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_IP_KEY);
    if (!stored || stored === '10.62.117.177' || stored === '192.168.4.105') {
      localStorage.setItem(LOCAL_STORAGE_IP_KEY, DEFAULT_IP);
      return DEFAULT_IP;
    }
    return stored;
  });

  const [isDemo, setIsDemoState] = useState<boolean>(() => {
    return localStorage.getItem(LOCAL_STORAGE_DEMO_KEY) === 'true';
  });

  const [status, setStatus] = useState<WedgeStatus | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isResetInFlight, setIsResetInFlight] = useState<boolean>(false);
  const [interpolatedAngle, setInterpolatedAngle] = useState<number>(0);
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>([]);
  const [slipAlertActive, setSlipAlertActive] = useState<boolean>(false);
  const [buzzerActive, setBuzzerActive] = useState<boolean>(false);

  // References for non-state internals
  const demoSimulatorRef = useRef<DemoSimulator | null>(null);
  const consecutiveFailuresRef = useRef<number>(0);
  const isPollingRef = useRef<boolean>(false);
  const unmountedRef = useRef<boolean>(false);
  const lastRecordedSlipAngleRef = useRef<number | null>(null);
  const historyCounterRef = useRef<number>(1);
  const targetAngleRef = useRef<number>(0);
  const currentAngleRef = useRef<number>(0);

  // Initialize demo simulator if needed
  if (isDemo && !demoSimulatorRef.current) {
    demoSimulatorRef.current = new DemoSimulator();
  }

  const setArduinoIp = useCallback((ip: string) => {
    const clean = ip.trim();
    localStorage.setItem(LOCAL_STORAGE_IP_KEY, clean);
    setArduinoIpState(clean);
    consecutiveFailuresRef.current = 0;
    setConnectionState('connecting');
  }, []);

  const setIsDemo = useCallback((demo: boolean) => {
    localStorage.setItem(LOCAL_STORAGE_DEMO_KEY, demo ? 'true' : 'false');
    setIsDemoState(demo);
    consecutiveFailuresRef.current = 0;
    setConnectionState('connecting');
    if (demo && !demoSimulatorRef.current) {
      demoSimulatorRef.current = new DemoSimulator();
    }
  }, []);

  // Smooth angle interpolation at ~60fps
  useEffect(() => {
    let animId: number;
    const animate = () => {
      const target = targetAngleRef.current;
      const current = currentAngleRef.current;
      const diff = target - current;

      if (Math.abs(diff) > 0.01) {
        // Smoothly interpolate ~12% per frame (approx 60fps)
        const step = diff * 0.14;
        currentAngleRef.current = current + step;
      } else {
        currentAngleRef.current = target;
      }

      setInterpolatedAngle(Math.round(currentAngleRef.current * 10) / 10);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Process newly received status
  const handleNewStatus = useCallback((newStatus: WedgeStatus) => {
    setStatus(newStatus);
    targetAngleRef.current = newStatus.angle;

    // Reset history slip lock when test resets to 0 or running anew
    if (newStatus.phase === 'RESETTING' || newStatus.phase === 'PLACE_BLOCK') {
      lastRecordedSlipAngleRef.current = null;
    }

    // Slip event detection & one-time history recording
    if (newStatus.slipped && newStatus.slipAngle !== null) {
      if (lastRecordedSlipAngleRef.current !== newStatus.slipAngle) {
        lastRecordedSlipAngleRef.current = newStatus.slipAngle;

        const mu = calculateMu(newStatus.slipAngle);
        const displacement =
          newStatus.distance !== null && newStatus.initialDist !== null
            ? Math.round(Math.abs(newStatus.distance - newStatus.initialDist) * 10) / 10
            : 11.8;

        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

        const entry: HistoryEntry = {
          id: historyCounterRef.current++,
          slipAngle: newStatus.slipAngle,
          mu,
          displacement,
          timestamp: timeStr,
        };

        // Enforce maximum of last 5 readings only
        setHistory((prev) => [entry, ...prev].slice(0, 5));

        // Trigger slip feedback: visual banner + buzzer ring icon for ~500ms
        setSlipAlertActive(true);
        setBuzzerActive(true);
        setTimeout(() => {
          setBuzzerActive(false);
        }, 600);
        setTimeout(() => {
          setSlipAlertActive(false);
        }, 1200);
      }
    }

    // Telemetry log buffer (keep last 60 data points)
    setTelemetry((prev) => {
      const point: TelemetryPoint = {
        timestamp: Date.now(),
        angle: newStatus.angle,
        distance: newStatus.distance,
        isSlip: newStatus.slipped,
      };
      const updated = [...prev, point];
      if (updated.length > 90) updated.shift();
      return updated;
    });
  }, []);

  // Main polling loop (200ms intervals, non-overlapping)
  useEffect(() => {
    unmountedRef.current = false;
    let timerId: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      if (unmountedRef.current) return;
      if (isPollingRef.current) return;

      isPollingRef.current = true;

      try {
        if (isDemo) {
          if (!demoSimulatorRef.current) {
            demoSimulatorRef.current = new DemoSimulator();
          }
          const demoStatus = demoSimulatorRef.current.getStatus();
          handleNewStatus(demoStatus);
          setConnectionState('connected');
          consecutiveFailuresRef.current = 0;
        } else {
          const liveStatus = await fetchStatus(arduinoIp);
          if (!unmountedRef.current) {
            handleNewStatus(liveStatus);
            setConnectionState('connected');
            consecutiveFailuresRef.current = 0;
          }
        }
      } catch {
        if (!unmountedRef.current) {
          consecutiveFailuresRef.current += 1;
          if (consecutiveFailuresRef.current >= 3) {
            setConnectionState('lost');
          } else {
            setConnectionState('connecting');
          }
        }
      } finally {
        isPollingRef.current = false;
        if (!unmountedRef.current) {
          // Dynamic poll delay: 200ms when connected, backoff up to 2000ms if lost
          const delay =
            consecutiveFailuresRef.current >= 3
              ? Math.min(2000, 500 * (consecutiveFailuresRef.current - 2))
              : 200;
          timerId = setTimeout(poll, delay);
        }
      }
    };

    poll();

    return () => {
      unmountedRef.current = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [arduinoIp, isDemo, handleNewStatus]);

  // Trigger physical reset sequence
  const triggerReset = useCallback(async () => {
    if (isResetInFlight) return;
    if (status && (status.phase === 'RESETTING' || status.phase === 'PLACE_BLOCK')) {
      return;
    }

    setIsResetInFlight(true);
    try {
      if (isDemo && demoSimulatorRef.current) {
        demoSimulatorRef.current.reset();
      } else {
        await sendReset(arduinoIp);
      }
    } catch (err) {
      console.error('Failed to trigger reset:', err);
    } finally {
      setTimeout(() => {
        setIsResetInFlight(false);
      }, 500);
    }
  }, [arduinoIp, isDemo, isResetInFlight, status]);

  const isResetDisabled =
    isResetInFlight ||
    (status !== null && (status.phase === 'RESETTING' || status.phase === 'PLACE_BLOCK'));

  // Erase all session history readings
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  // Erase a specific history entry by id
  const deleteHistoryEntry = useCallback((id: number) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return {
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
  };
}

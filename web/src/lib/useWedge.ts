import { useState, useEffect, useRef, useCallback } from 'react';
import type { WedgeStatus, ConnectionState, HistoryEntry, TelemetryPoint } from './types';
import { fetchStatus, sendReset, calculateMu } from './api';
import { DemoSimulator } from './demo';

const LOCAL_STORAGE_IP_KEY = 'auto_roller_wedge_arduino_ip';
const LOCAL_STORAGE_DEMO_KEY = 'auto_roller_wedge_is_demo';
const DEFAULT_IP = '10.62.117.48';

/**
 * Robustly extracts the Arduino IP with priority:
 * 1. URL search params (?ip=... or ?arduino=... or ?host=...)
 * 2. Bare IP in URL search (?10.62.117.48)
 * 3. URL hash (#ip=... or #10.62.117.48)
 * 4. LocalStorage (migrating stale legacy IPs)
 * 5. Default fallback IP
 */
export function resolveArduinoIp(
  searchString?: string,
  hashString?: string,
  storedIp?: string | null
): string {
  // 1. Check URL search query
  if (searchString) {
    const cleanSearch = searchString.startsWith('?') ? searchString : `?${searchString}`;
    const params = new URLSearchParams(cleanSearch);
    const urlIp = params.get('ip') || params.get('arduino') || params.get('host');
    if (urlIp && urlIp.trim()) {
      return urlIp.trim();
    }
    const rawSearch = cleanSearch.replace(/^\?/, '').trim();
    if (/^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/.test(rawSearch)) {
      return rawSearch;
    }
  }

  // 2. Check URL hash
  if (hashString) {
    const cleanHash = hashString.replace(/^#/, '').trim();
    const hashParams = new URLSearchParams(cleanHash);
    const hashIp = hashParams.get('ip') || hashParams.get('arduino') || hashParams.get('host');
    if (hashIp && hashIp.trim()) {
      return hashIp.trim();
    }
    if (/^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/.test(cleanHash)) {
      return cleanHash;
    }
  }

  // 3. Stored localStorage IP
  if (storedIp && storedIp.trim()) {
    const cleanStored = storedIp.trim();
    if (cleanStored !== '10.62.117.177' && cleanStored !== '192.168.4.105') {
      return cleanStored;
    }
  }

  return DEFAULT_IP;
}

/**
 * Checks whether an explicit IP was provided via URL query or hash.
 */
export function hasUrlProvidedIp(searchString?: string, hashString?: string): boolean {
  if (searchString) {
    const cleanSearch = searchString.startsWith('?') ? searchString : `?${searchString}`;
    const params = new URLSearchParams(cleanSearch);
    if (params.get('ip') || params.get('arduino') || params.get('host')) return true;
    const rawSearch = cleanSearch.replace(/^\?/, '').trim();
    if (/^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/.test(rawSearch)) return true;
  }
  if (hashString) {
    const cleanHash = hashString.replace(/^#/, '').trim();
    const hashParams = new URLSearchParams(cleanHash);
    if (hashParams.get('ip') || hashParams.get('arduino') || hashParams.get('host')) return true;
    if (/^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/.test(cleanHash)) return true;
  }
  return false;
}

function getInitialIp(): string {
  const search = typeof window !== 'undefined' ? window.location.search : '';
  const hash = typeof window !== 'undefined' ? window.location.hash : '';
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(LOCAL_STORAGE_IP_KEY);
  } catch {}

  const ip = resolveArduinoIp(search, hash, stored);
  try {
    localStorage.setItem(LOCAL_STORAGE_IP_KEY, ip);
  } catch {}
  return ip;
}

export function useWedge() {
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const [arduinoIp, setArduinoIpState] = useState<string>(getInitialIp);

  const [isDemo, setIsDemoState] = useState<boolean>(() => {
    // If an explicit IP was provided via URL query or hash, prioritize live hardware over demo
    if (typeof window !== 'undefined') {
      if (hasUrlProvidedIp(window.location.search, window.location.hash)) {
        return false;
      }
    }
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
    if (!clean) return;

    try {
      localStorage.setItem(LOCAL_STORAGE_IP_KEY, clean);
      localStorage.setItem(LOCAL_STORAGE_DEMO_KEY, 'false');
    } catch {}

    // Automatically update the browser URL query parameter (?ip=...) so it can be shared or refreshed directly
    if (typeof window !== 'undefined' && window.history) {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('ip', clean);
        window.history.replaceState({}, '', url.toString());
      } catch {}
    }

    setArduinoIpState(clean);
    setIsDemoState(false); // When an IP is given, immediately run live hardware mode
    consecutiveFailuresRef.current = 0;
    setConnectionState('connecting');
  }, []);

  // Listen for browser navigation changes to the query param
  useEffect(() => {
    const onPopState = () => {
      if (typeof window !== 'undefined' && window.location.search) {
        const params = new URLSearchParams(window.location.search);
        const urlIp = params.get('ip') || params.get('arduino') || params.get('host');
        if (urlIp && urlIp.trim() && urlIp.trim() !== arduinoIp) {
          setArduinoIp(urlIp.trim());
        }
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [arduinoIp, setArduinoIp]);

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
    isHttps,
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

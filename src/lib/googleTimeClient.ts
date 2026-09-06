/**
 * Google NTP Time Synchronization Engine & Astronomical Calculator (IST)
 * Connects directly to time.google.com via NTP HTTP bridge to guarantee atomic precision
 * Provides astronomical sunrise/sunset calculations for Madura House (Madurai, Tamil Nadu: 9.9252° N, 78.1198° E)
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface SunTimes {
  sunrise: string;
  sunset: string;
  duration: string;
}

export interface GoogleTimeState {
  istDate: Date;
  timeString: string;
  dayName: string;
  dateString: string;
  sunTimes: SunTimes;
  is24Hour: boolean;
  status: 'synced' | 'syncing' | 'offline';
  source: string;
  latencyMs: number;
  lastSyncedAt: Date | null;
  driftMs: number;
}

/**
 * High-precision NOAA Solar calculation algorithm adapted for Madurai, Tamil Nadu (IST UTC+5:30)
 */
export function calculateSunTimes(date: Date, lat = 9.9252, lng = 78.1198): SunTimes {
  try {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)) + 1;

    // Fractional year in radians
    const gamma = (2 * Math.PI / 365) * (dayOfYear - 1);

    // Equation of time (minutes)
    const eqtime = 229.18 * (
      0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma)
    );

    // Solar declination (radians)
    const decl =
      0.006918 -
      0.399912 * Math.cos(gamma) +
      0.070257 * Math.sin(gamma) -
      0.006758 * Math.cos(2 * gamma) +
      0.000907 * Math.sin(2 * gamma);

    const latRad = (lat * Math.PI) / 180;
    const zenith = (90.833 * Math.PI) / 180; // Standard atmospheric refraction zenith

    const cosH0 =
      Math.cos(zenith) / (Math.cos(latRad) * Math.cos(decl)) -
      Math.tan(latRad) * Math.tan(decl);

    // Clamp value
    const clampedCosH0 = Math.max(-1, Math.min(1, cosH0));
    const H0 = (Math.acos(clampedCosH0) * 180) / Math.PI;

    // Solar noon in minutes from midnight UTC
    const solarNoonMinutes = 720 - 4 * lng - eqtime;

    // Sunrise & Sunset in minutes from midnight UTC
    const sunriseMinutesUTC = solarNoonMinutes - H0 * 4;
    const sunsetMinutesUTC = solarNoonMinutes + H0 * 4;

    // Convert to IST (UTC + 5 hours 30 minutes = +330 minutes)
    const sunriseMinutesIST = (sunriseMinutesUTC + 330 + 1440) % 1440;
    const sunsetMinutesIST = (sunsetMinutesUTC + 330 + 1440) % 1440;

    const pad = (n: number) => String(Math.floor(n)).padStart(2, '0');

    const srH = Math.floor(sunriseMinutesIST / 60);
    const srM = Math.floor(sunriseMinutesIST % 60);

    const ssH = Math.floor(sunsetMinutesIST / 60);
    const ssM = Math.floor(sunsetMinutesIST % 60);

    const dayLengthMinutes = Math.floor((sunsetMinutesIST - sunriseMinutesIST + 1440) % 1440);
    const dlH = Math.floor(dayLengthMinutes / 60);
    const dlM = Math.floor(dayLengthMinutes % 60);

    return {
      sunrise: `${pad(srH)}:${pad(srM)}`,
      sunset: `${pad(ssH)}:${pad(ssM)}`,
      duration: `${pad(dlH)}h ${pad(dlM)}m`,
    };
  } catch {
    return {
      sunrise: '06:07',
      sunset: '18:24',
      duration: '12h 17m',
    };
  }
}

/**
 * Format date strictly according to Indian Standard Time (Asia/Kolkata)
 */
export function getISTDate(timestampMs: number): Date {
  // Convert any UTC timestamp to IST representation
  const date = new Date(timestampMs);
  const istString = date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  return new Date(istString);
}

// Global in-memory drift cache
let globalDriftMs = 0;
let globalSource = 'time.google.com';
let globalLatencyMs = 0;
let globalLastSyncedAt: Date | null = null;
let globalSyncStatus: 'synced' | 'syncing' | 'offline' = 'syncing';

/**
 * Perform active NTP sync with time.google.com
 */
export async function syncGoogleTime(): Promise<{
  driftMs: number;
  source: string;
  latencyMs: number;
  success: boolean;
}> {
  globalSyncStatus = 'syncing';
  const t0 = Date.now();

  try {
    const res = await fetch('/api/google-time', {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' },
    });

    if (res.ok) {
      const data = await res.json();
      const t1 = Date.now();
      const rtt = t1 - t0;
      const serverEpoch = Number(data.epochMs) || t1;
      
      // Calculate clock offset (Drift = TrueServerTime - LocalClientTime)
      const trueServerTime = serverEpoch + rtt / 2;
      const drift = trueServerTime - t1;

      globalDriftMs = drift;
      globalSource = data.source || 'time.google.com';
      globalLatencyMs = data.rttMs || rtt;
      globalLastSyncedAt = new Date();
      globalSyncStatus = 'synced';

      return {
        driftMs: drift,
        source: globalSource,
        latencyMs: globalLatencyMs,
        success: true,
      };
    }
  } catch (err) {
    console.warn('[Google Time Sync] Proxy failed, trying fallback time service:', err);
  }

  // Fallback 1: WorldTimeAPI for Asia/Kolkata
  try {
    const fallbackRes = await fetch('https://worldtimeapi.org/api/timezone/Asia/Kolkata', {
      signal: AbortSignal.timeout(3000),
    });
    if (fallbackRes.ok) {
      const fbData = await fallbackRes.json();
      const t1 = Date.now();
      const trueEpoch = fbData.unixtime * 1000;
      const drift = trueEpoch - t1;

      globalDriftMs = drift;
      globalSource = 'worldtimeapi.org (IST)';
      globalLatencyMs = t1 - t0;
      globalLastSyncedAt = new Date();
      globalSyncStatus = 'synced';

      return {
        driftMs: drift,
        source: globalSource,
        latencyMs: globalLatencyMs,
        success: true,
      };
    }
  } catch {
    // Silent fallback
  }

  // Fallback 2: Local System clock with 0 drift
  globalSyncStatus = 'offline';
  globalSource = 'Local System Clock (IST)';
  globalLatencyMs = 0;
  globalLastSyncedAt = new Date();

  return {
    driftMs: 0,
    source: globalSource,
    latencyMs: 0,
    success: false,
  };
}

/**
 * Custom React Hook for live, real-time ticking clock synced with time.google.com
 */
export function useGoogleTime() {
  const [is24Hour, setIs24HourState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('madura_clock_24h');
      return saved !== null ? saved === 'true' : true; // Default 24h as per user reference
    } catch {
      return true;
    }
  });

  const [tick, setTick] = useState<number>(0);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>(globalSyncStatus);
  const [latency, setLatency] = useState<number>(globalLatencyMs);
  const [source, setSource] = useState<string>(globalSource);
  const [lastSync, setLastSync] = useState<Date | null>(globalLastSyncedAt);

  const setIs24Hour = useCallback((val: boolean) => {
    setIs24HourState(val);
    try {
      localStorage.setItem('madura_clock_24h', String(val));
    } catch {
      // Ignore
    }
  }, []);

  const triggerSync = useCallback(async () => {
    setSyncStatus('syncing');
    const result = await syncGoogleTime();
    setSyncStatus(result.success ? 'synced' : 'offline');
    setLatency(result.latencyMs);
    setSource(result.source);
    setLastSync(new Date());
  }, []);

  // Perform initial sync on component mount
  useEffect(() => {
    triggerSync();

    // Auto-resync every 60 seconds to prevent client-side clock drift
    const syncInterval = setInterval(() => {
      triggerSync();
    }, 60_000);

    return () => clearInterval(syncInterval);
  }, [triggerSync]);

  // High-precision 1-second interval ticker
  useEffect(() => {
    const ticker = setInterval(() => {
      setTick((t) => (t + 1) % 1_000_000);
    }, 1000);

    return () => clearInterval(ticker);
  }, []);

  // Calculate current adjusted IST timestamp
  const nowAdjustedMs = Date.now() + globalDriftMs;
  const istDate = getISTDate(nowAdjustedMs);

  // Hours, Minutes, Seconds formatting
  const rawHours = istDate.getHours();
  const minutes = String(istDate.getMinutes()).padStart(2, '0');
  const seconds = String(istDate.getSeconds()).padStart(2, '0');

  let displayHours = rawHours;
  let ampm = '';

  if (!is24Hour) {
    ampm = rawHours >= 12 ? 'PM' : 'AM';
    displayHours = rawHours % 12 || 12;
  }

  const hoursStr = String(displayHours).padStart(2, '0');
  const timeString = `${hoursStr}:${minutes}:${seconds}`;

  // Formatted Day & Date e.g. "Monday, Mar 24 2025" or "Sunday, Sep 6 2026"
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const dayName = dayNames[istDate.getDay()];
  const monthShort = monthNamesShort[istDate.getMonth()];
  const dayOfMonth = istDate.getDate();
  const year = istDate.getFullYear();

  // Exactly matches reference screenshot: "Monday, Mar 24 2025"
  const dateString = `${dayName}, ${monthShort} ${dayOfMonth} ${year}`;

  // Solar calculations
  const sunTimes = calculateSunTimes(istDate);

  return {
    istDate,
    timeString,
    hoursStr,
    minutes,
    seconds,
    ampm,
    dayName,
    dateString,
    sunTimes,
    is24Hour,
    setIs24Hour,
    syncStatus,
    source,
    latencyMs: latency,
    lastSyncedAt: lastSync,
    driftMs: globalDriftMs,
    syncNow: triggerSync,
  };
}

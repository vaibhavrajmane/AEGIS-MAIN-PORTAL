import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { TargetVessel } from '../types';
import { TARGET_VESSELS, isVesselSanctuaryTrespassing, isVesselSignalTurnedOff } from '../data/mockData';

export interface GlobalLiveStats {
  satellitesOnline: number;
  oceanCoveragePct: number;
  suspiciousShipsFlagged: number;
  packetsPerSec: number;
  activeMissions: number;
  systemLatencyMs: number;
}

export interface BoatsTrackedMetrics {
  count: number;
  previousCount: number;
  delta: number;
  hourlyRate: string;
  secondsRemainingInMinute: number;
  minuteSweepCycle: number;
  lastSweepTime: string;
  isSweepAnimating: boolean;
}

export interface SynchronizedRiskMetrics {
  sanctuaryTrespassing: number;
  signalTurnedOff: number;
  bothViolations: number;
  otherHighRisk: number;
  totalHighRiskShips: number;
  syncFormula: string;
}

export interface InterceptLiveMetrics {
  distanceMiles: number;
  cutterSpeedKts: number;
  etaFormatted: string;
  etaTotalSeconds: number;
  interceptLikelihoodPct: number;
  droneAltitudeFt: number;
  droneDistanceMiles: number;
  seaWaveHeightMeters: number;
  windSpeedKts: number;
  cutterFuelPct: number;
  engineRpm: number;
}

export interface HandheldLiveMetrics {
  distanceMiles: number;
  relativeSpeedKts: number;
  batteryPct: number;
  radioSignalDbm: number;
  gpsAccuracyMeters: number;
  bearingDeg: number;
}

export interface DsaLiveMetrics {
  latencyMs: number;
  memoryMb: number;
  opsPerSec: number;
  nodesVisited: number;
  cacheHitRatePct: number;
}

export interface VesselJitterOffset {
  sogOffset: number;
  cogOffsetDeg: number;
  draftOffsetMeters: number;
  riskScoreDelta: number;
  fuelBurnLphOffset: number;
  engineRpmOffset: number;
  aisAgeSeconds: number;
}

interface LiveTelemetryContextType {
  tick: number;
  pulseActive: boolean;
  isPaused: boolean;
  togglePause: () => void;
  updateIntervalMs: number;
  currentTimeUtc: string;
  globalStats: GlobalLiveStats;
  boatsTracked: BoatsTrackedMetrics;
  advanceBoatsTrackedMinute: () => void;
  synchronizedRisk: SynchronizedRiskMetrics;
  riskFilterCategory: 'ALL' | 'HIGH_RISK' | 'SIGNAL_OFF' | 'SANCTUARY';
  setRiskFilterCategory: (category: 'ALL' | 'HIGH_RISK' | 'SIGNAL_OFF' | 'SANCTUARY') => void;
  interceptMetrics: InterceptLiveMetrics;
  handheldMetrics: HandheldLiveMetrics;
  dsaMetrics: DsaLiveMetrics;
  vesselJitter: VesselJitterOffset;
  getLiveVessel: (vessel: TargetVessel) => TargetVessel;
  liveVessels: TargetVessel[];
  connectionStatus: 'streaming' | 'local_sync';
}

const LiveTelemetryContext = createContext<LiveTelemetryContextType | null>(null);

export const LiveTelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tick, setTick] = useState<number>(1);
  const [pulseActive, setPulseActive] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<'streaming' | 'local_sync'>('local_sync');
  const [currentTimeUtc, setCurrentTimeUtc] = useState<string>('');

  // 1-Minute Interval Tracker for Boats Tracked Now
  const [boatsTracked, setBoatsTracked] = useState<BoatsTrackedMetrics>({
    count: 14892,
    previousCount: 14878,
    delta: 14,
    hourlyRate: '+18/hr',
    secondsRemainingInMinute: 60,
    minuteSweepCycle: 1,
    lastSweepTime: 'Live Active',
    isSweepAnimating: false,
  });

  // Synchronized High Risk, Sanctuary Trespassing, and Signal Turned Off ships
  const [synchronizedRisk, setSynchronizedRisk] = useState<SynchronizedRiskMetrics>({
    sanctuaryTrespassing: 8,
    signalTurnedOff: 14,
    bothViolations: 3,
    otherHighRisk: 7,
    totalHighRiskShips: 26, // 8 + 14 - 3 + 7 = 26
    syncFormula: '8 Sanctuary + 14 Signal Off - 3 Overlap + 7 Other = 26 High Risk',
  });

  const [riskFilterCategory, setRiskFilterCategory] = useState<'ALL' | 'HIGH_RISK' | 'SIGNAL_OFF' | 'SANCTUARY'>('ALL');

  // Running interception distance (smooth decrease without limits)
  const interceptDistRef = useRef<number>(18.42);

  // Fallback / standard client state
  const [globalStats, setGlobalStats] = useState<GlobalLiveStats>({
    satellitesOnline: 42,
    oceanCoveragePct: 99.4,
    suspiciousShipsFlagged: 26,
    packetsPerSec: 4820,
    activeMissions: 3,
    systemLatencyMs: 42,
  });

  const [interceptMetrics, setInterceptMetrics] = useState<InterceptLiveMetrics>({
    distanceMiles: 18.42,
    cutterSpeedKts: 26.2,
    etaFormatted: '1h 14m 12s',
    etaTotalSeconds: 4452,
    interceptLikelihoodPct: 96.4,
    droneAltitudeFt: 14000,
    droneDistanceMiles: 2.1,
    seaWaveHeightMeters: 2.4,
    windSpeedKts: 18.4,
    cutterFuelPct: 88.4,
    engineRpm: 1850,
  });

  const [handheldMetrics, setHandheldMetrics] = useState<HandheldLiveMetrics>({
    distanceMiles: 0.40,
    relativeSpeedKts: 1.4,
    batteryPct: 98,
    radioSignalDbm: -64,
    gpsAccuracyMeters: 1.1,
    bearingDeg: 42,
  });

  const [dsaMetrics, setDsaMetrics] = useState<DsaLiveMetrics>({
    latencyMs: 3.8,
    memoryMb: 42.1,
    opsPerSec: 14280,
    nodesVisited: 1842,
    cacheHitRatePct: 99.4,
  });

  const [vesselJitter, setVesselJitter] = useState<VesselJitterOffset>({
    sogOffset: 0.05,
    cogOffsetDeg: 1,
    draftOffsetMeters: 0.02,
    riskScoreDelta: 0,
    fuelBurnLphOffset: 4,
    engineRpmOffset: 6,
    aisAgeSeconds: 3,
  });

  // Clock updating every 1000ms with 1-minute Boats Tracked interval cycle
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, '0');
      const m = String(now.getUTCMinutes()).padStart(2, '0');
      const s = String(now.getUTCSeconds()).padStart(2, '0');
      setCurrentTimeUtc(`UTC ${h}:${m}:${s}`);

      if (!isPaused) {
        setBoatsTracked((prev) => {
          if (prev.secondsRemainingInMinute <= 1) {
            // 1-minute interval reached! Advance count with realistic maritime flux
            const nextCycle = prev.minuteSweepCycle + 1;
            const deltas = [14, -8, 22, 11, -6, 17, 9, -12, 18, 15];
            const chosenDelta = deltas[nextCycle % deltas.length];
            const nextCount = Math.max(14500, prev.count + chosenDelta);
            const rate = `${chosenDelta >= 0 ? '+' : ''}${Math.round(chosenDelta * 1.3)}/hr`;

            return {
              count: nextCount,
              previousCount: prev.count,
              delta: chosenDelta,
              hourlyRate: rate,
              secondsRemainingInMinute: 60,
              minuteSweepCycle: nextCycle,
              lastSweepTime: `UTC ${h}:${m}:${s}`,
              isSweepAnimating: true,
            };
          } else {
            return {
              ...prev,
              secondsRemainingInMinute: prev.secondsRemainingInMinute - 1,
              isSweepAnimating: prev.secondsRemainingInMinute > 57 ? prev.isSweepAnimating : false,
            };
          }
        });
      }
    };
    updateClock();
    const clockId = setInterval(updateClock, 1000);
    return () => clearInterval(clockId);
  }, [isPaused]);

  // Manually trigger 1-minute sweep for instant live presentation demonstration
  const advanceBoatsTrackedMinute = () => {
    const now = new Date();
    const h = String(now.getUTCHours()).padStart(2, '0');
    const m = String(now.getUTCMinutes()).padStart(2, '0');
    const s = String(now.getUTCSeconds()).padStart(2, '0');

    setBoatsTracked((prev) => {
      const nextCycle = prev.minuteSweepCycle + 1;
      const deltas = [16, -9, 21, 14, -7, 19, 10, -11, 23, 13];
      const chosenDelta = deltas[nextCycle % deltas.length];
      const nextCount = Math.max(14500, prev.count + chosenDelta);
      const rate = `${chosenDelta >= 0 ? '+' : ''}${Math.round(chosenDelta * 1.3)}/hr`;

      return {
        count: nextCount,
        previousCount: prev.count,
        delta: chosenDelta,
        hourlyRate: rate,
        secondsRemainingInMinute: 60,
        minuteSweepCycle: nextCycle,
        lastSweepTime: `UTC ${h}:${m}:${s}`,
        isSweepAnimating: true,
      };
    });
  };

  // Compute local tick calculation
  const advanceSimulationTick = (currentTick: number) => {
    const sin1 = Math.sin(currentTick * 0.45);
    const cos1 = Math.cos(currentTick * 0.35);

    // High Risk Ships synchronize with Sanctuary Trespassing and Signal Turned Off ships
    const sanctuaryDelta = currentTick % 6 === 0 ? 1 : currentTick % 9 === 0 ? -1 : 0;
    const signalOffDelta = currentTick % 5 === 0 ? 1 : currentTick % 8 === 0 ? -1 : 0;
    const sanctuaryTrespassing = 8 + sanctuaryDelta;
    const signalTurnedOff = 14 + signalOffDelta;
    const bothViolations = 3 + (currentTick % 12 === 0 ? 1 : 0);
    const otherHighRisk = 7;
    const totalHighRiskShips = sanctuaryTrespassing + signalTurnedOff - bothViolations + otherHighRisk;

    setSynchronizedRisk({
      sanctuaryTrespassing,
      signalTurnedOff,
      bothViolations,
      otherHighRisk,
      totalHighRiskShips,
      syncFormula: `${sanctuaryTrespassing} Sanctuary + ${signalTurnedOff} Signal Off - ${bothViolations} Overlap + ${otherHighRisk} Other = ${totalHighRiskShips} High Risk`,
    });

    // Continuous distance decrease
    interceptDistRef.current = Math.max(1.8, +(interceptDistRef.current - 0.015).toFixed(2));
    if (interceptDistRef.current <= 2.0) {
      interceptDistRef.current = 18.4; // loop for non-stop infinite demonstration
    }

    const dist = interceptDistRef.current;
    const speedKts = +(26.2 + sin1 * 0.7).toFixed(1);
    const remainingHours = +(dist / Math.max(speedKts, 15)).toFixed(2);
    const totalSeconds = Math.max(60, Math.round(remainingHours * 3600));
    const etaHours = Math.floor(totalSeconds / 3600);
    const etaMinutes = Math.floor((totalSeconds % 3600) / 60);
    const etaSecs = totalSeconds % 60;
    const etaFormatted = `${etaHours}h ${String(etaMinutes).padStart(2, '0')}m ${String(etaSecs).padStart(2, '0')}s`;

    setGlobalStats({
      satellitesOnline: 42 + (currentTick % 3 === 0 ? 1 : currentTick % 5 === 0 ? -1 : 0),
      oceanCoveragePct: +(99.38 + sin1 * 0.18).toFixed(2),
      suspiciousShipsFlagged: totalHighRiskShips,
      packetsPerSec: Math.round(4820 + sin1 * 140),
      activeMissions: 3,
      systemLatencyMs: Math.round(42 + Math.abs(cos1) * 18),
    });

    setInterceptMetrics({
      distanceMiles: dist,
      cutterSpeedKts: speedKts,
      etaFormatted,
      etaTotalSeconds: totalSeconds,
      interceptLikelihoodPct: +(96.4 + cos1 * 0.6).toFixed(1),
      droneAltitudeFt: Math.round(14000 + sin1 * 45),
      droneDistanceMiles: +(2.1 - (currentTick % 20) * 0.03).toFixed(2),
      seaWaveHeightMeters: +(2.4 + sin1 * 0.22).toFixed(1),
      windSpeedKts: +(18.4 + cos1 * 1.6).toFixed(1),
      cutterFuelPct: +(88.4 - (currentTick * 0.008) % 15).toFixed(1),
      engineRpm: Math.round(1850 + sin1 * 32),
    });

    setHandheldMetrics({
      distanceMiles: +(0.40 + sin1 * 0.03).toFixed(2),
      relativeSpeedKts: +(1.4 + cos1 * 0.15).toFixed(1),
      batteryPct: Math.max(85, Math.round(98 - ((currentTick * 0.005) % 10))),
      radioSignalDbm: Math.round(-64 + sin1 * 3),
      gpsAccuracyMeters: +(1.1 + Math.abs(cos1) * 0.3).toFixed(1),
      bearingDeg: Math.round((42 + sin1 * 3 + 360) % 360),
    });

    setDsaMetrics({
      latencyMs: +(3.8 + sin1 * 0.4).toFixed(2),
      memoryMb: +(42.1 + cos1 * 0.5).toFixed(1),
      opsPerSec: Math.round(14280 + sin1 * 180),
      nodesVisited: 1842 + (currentTick * 3) % 50,
      cacheHitRatePct: +(99.4 + cos1 * 0.2).toFixed(1),
    });

    setVesselJitter({
      sogOffset: +(sin1 * 0.25).toFixed(2),
      cogOffsetDeg: Math.round(cos1 * 2),
      draftOffsetMeters: +(sin1 * 0.04).toFixed(3),
      riskScoreDelta: currentTick % 4 === 0 ? 1 : currentTick % 6 === 0 ? -1 : 0,
      fuelBurnLphOffset: Math.round(sin1 * 8),
      engineRpmOffset: Math.round(cos1 * 12),
      aisAgeSeconds: Math.round(2 + Math.abs(sin1) * 3),
    });
  };

  // Connect to SSE backend stream with graceful local fallback
  useEffect(() => {
    let sse: EventSource | null = null;
    let localInterval: any = null;

    try {
      sse = new EventSource('/api/telemetry/stream');
      
      sse.onopen = () => {
        setConnectionStatus('streaming');
      };

      sse.onmessage = (event) => {
        if (isPaused) return;
        try {
          const payload = JSON.parse(event.data);
          setTick(payload.serverTick || Date.now());
          setPulseActive(true);
          setTimeout(() => setPulseActive(false), 400);

          if (payload.globalStats) setGlobalStats(payload.globalStats);
          if (payload.boatsTracked) setBoatsTracked((prev) => ({ ...prev, ...payload.boatsTracked }));
          if (payload.synchronizedRisk) setSynchronizedRisk(payload.synchronizedRisk);
          if (payload.interceptionOps) setInterceptMetrics(payload.interceptionOps);
          if (payload.tacNavHandheld) setHandheldMetrics(payload.tacNavHandheld);
          if (payload.dsaMetrics) setDsaMetrics(payload.dsaMetrics);
          if (payload.vesselJitter) setVesselJitter(payload.vesselJitter);
        } catch {
          // ignore parsing error
        }
      };

      sse.onerror = () => {
        setConnectionStatus('local_sync');
        sse?.close();
      };
    } catch {
      setConnectionStatus('local_sync');
    }

    // Local interval ticker (runs at 2500ms = 2.5s, active whenever not paused)
    localInterval = setInterval(() => {
      if (isPaused) return;
      setTick((prev) => {
        const next = prev + 1;
        advanceSimulationTick(next);
        setPulseActive(true);
        setTimeout(() => setPulseActive(false), 400);
        return next;
      });
    }, 2500);

    return () => {
      if (sse) sse.close();
      if (localInterval) clearInterval(localInterval);
    };
  }, [isPaused]);

  // Helper to get dynamically varying vessel data
  const getLiveVessel = (baseVessel: TargetVessel): TargetVessel => {
    if (!baseVessel) return baseVessel;
    const codeNum = parseInt(baseVessel.vesselCode.replace('V-', ''), 10) || 1;
    const phase = tick * 0.4 + codeNum * 0.8;
    const sogDelta = +(Math.sin(phase) * 0.18).toFixed(1);
    const cogDelta = Math.round(Math.cos(phase) * 2);
    const scoreDelta = (tick + codeNum) % 6 === 0 ? 1 : (tick + codeNum) % 8 === 0 ? -1 : 0;

    const baseSpeed = baseVessel.sogKts;
    const liveSpeed = Math.max(0.1, +(baseSpeed + sogDelta).toFixed(1));
    const liveHeading = (baseVessel.cogDeg + cogDelta + 360) % 360;
    const liveScore = Math.min(100, Math.max(10, baseVessel.score + scoreDelta));

    // Live draft fluctuation (+- 0.04m from sea heave)
    const draftFloat = parseFloat(baseVessel.calculatedDraft) || 5.2;
    const liveDraftNum = +(draftFloat + Math.sin(phase) * 0.03).toFixed(2);
    const liveDraftStr = `${liveDraftNum}m deep`;

    // Coordinates slight seconds modulation for visual aliveness
    const coordParts = baseVessel.currentCoordinates.split(' ');
    let liveCoord = baseVessel.currentCoordinates;
    if (coordParts.length === 2) {
      const latSecOffset = Math.round(Math.sin(phase) * 3);
      const lngSecOffset = Math.round(Math.cos(phase) * 3);
      liveCoord = baseVessel.currentCoordinates
        .replace(/(\d{2})"/g, (match, p1, offset) => {
          const num = parseInt(p1, 10);
          const adj = offset < 10 ? num + latSecOffset : num + lngSecOffset;
          const clamped = Math.max(0, Math.min(59, adj));
          return `${String(clamped).padStart(2, '0')}"`;
        });
    }

    return {
      ...baseVessel,
      sanctuaryTrespass: baseVessel.sanctuaryTrespass ?? isVesselSanctuaryTrespassing(baseVessel),
      signalTurnedOff: baseVessel.signalTurnedOff ?? isVesselSignalTurnedOff(baseVessel),
      sogKts: liveSpeed,
      cogDeg: liveHeading,
      score: liveScore,
      calculatedDraft: liveDraftStr,
      currentCoordinates: liveCoord,
      lastAisBroadcast: `${Math.round(2 + Math.abs(Math.sin(phase)) * 4)}s ago (Live AIS Ping)`,
    };
  };

  const liveVessels = useMemo(() => {
    return TARGET_VESSELS.map((v) => getLiveVessel(v));
  }, [tick]);

  const togglePause = () => {
    setIsPaused((p) => !p);
  };

  return (
    <LiveTelemetryContext.Provider
      value={{
        tick,
        pulseActive,
        isPaused,
        togglePause,
        updateIntervalMs: 2500,
        currentTimeUtc,
        globalStats,
        boatsTracked,
        advanceBoatsTrackedMinute,
        synchronizedRisk,
        riskFilterCategory,
        setRiskFilterCategory,
        interceptMetrics,
        handheldMetrics,
        dsaMetrics,
        vesselJitter,
        getLiveVessel,
        liveVessels,
        connectionStatus,
      }}
    >
      {children}
    </LiveTelemetryContext.Provider>
  );
};

export const useLiveTelemetry = () => {
  const context = useContext(LiveTelemetryContext);
  if (!context) {
    throw new Error('useLiveTelemetry must be used within a LiveTelemetryProvider');
  }
  return context;
};

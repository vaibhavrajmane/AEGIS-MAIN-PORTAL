import React, { useState, useEffect, useRef } from 'react';
import { TargetVessel, NavigationScreen } from '../types';
import { TARGET_VESSELS, ASSETS_IMAGES, isVesselSanctuaryTrespassing, isVesselSignalTurnedOff } from '../data/mockData';
import { getVesselRoute } from '../data/vesselRoutes';
import { useLiveTelemetry } from '../context/LiveTelemetryContext';
import { MapContainer, TileLayer, Polygon, Tooltip, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Global safety patch for Leaflet flyTo to prevent division-by-zero NaN LatLng errors when container is 0x0
if (typeof window !== 'undefined' && L && L.Map && !(L.Map.prototype as any)._safeFlyToPatched) {
  (L.Map.prototype as any)._safeFlyToPatched = true;
  const originalFlyTo = L.Map.prototype.flyTo;
  L.Map.prototype.flyTo = function (targetCenter: any, targetZoom: any, options: any) {
    try {
      const size = this.getSize();
      if (!size || size.x <= 0 || size.y <= 0) {
        return this.setView(targetCenter, targetZoom ?? this.getZoom(), { animate: false });
      }
      return originalFlyTo.call(this, targetCenter, targetZoom, options);
    } catch {
      return this.setView(targetCenter, targetZoom ?? this.getZoom(), { animate: false });
    }
  };
}

const GLOBAL_OCEAN_COORDS = [ 
  { lat: 40.0, lng: -150.0 }, { lat: -20.0, lng: -130.0 }, { lat: 0.0, lng: -160.0 }, 
  { lat: 45.0, lng: -40.0 }, { lat: -30.0, lng: -20.0 }, { lat: -25.0, lng: 75.0 }, 
  { lat: 15.0, lng: 65.0 }, { lat: 12.0, lng: 88.0 }, { lat: 15.0, lng: 135.0 }, 
  { lat: -40.0, lng: 160.0 }, { lat: -50.0, lng: 20.0 }, { lat: 0.0, lng: 0.0 }, 
  { lat: -15.0, lng: 155.0 }, { lat: 58.0, lng: -175.0 }, { lat: 28.0, lng: -60.0 }, 
  { lat: 12.0, lng: 114.0 }, { lat: 35.0, lng: 150.0 }, { lat: -25.0, lng: 110.0 }, 
  { lat: -35.0, lng: 50.0 }, { lat: -2.0, lng: -95.0 } 
];

// Helper to get safe coordinates for a vessel
function getVesselLatLng(vessel: TargetVessel): [number, number] {
  const codeNum = parseInt(vessel.vesselCode.replace('V-', ''), 10) || 1;
  const coord = GLOBAL_OCEAN_COORDS[Math.abs(codeNum - 1) % GLOBAL_OCEAN_COORDS.length] || GLOBAL_OCEAN_COORDS[0];
  const latOffset = (((codeNum * 13) % 10) / 10) * 4 - 2;
  const lngOffset = (((codeNum * 17) % 10) / 10) * 4 - 2;
  const lat = Number.isFinite(coord.lat + latOffset) ? coord.lat + latOffset : -5;
  const lng = Number.isFinite(coord.lng + lngOffset) ? coord.lng + lngOffset : -90;
  return [lat, lng];
}

// Map controller to automatically navigate to the selected vessel safely
function MapController({ selectedVessel }: { selectedVessel: TargetVessel | null }) {
  const map = useMap();
  const isFirstMount = useRef(true);

  // Invalidate map size on window resize
  useEffect(() => {
    if (!map) return;
    const handleResize = () => {
      try {
        map.invalidateSize();
      } catch {
        // ignore
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [map]);

  useEffect(() => {
    if (!map || !selectedVessel) return;

    const [lat, lng] = getVesselLatLng(selectedVessel);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    if (isFirstMount.current) {
      isFirstMount.current = false;
      // On initial mount, allow the container layout to settle before positioning
      const timer = setTimeout(() => {
        try {
          map.invalidateSize();
          map.setView([lat, lng], 4, { animate: false });
        } catch {
          // ignore
        }
      }, 150);
      return () => clearTimeout(timer);
    }

    // On user selection changes
    const size = map.getSize();
    if (!size || size.x <= 0 || size.y <= 0) {
      try {
        map.invalidateSize();
        map.setView([lat, lng], 5, { animate: false });
      } catch {
        // ignore
      }
      return;
    }

    try {
      map.flyTo([lat, lng], 5, {
        animate: true,
        duration: 1.2,
      });
    } catch {
      try {
        map.setView([lat, lng], 5, { animate: false });
      } catch {
        // ignore
      }
    }
  }, [selectedVessel?.id, map]);

  return null;
}

interface GlobalRadarViewProps {
  selectedVessel: TargetVessel;
  onSelectVessel: (vessel: TargetVessel) => void;
  onNavigate: (screen: NavigationScreen) => void;
  onShowToast: (title: string, message: string, type?: 'primary' | 'error' | 'success') => void;
  searchQuery?: string;
}

export const GlobalRadarView: React.FC<GlobalRadarViewProps> = ({
  selectedVessel,
  onSelectVessel,
  onNavigate,
  onShowToast,
  searchQuery = '',
}) => {
  const { 
    liveVessels, 
    globalStats, 
    tick, 
    pulseActive, 
    currentTimeUtc,
    boatsTracked,
    advanceBoatsTrackedMinute,
    synchronizedRisk,
    riskFilterCategory,
    setRiskFilterCategory
  } = useLiveTelemetry();

  // Layer toggles
  const [layers, setLayers] = useState({
    bathymetry: true,
    sarRadar: true,
    viirsNightLight: true,
    eezProtected: true,
  });

  // Filter states
  const [riskTier, setRiskTier] = useState<'HIGH' | 'MEDIUM' | 'ALL'>('HIGH');
  const [selectedFlags, setSelectedFlags] = useState<string[]>([
    'Panama',
    'Liberia',
    'China',
    'Vanuatu',
  ]);
  const [gearFilters, setGearFilters] = useState({
    trawlers: true,
    longliners: true,
    reefers: true,
    seiners: false,
  });

  // Timeline playback state
  const [isPlaying, setIsPlaying] = useState(true);
  const [timelineProgress, setTimelineProgress] = useState(100);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [utcTime, setUtcTime] = useState('');

  // Live UTC Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, '0');
      const m = String(now.getUTCMinutes()).padStart(2, '0');
      const s = String(now.getUTCSeconds()).padStart(2, '0');
      setUtcTime(`UTC ${h}:${m}:${s}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Timeline playback simulation
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimelineProgress((prev) => (prev >= 100 ? 0 : prev + 1));
      }, 600);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const toggleLayer = (layer: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  const removeFlag = (flag: string) => {
    setSelectedFlags((prev) => prev.filter((f) => f !== flag));
  };

  const addFlag = () => {
    const newFlag = prompt('Add country name (e.g. Spain, Japan, Belize):');
    if (newFlag && !selectedFlags.includes(newFlag)) {
      setSelectedFlags((prev) => [...prev, newFlag]);
    }
  };

  const resetFilters = () => {
    setRiskTier('ALL');
    setRiskFilterCategory('ALL');
    setSelectedFlags(['Panama', 'Liberia', 'China', 'Vanuatu']);
    setGearFilters({ trawlers: true, longliners: true, reefers: true, seiners: false });
    onShowToast('FILTERS RESET', 'Viewing all live tracked vessels.');
  };

  // Filter vessels based on synchronized threat categories, risk tier and search query
  const filteredVessels = liveVessels.filter((v) => {
    // 1. Synchronized Risk Filter Category (High Risk, Sanctuary Trespass, Signal Turned Off)
    if (riskFilterCategory === 'SANCTUARY') {
      const isSanctuary = v.sanctuaryTrespass ?? isVesselSanctuaryTrespassing(v);
      if (!isSanctuary) return false;
    } else if (riskFilterCategory === 'SIGNAL_OFF') {
      const isSignalOff = v.signalTurnedOff ?? isVesselSignalTurnedOff(v);
      if (!isSignalOff) return false;
    } else if (riskFilterCategory === 'HIGH_RISK') {
      const isSanctuary = v.sanctuaryTrespass ?? isVesselSanctuaryTrespassing(v);
      const isSignalOff = v.signalTurnedOff ?? isVesselSignalTurnedOff(v);
      const isHighThreat = v.score >= 80 || isSanctuary || isSignalOff;
      if (!isHighThreat) return false;
    } else {
      // Standard risk tier filters when in 'ALL' threat mode
      if (riskTier === 'HIGH' && v.score < 80) return false;
      if (riskTier === 'MEDIUM' && (v.score < 50 || v.score >= 80)) return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        v.vesselCode.toLowerCase().includes(q) ||
        v.nickname.toLowerCase().includes(q) ||
        v.name.toLowerCase().includes(q) ||
        v.mmsi.includes(q) ||
        v.imo.includes(q) ||
        v.callsign.toLowerCase().includes(q) ||
        v.behavioralTrigger.toLowerCase().includes(q) ||
        v.algorithmUsed.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const statusColors = {
    CRITICAL: {
      text: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-500',
      bgLight: 'bg-red-500/15',
      border: 'border-red-500/30',
      boxBg: 'bg-red-500/10 dark:bg-red-500/15',
      boxBorder: 'border-red-500/20',
      textDark: 'text-red-700 dark:text-red-300',
      icon: 'crisis_alert',
      label: 'High Alert',
      permitIcon: 'cancel'
    },
    ALERTIVE: {
      text: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500',
      bgLight: 'bg-amber-500/15',
      border: 'border-amber-500/30',
      boxBg: 'bg-amber-500/10 dark:bg-amber-500/15',
      boxBorder: 'border-amber-500/20',
      textDark: 'text-amber-700 dark:text-amber-300',
      icon: 'warning',
      label: 'Elevated Risk',
      permitIcon: 'warning'
    },
    NORMAL: {
      text: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500',
      bgLight: 'bg-emerald-500/15',
      border: 'border-emerald-500/30',
      boxBg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      boxBorder: 'border-emerald-500/20',
      textDark: 'text-emerald-700 dark:text-emerald-300',
      icon: 'check_circle',
      label: 'Normal Traffic',
      permitIcon: 'check_circle'
    }
  };
  const sc = statusColors[selectedVessel.dashboardStatus] || statusColors.CRITICAL;

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-7rem)] relative overflow-hidden transition-colors select-none">
      {/* Dynamic Atmospheric Glow Orbs */}
      <div className="pointer-events-none absolute -top-40 -left-20 w-96 h-96 rounded-full bg-sky-500/10 blur-[120px]"></div>
      <div className="pointer-events-none absolute top-1/2 -right-40 w-[500px] h-[500px] rounded-full bg-purple-500/10 blur-[150px]"></div>
      <div className="pointer-events-none absolute -bottom-32 left-1/3 w-[600px] h-[600px] rounded-full bg-sky-600/10 blur-[160px]"></div>

      {/* TOP KPI HUD BAR (Glassmorphic) */}
      <div className="w-full px-4 sm:px-6 py-2.5 z-30">
        <div className="w-full rounded-2xl glass-panel px-5 py-3 flex flex-wrap items-center justify-between gap-4 transition-colors">
          {/* Metric 1: Vessels Tracked (Updates strictly on 1-minute interval) */}
          <div 
            onClick={() => setRiskFilterCategory('ALL')}
            className={`flex items-center gap-3 min-w-[200px] p-1.5 rounded-xl transition-all cursor-pointer ${
              riskFilterCategory === 'ALL'
                ? 'bg-sky-500/10 border border-sky-500/30'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
            } ${boatsTracked.isSweepAnimating ? 'ring-2 ring-sky-400 shadow-md shadow-sky-500/20' : ''}`}
            title="Total registered vessels across basin. Automatically updates every 1-minute interval with AIS fleet sweeps."
          >
            <div className="relative w-10 h-10 rounded-xl bg-sky-500/15 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
              <span className="material-symbols-outlined text-xl">radar</span>
              {boatsTracked.isSweepAnimating && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping"></span>
              )}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Boats Tracked
                </span>
                <span className="text-[10px] font-mono px-1 rounded bg-sky-500/15 text-sky-600 dark:text-sky-400 font-bold">
                  {boatsTracked.secondsRemainingInMinute}s
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {boatsTracked.count.toLocaleString()}
                </span>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {boatsTracked.hourlyRate}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                <span>1-min sweep cycle</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    advanceBoatsTrackedMinute();
                    onShowToast('1-MIN SWEEP ADVANCED', 'Manually advanced 1-minute AIS boat tracking sweep.', 'primary');
                  }}
                  className="text-sky-600 dark:text-sky-400 hover:underline font-bold"
                  title="Force advance 1-minute cycle immediately"
                >
                  ⚡ Sweep
                </button>
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200 dark:bg-white/10 hidden md:block"></div>

          {/* Metric 2: Critical High Risk Ships (Directly Synced with Sanctuary & Signal Off) */}
          <div 
            onClick={() => setRiskFilterCategory(riskFilterCategory === 'HIGH_RISK' ? 'ALL' : 'HIGH_RISK')}
            className={`flex items-center gap-3 min-w-[210px] p-1.5 rounded-xl transition-all cursor-pointer ${
              riskFilterCategory === 'HIGH_RISK'
                ? 'bg-red-500/15 border border-red-500/40 ring-2 ring-red-500/40 shadow-sm'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
            title={`High Risk Ships are causally synced: ${synchronizedRisk.syncFormula}. Click to filter radar.`}
          >
            <div className="relative w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
              <span className="material-symbols-outlined text-xl">warning</span>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500"></span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  High Risk Ships
                </span>
                <span className="text-[9px] bg-red-500/20 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded font-bold uppercase border border-red-500/30">
                  Synced
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-red-600 dark:text-red-400">
                  {synchronizedRisk.totalHighRiskShips} Flagged
                </span>
              </div>
              <div className="text-[10px] text-red-600/80 dark:text-red-400/80 font-medium truncate">
                {synchronizedRisk.sanctuaryTrespassing} Sanctuary + {synchronizedRisk.signalTurnedOff} Dark AIS
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200 dark:bg-white/10 hidden md:block"></div>

          {/* Metric 3: Trackers Turned Off (Dark Fleet) */}
          <div 
            onClick={() => setRiskFilterCategory(riskFilterCategory === 'SIGNAL_OFF' ? 'ALL' : 'SIGNAL_OFF')}
            className={`flex items-center gap-3 min-w-[195px] p-1.5 rounded-xl transition-all cursor-pointer ${
              riskFilterCategory === 'SIGNAL_OFF'
                ? 'bg-amber-500/15 border border-amber-500/40 ring-2 ring-amber-500/40 shadow-sm'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
            title="Vessels with transponders disabled / dark gaps. Synced directly into High Risk count. Click to filter."
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <span className="material-symbols-outlined text-xl">sensors_off</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Signal Turned Off
                </span>
                <span className="text-[9px] bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1 py-0.2 rounded font-bold">
                  Dark
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {synchronizedRisk.signalTurnedOff} Ships
                </span>
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Lost Track</span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Feeds into High Risk sync
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200 dark:bg-white/10 hidden md:block"></div>

          {/* Metric 4: Protected Area Trespassing (Sanctuary Violations) */}
          <div 
            onClick={() => setRiskFilterCategory(riskFilterCategory === 'SANCTUARY' ? 'ALL' : 'SANCTUARY')}
            className={`flex items-center gap-3 min-w-[210px] p-1.5 rounded-xl transition-all cursor-pointer ${
              riskFilterCategory === 'SANCTUARY'
                ? 'bg-purple-500/15 border border-purple-500/40 ring-2 ring-purple-500/40 shadow-sm'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
            title="Vessels breaching or penetrating Galápagos / MPA marine reserve polygons. Synced directly into High Risk count. Click to filter."
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
              <span className="material-symbols-outlined text-xl">security</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Sanctuary Trespassing
                </span>
                <span className="text-[9px] bg-purple-500/20 text-purple-600 dark:text-purple-400 px-1 py-0.2 rounded font-bold">
                  MPA
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {synchronizedRisk.sanctuaryTrespassing} In Sanctuary
                </span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Galápagos • Feeds High Risk
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200 dark:bg-white/10 hidden lg:block"></div>

          {/* Metric 5: Patrol Team Readiness */}
          <div className="flex items-center gap-3 min-w-[165px]">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200 dark:text-slate-800"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                ></path>
                <path
                  className="text-sky-500 transition-all duration-700"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray={`${Math.round(88 + Math.sin(tick * 0.4) * 2)}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3.5"
                ></path>
              </svg>
              <span className="absolute text-[10px] font-bold text-slate-800 dark:text-white">
                {Math.round(88 + Math.sin(tick * 0.4) * 2)}%
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Patrol Readiness
              </span>
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400">Ready to Respond</span>
            </div>
          </div>

          {/* Live UTC Clock */}
          <div className="hidden xl:flex items-center gap-2 pl-2 bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 px-3 py-1.5 rounded-xl shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-200">
              {utcTime || 'UTC 16:08:37'}
            </span>
          </div>
        </div>
      </div>

      {/* MAIN OPERATIONAL VIEWPORT (Tactical Canvas + Floating Panels) */}
      <div className="flex-1 w-full px-4 sm:px-6 pb-6 pt-1 flex flex-col lg:flex-row gap-5 relative overflow-hidden">
        {/* LEFT PANEL: Surveillance Filters & Live Target Queue */}
        <aside className="w-full lg:w-80 2xl:w-96 flex-shrink-0 z-20 flex flex-col gap-4">
          {/* Filter Card */}
          <div className="rounded-2xl glass-panel p-4 flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sky-600 dark:text-sky-400 text-lg">tune</span>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Watch Filters
                </h2>
              </div>
              <button
                onClick={resetFilters}
                className="text-xs font-semibold text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer"
              >
                Reset
              </button>
            </div>

            {/* Synchronized Threat Focus */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Threat Focus (Synced)
                </label>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active Sync
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/50 dark:bg-slate-800/60 rounded-xl border border-slate-300/40 dark:border-white/10 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setRiskFilterCategory('HIGH_RISK')}
                  className={`py-1.5 px-2 rounded-lg text-left flex items-center justify-between transition-all cursor-pointer ${
                    riskFilterCategory === 'HIGH_RISK'
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-slate-700/50'
                  }`}
                  title="Filter to all High Risk ships"
                >
                  <span className="truncate">🚨 High Risk</span>
                  <span className="font-mono text-[10px] font-bold opacity-90">{synchronizedRisk.totalHighRiskShips}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRiskFilterCategory('SANCTUARY')}
                  className={`py-1.5 px-2 rounded-lg text-left flex items-center justify-between transition-all cursor-pointer ${
                    riskFilterCategory === 'SANCTUARY'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-slate-700/50'
                  }`}
                  title="Filter to ships trespassing in Marine Protected Areas / Sanctuaries"
                >
                  <span className="truncate">🚫 Sanctuary</span>
                  <span className="font-mono text-[10px] font-bold opacity-90">{synchronizedRisk.sanctuaryTrespassing}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRiskFilterCategory('SIGNAL_OFF')}
                  className={`py-1.5 px-2 rounded-lg text-left flex items-center justify-between transition-all cursor-pointer ${
                    riskFilterCategory === 'SIGNAL_OFF'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-slate-700/50'
                  }`}
                  title="Filter to dark vessels with AIS transponder turned off"
                >
                  <span className="truncate">📡 Signal Off</span>
                  <span className="font-mono text-[10px] font-bold opacity-90">{synchronizedRisk.signalTurnedOff}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRiskFilterCategory('ALL')}
                  className={`py-1.5 px-2 rounded-lg text-left flex items-center justify-between transition-all cursor-pointer ${
                    riskFilterCategory === 'ALL'
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-slate-700/50'
                  }`}
                  title="View all vessels"
                >
                  <span className="truncate">🌐 All Ships</span>
                  <span className="font-mono text-[10px] font-bold opacity-90">{liveVessels.length}</span>
                </button>
              </div>
            </div>

            {/* Risk Level Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Suspicion Level
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/50 dark:bg-slate-800/60 rounded-xl border border-slate-300/40 dark:border-white/10">
                <button
                  onClick={() => {
                    setRiskTier('HIGH');
                    if (riskFilterCategory !== 'ALL') setRiskFilterCategory('ALL');
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold text-center transition-all cursor-pointer ${
                    riskTier === 'HIGH' && riskFilterCategory === 'ALL'
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  High (&gt;80)
                </button>
                <button
                  onClick={() => {
                    setRiskTier('MEDIUM');
                    if (riskFilterCategory !== 'ALL') setRiskFilterCategory('ALL');
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold text-center transition-all cursor-pointer ${
                    riskTier === 'MEDIUM' && riskFilterCategory === 'ALL'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Med (50-80)
                </button>
                <button
                  onClick={() => {
                    setRiskTier('ALL');
                    if (riskFilterCategory !== 'ALL') setRiskFilterCategory('ALL');
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold text-center transition-all cursor-pointer ${
                    riskTier === 'ALL' && riskFilterCategory === 'ALL'
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All Ships
                </button>
              </div>
            </div>

            {/* Country / Flag Chips */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Country Flag
                </label>
                <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                  {selectedFlags.length} Selected
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedFlags.map((flag) => (
                  <span
                    key={flag}
                    onClick={() => removeFlag(flag)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-sky-500/10 text-sky-700 dark:text-sky-300 cursor-pointer hover:bg-sky-500/20 border border-sky-500/20 transition-all flex items-center gap-1"
                    title="Click to remove"
                  >
                    <span>{flag}</span>
                    <span className="text-xs font-bold opacity-70">×</span>
                  </span>
                ))}
                <button
                  onClick={addFlag}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  + Add Country
                </button>
              </div>
            </div>

            {/* Boat Type Filter Checkboxes */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Ship Type
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <label className="flex items-center gap-2 p-2 rounded-xl bg-white/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 cursor-pointer transition-colors text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-white/5">
                  <input
                    checked={gearFilters.trawlers}
                    onChange={(e) => setGearFilters((g) => ({ ...g, trawlers: e.target.checked }))}
                    className="accent-sky-500 rounded w-4 h-4"
                    type="checkbox"
                  />
                  <span>Net Trawlers</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-xl bg-white/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 cursor-pointer transition-colors text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-white/5">
                  <input
                    checked={gearFilters.longliners}
                    onChange={(e) => setGearFilters((g) => ({ ...g, longliners: e.target.checked }))}
                    className="accent-sky-500 rounded w-4 h-4"
                    type="checkbox"
                  />
                  <span>Longline Boats</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-xl bg-white/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 cursor-pointer transition-colors text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-white/5">
                  <input
                    checked={gearFilters.reefers}
                    onChange={(e) => setGearFilters((g) => ({ ...g, reefers: e.target.checked }))}
                    className="accent-sky-500 rounded w-4 h-4"
                    type="checkbox"
                  />
                  <span>Freezer Ships</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-xl bg-white/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 cursor-pointer transition-colors text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-white/5">
                  <input
                    checked={gearFilters.seiners}
                    onChange={(e) => setGearFilters((g) => ({ ...g, seiners: e.target.checked }))}
                    className="accent-sky-500 rounded w-4 h-4"
                    type="checkbox"
                  />
                  <span>Net Purse Boats</span>
                </label>
              </div>
            </div>
          </div>

          {/* Suspicious Ships Queue */}
          <div className="flex-1 rounded-2xl glass-panel p-4 flex flex-col min-h-[340px]">
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  {riskFilterCategory === 'SANCTUARY'
                    ? 'Sanctuary Trespassers'
                    : riskFilterCategory === 'SIGNAL_OFF'
                    ? 'Dark Fleet (Signal Off)'
                    : riskFilterCategory === 'HIGH_RISK'
                    ? 'High Risk Priority Fleet'
                    : 'Suspicious Ships List'}
                </h2>
              </div>
              <div className="flex items-center gap-1.5">
                {riskFilterCategory !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setRiskFilterCategory('ALL')}
                    className="text-[10px] text-sky-600 dark:text-sky-400 hover:underline font-bold cursor-pointer"
                  >
                    Clear Filter
                  </button>
                )}
                <span className="text-xs font-bold bg-red-500/15 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">
                  {filteredVessels.length} Shown
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1" id="watchlist-container">
              {filteredVessels.map((vessel) => {
                const isSelected = vessel.id === selectedVessel.id;
                const isSanctuary = vessel.sanctuaryTrespass ?? isVesselSanctuaryTrespassing(vessel);
                const isSignalOff = vessel.signalTurnedOff ?? isVesselSignalTurnedOff(vessel);

                return (
                  <div
                    key={vessel.id}
                    onClick={() => onSelectVessel(vessel)}
                    className={`p-3 rounded-xl transition-all cursor-pointer flex flex-col gap-1.5 border ${
                      isSelected
                        ? 'bg-white dark:bg-slate-800/90 border-red-500/60 shadow-md ring-2 ring-red-500/30'
                        : 'bg-white/50 dark:bg-slate-800/40 hover:bg-white/80 dark:hover:bg-slate-800/70 border-slate-200/70 dark:border-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-600 dark:text-sky-400 font-bold shrink-0">
                          {vessel.vesselCode}
                        </span>
                        <span
                          className={`text-xs font-bold truncate ${
                            vessel.score >= 85 ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-white'
                          }`}
                        >
                          "{vessel.nickname}"
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                          vessel.score >= 85
                            ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        Risk {vessel.score}
                      </span>
                    </div>

                    {/* Synchronized threat classification badges */}
                    {(isSanctuary || isSignalOff) && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {isSanctuary && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                            Sanctuary Trespass
                          </span>
                        )}
                        {isSignalOff && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                            Signal Off (Dark)
                          </span>
                        )}
                      </div>
                    )}

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {vessel.name} • {vessel.flag}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-tight">
                      {vessel.behavioralTrigger}
                    </div>
                    <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200/50 dark:border-white/5">
                      <span className="font-mono">{vessel.algorithmUsed.split(' ')[0]}</span>
                      <span className="text-sky-600 dark:text-sky-400 font-semibold">{vessel.dsaComplexity}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 pt-2 text-center border-t border-slate-200 dark:border-white/10 flex flex-col gap-1.5">
              <button
                onClick={() => onNavigate('dsa-matrix')}
                className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-sky-500/15 text-sky-600 dark:text-sky-400 hover:bg-sky-500/25 border border-sky-500/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">grid_view</span>
                <span>Open 20-Vessel Matrix &amp; DSA</span>
              </button>
              <button
                onClick={() => setRiskTier('ALL')}
                className="w-full py-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer"
              >
                View All Monitored Ships ({TARGET_VESSELS.length})
              </button>
            </div>
          </div>
        </aside>

        {/* CENTER: OCEAN RADAR DISPLAY */}
        <main className="flex-1 relative rounded-3xl overflow-hidden shadow-2xl bg-[#06101f] border border-slate-300/40 dark:border-white/10 flex flex-col justify-between min-h-[480px]">
          {/* Top Floating Controls on Radar */}
          <div className="z-20 w-full p-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
            {/* Coordinates Badge & Zoom Controls */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md shadow-lg border border-white/15 text-xs text-white">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
                <span className="font-semibold">Area: South Pacific Sanctuary</span>
                <span className="text-sky-400 font-mono tracking-wider">04°18'S 82°44'W</span>
              </div>
              <div 
                className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md shadow-lg border border-red-500/30 text-xs text-white cursor-pointer hover:bg-slate-900 transition-colors"
                onClick={() => setRiskFilterCategory('HIGH_RISK')}
                title={`Live Threat Sync: ${synchronizedRisk.syncFormula}. Click to filter.`}
              >
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                <span className="text-red-400 font-bold">Threat Sync:</span>
                <span className="font-mono text-[11px] text-slate-200">
                  {synchronizedRisk.sanctuaryTrespassing} Sanctuary + {synchronizedRisk.signalTurnedOff} Dark AIS = {synchronizedRisk.totalHighRiskShips} High Risk
                </span>
              </div>
              <div className="pointer-events-auto flex items-center bg-slate-900/80 backdrop-blur-md rounded-xl border border-white/15 shadow-lg overflow-hidden">
                <button
                  onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.2))}
                  className="px-2 py-1 text-white hover:bg-white/20 transition-colors"
                  title="Zoom Out"
                >
                  <span className="material-symbols-outlined text-[16px]">remove</span>
                </button>
                <div className="px-2 text-xs font-mono text-sky-400 border-x border-white/15">
                  {Math.round(zoomLevel * 100)}%
                </div>
                <button
                  onClick={() => setZoomLevel(z => Math.min(3, z + 0.2))}
                  className="px-2 py-1 text-white hover:bg-white/20 transition-colors"
                  title="Zoom In"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                </button>
              </div>
            </div>

            {/* Layer Switches */}
            <div className="pointer-events-auto flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/85 backdrop-blur-md shadow-lg border border-white/15">
              <button
                onClick={() => toggleLayer('bathymetry')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  layers.bathymetry
                    ? 'bg-sky-500 text-white font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="material-symbols-outlined text-sm">waves</span>
                <span>Sea Depth</span>
              </button>

              <button
                onClick={() => toggleLayer('sarRadar')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  layers.sarRadar
                    ? 'bg-sky-500 text-white font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="material-symbols-outlined text-sm">satellite_alt</span>
                <span>Satellite Radar</span>
              </button>

              <button
                onClick={() => toggleLayer('viirsNightLight')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  layers.viirsNightLight
                    ? 'bg-sky-500 text-white font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="material-symbols-outlined text-sm">wb_twilight</span>
                <span>Night Lights</span>
              </button>

              <button
                onClick={() => toggleLayer('eezProtected')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  layers.eezProtected
                    ? 'bg-purple-600 text-white font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="material-symbols-outlined text-sm">policy</span>
                <span>Protected Zone</span>
              </button>
            </div>
          </div>

          {/* RADAR CANVAS (Leaflet World Map) */}
          <div className="absolute inset-0 z-0 overflow-hidden" style={{ filter: 'invert(1) hue-rotate(180deg) brightness(1.2)' }}>
            <MapContainer 
              center={[-5, -90]} 
              zoom={4} 
              style={{ width: '100%', height: '100%', background: '#f1f5f9' }}
              zoomControl={false}
              minZoom={2}
              maxBounds={[[-90, -180], [90, 180]]}
              maxBoundsViscosity={1.0}
              worldCopyJump={false}
            >
              <MapController selectedVessel={selectedVessel} />
              
              {/* Using standard OSM with CSS filter to invert to dark theme since CartoDB doesn't load without API sometimes */}
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap'
              />
              
              {layers.bathymetry && (
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}"
                  opacity={0.35}
                />
              )}

              {layers.eezProtected && (
                <Polygon
                  positions={[
                    [-4.0, -84.0],
                    [-6.0, -84.0],
                    [-6.0, -80.0],
                    [-4.0, -80.0]
                  ]}
                  pathOptions={{ color: '#c8a0f0', weight: 2, dashArray: '6,4', fillColor: '#c8a0f0', fillOpacity: 0.1 }}
                >
                  <Tooltip permanent direction="center" className="bg-transparent border-none text-purple-800 font-bold shadow-none text-xs">
                    PROTECTED WILDLIFE SANCTUARY
                  </Tooltip>
                </Polygon>
              )}

              {/* INTERACTIVE SHIP BLIPS */}
              {filteredVessels.map(vessel => {
                const route = getVesselRoute(vessel);
                const isSelected = selectedVessel?.id === vessel.id;
                const isCritical = vessel.score >= 85;

                const [lat, lng] = getVesselLatLng(vessel);

                const customIcon = L.divIcon({
                  className: 'bg-transparent border-none overflow-visible',
                  html: `
                    <div class="relative flex items-center justify-center w-full h-full" style="filter: invert(1) hue-rotate(180deg) brightness(0.8)">
                      ${(isCritical || isSelected) ? `<span class="absolute w-12 h-12 rounded-full ${isSelected ? 'bg-sky-500/50' : 'bg-red-500/50'} animate-ping" style="top: -12px; left: -12px;"></span>` : ''}
                      ${(isCritical || isSelected) ? `<span class="absolute w-8 h-8 rounded-full ${isSelected ? 'bg-sky-500/60' : 'bg-red-500/50'}" style="top: -4px; left: -4px;"></span>` : ''}
                      <div class="absolute w-6 h-6 text-white rounded-full flex items-center justify-center shadow-lg ${isSelected ? 'bg-sky-500' : isCritical ? 'bg-red-500' : 'bg-amber-500'}" style="transform: rotate(${vessel.cogDeg}deg); top: 0; left: 0; color: white;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                      </div>
                    </div>
                  `,
                  iconSize: [24, 24],
                  iconAnchor: [12, 12],
                });

                return (
                  <Marker 
                    key={vessel.id} 
                    position={[lat, lng]} 
                    icon={customIcon}
                    eventHandlers={{ click: () => onSelectVessel(vessel) }}
                    zIndexOffset={isSelected ? 1000 : isCritical ? 500 : 0}
                  >
                    <Popup className="custom-popup" closeButton={false}>
    <div className={`flex flex-col gap-1 bg-slate-900/95 text-white px-3 py-2 rounded-xl border ${isSelected ? 'border-sky-500' : isCritical ? 'border-red-500/40' : 'border-white/10'} min-w-[150px]`} style={{ filter: 'invert(1) hue-rotate(180deg) brightness(0.8)' }}>
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full animate-pulse ${isSelected ? 'bg-sky-400' : isCritical ? 'bg-red-500' : 'bg-amber-400'}`}></span>
        <span className={`text-xs font-bold ${isSelected ? 'text-sky-400' : isCritical ? 'text-red-400' : 'text-amber-300'}`}>{vessel.name}</span>
      </div>
      <span className="text-[10px] text-slate-300">{vessel.sogKts} kts • {vessel.type}</span>
      <span className={`text-[10px] px-1.5 py-0.5 mt-1 rounded font-bold w-fit ${isSelected ? 'bg-sky-500/20 text-sky-400' : isCritical ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-300'}`}>
        Risk {vessel.score}
      </span>
    </div>
  </Popup>
                    <Tooltip permanent direction="top" offset={[0, -12]} className="bg-slate-900/80 text-white border-white/20 text-[10px] font-bold px-1.5 py-0.5" opacity={0.9}>
                      {vessel.vesselCode}
                    </Tooltip>
                  </Marker>
                );
              })}
              
              {/* Coast Guard Cutter */}
              <Marker 
                position={[-5, -100]} 
                icon={L.divIcon({
                  className: 'bg-transparent border-none',
                  html: `
                    <div class="relative flex items-center justify-center w-full h-full" style="filter: invert(1) hue-rotate(180deg) brightness(0.8)">
                      <div class="w-5 h-5 bg-sky-400 text-slate-900 rounded-full flex items-center justify-center shadow-[0_0_10px_#38bdf8] " style="transform: rotate(320deg); color: #0f172a;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-navigation"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                      </div>
                      <div class="absolute left-6 -top-1 bg-sky-900/90 text-sky-200 px-2.5 py-1 rounded-lg backdrop-blur-md whitespace-nowrap border border-sky-400/30 text-xs shadow-xl hidden md:block">
                        <span class="font-bold">USCG CUTTER ARGUS</span>
                        <div class="text-[10px] opacity-80">On patrol • 28 kts</div>
                      </div>
                    </div>
                  `,
                  iconSize: [20, 20],
                  iconAnchor: [10, 10]
                })} 
              />
            </MapContainer>
          </div>

          {/* Bottom Bar: Timeline & Scale */}
          <div className="z-20 w-full p-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
            {/* Scale Info */}
            <div className="pointer-events-auto flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md shadow-lg border border-white/15 text-xs text-slate-300">
              <span>Standard Projection</span>
              <span className="opacity-30">/</span>
              <div className="flex items-center gap-1.5">
                <span className="w-8 h-0.5 bg-sky-400 inline-block"></span>
                <span>25 Nautical Miles</span>
              </div>
              <span className="opacity-30">/</span>
              <span className="text-sky-400 font-bold">Live Satellite Feed</span>
            </div>

            {/* Time Timeline Playback Controller */}
            <div className="pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-900/90 backdrop-blur-md shadow-2xl border border-white/15">
              <button
                onClick={() => setTimelineProgress((p) => Math.max(0, p - 10))}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Rewind"
              >
                <span className="material-symbols-outlined text-base">skip_previous</span>
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-7 h-7 rounded-full bg-sky-500 flex items-center justify-center text-white hover:bg-sky-400 transition-colors cursor-pointer shadow-md"
                title={isPlaying ? 'Pause timeline' : 'Play timeline'}
              >
                <span className="material-symbols-outlined text-base">{isPlaying ? 'pause' : 'play_arrow'}</span>
              </button>
              <button
                onClick={() => setTimelineProgress((p) => Math.min(100, p + 10))}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Forward"
              >
                <span className="material-symbols-outlined text-base">skip_next</span>
              </button>
              <div className="flex items-center gap-2 text-xs text-white">
                <span className="text-sky-400 font-bold">
                  {timelineProgress === 100 ? 'Now (Live)' : `${Math.round((100 - timelineProgress) * 0.48)}h ago`}
                </span>
                <div
                  className="w-32 sm:w-40 h-2 bg-slate-700 rounded-full overflow-hidden relative cursor-pointer"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    setTimelineProgress(Math.round((clickX / rect.width) * 100));
                  }}
                >
                  <div
                    className="h-full bg-sky-400 rounded-full transition-all"
                    style={{ width: `${timelineProgress}%` }}
                  ></div>
                </div>
                <span className="text-[11px] text-slate-400">Past 48 Hours</span>
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="pointer-events-auto flex items-center gap-1 p-1 rounded-xl bg-slate-900/85 backdrop-blur-md shadow-lg border border-white/15">
              <button
                onClick={() => setZoomLevel((z) => Math.min(2, z + 0.15))}
                className="w-7 h-7 flex items-center justify-center text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Zoom In"
              >
                <span className="material-symbols-outlined text-base">add</span>
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.15))}
                className="w-7 h-7 flex items-center justify-center text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <span className="material-symbols-outlined text-base">remove</span>
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="w-7 h-7 flex items-center justify-center text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Reset Zoom"
              >
                <span className="material-symbols-outlined text-base">filter_center_focus</span>
              </button>
            </div>
          </div>
        </main>

        {/* RIGHT PANEL: Tactical Quick-Inspector Flyout */}
        <aside className="w-full lg:w-80 2xl:w-96 flex-shrink-0 z-20 flex flex-col gap-4">
          <div className="flex-1 rounded-2xl glass-panel p-4 flex flex-col justify-between overflow-y-auto">
            <div className="flex flex-col gap-3.5">
              {/* Card Header & Risk Badge */}
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${sc.bg}`}></span>
                    <span className={`text-xs uppercase font-bold ${sc.text}`}>
                      Selected Target • {sc.label}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedVessel.name}
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    ID: {selectedVessel.imo} • MMSI: {selectedVessel.mmsi}
                  </span>
                </div>

                {/* Score Pill */}
                <div className="flex flex-col items-end">
                  <div className={`px-3 py-1 rounded-xl ${sc.bgLight} ${sc.text} border ${sc.border} flex items-baseline gap-1 shadow-sm`}>
                    <span className="text-base font-bold">{selectedVessel.score}</span>
                    <span className="text-[10px]">/100</span>
                  </div>
                  <span className={`text-[10px] ${sc.text} font-bold uppercase mt-0.5`}>
                    Risk Score
                  </span>
                </div>
              </div>

              {/* Vessel Recon Photo Card */}
              <div className="relative w-full h-36 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-white/10">
                <img
                  className="w-full h-full object-cover"
                  alt={selectedVessel.name}
                  src={ASSETS_IMAGES.sarSatRecon}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/70 text-xs text-sky-400 backdrop-blur-md border border-sky-400/20">
                  <span className="material-symbols-outlined text-sm">photo_camera</span>
                  <span>Satellite Photo • Clear View</span>
                </div>
              </div>

              {/* Telemetry Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-white/5 flex flex-col gap-0.5">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Speed (Speed Over Ground)</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-white">
                    {selectedVessel.sogKts} knots (Drifting)
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-white/5 flex flex-col gap-0.5">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Direction Course</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-white">{selectedVessel.cogDirection}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-white/5 flex flex-col gap-0.5">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Water Depth / Weight</span>
                  <span className={`text-xs font-bold ${sc.text}`}>
                    {selectedVessel.calculatedDraft} ({selectedVessel.draftChange})
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-white/5 flex flex-col gap-0.5">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Last Signal Received</span>
                  <span className={`text-xs font-bold ${sc.text}`}>{selectedVessel.lastAisBroadcast}</span>
                </div>
              </div>

              {/* Legal & Ownership Details */}
              <div className="p-3 rounded-xl bg-white/50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-white/5 flex flex-col gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Country Flag:</span>
                  <span className="font-bold text-slate-800 dark:text-white">
                    {selectedVessel.flag}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Company Owner:</span>
                  <span className="font-bold text-slate-800 dark:text-white truncate max-w-[160px]">
                    {selectedVessel.beneficialOwner}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Fishing Permit:</span>
                  <span className={`font-bold ${sc.text} flex items-center gap-1`}>
                    <span className="material-symbols-outlined text-xs">{sc.permitIcon}</span>
                    {selectedVessel.rfmoAuthorization}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Fake Signal Risk:</span>
                  <span className={`font-bold ${sc.text}`}>{selectedVessel.aisSpoofingRisk}</span>
                </div>
              </div>

              {/* Violation Summary */}
              <div className={`p-3 rounded-xl ${sc.boxBg} border ${sc.boxBorder} flex items-start gap-2.5`}>
                <span className={`material-symbols-outlined ${sc.text} text-lg shrink-0 mt-0.5`}>
                  {sc.icon}
                </span>
                <div className={`text-xs ${sc.textDark} leading-relaxed`}>
                  <strong>{selectedVessel.dashboardStatus === "NORMAL" ? "Status" : "Warning"}:</strong> {selectedVessel.infractionAlert}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-4">
              <button
                onClick={() => {
                  onShowToast(
                    'RECON DRONE DISPATCHED',
                    `Drone locked on ${selectedVessel.name}. Reaching target in 35 minutes.`
                  );
                  onNavigate('interception-ops');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">flight_takeoff</span>
                <span>Send Recon Drone Now</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onNavigate('vessel-dossier')}
                  className="py-2 px-3 rounded-xl bg-white/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-200 dark:border-white/10 cursor-pointer shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm text-sky-600 dark:text-sky-400">folder_shared</span>
                  <span>Ship Profile</span>
                </button>
                <button
                  onClick={() => {
                    onShowToast(
                      'PORT POLICE ALERTED',
                      `Alert sent to nearby ports with evidence against ${selectedVessel.name}.`,
                      'error'
                    );
                  }}
                  className="py-2 px-3 rounded-xl bg-white/70 dark:bg-slate-800/70 hover:bg-red-500/10 text-slate-800 dark:text-slate-100 hover:text-red-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-200 dark:border-white/10 cursor-pointer shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm text-red-500">notification_important</span>
                  <span>Alert Port</span>
                </button>
                <button
                  onClick={() => onNavigate('ai-sentinel')}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-sky-500/20 to-indigo-500/20 hover:from-sky-500/30 hover:to-indigo-500/30 text-sky-600 dark:text-sky-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-sky-500/30 cursor-pointer shadow-sm mt-1"
                  title="Run real-time Google Search and Google Maps AI Agent Grounding"
                >
                  <span className="material-symbols-outlined text-sm">smart_toy</span>
                  <span>AI Agent Grounding Analysis</span>
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

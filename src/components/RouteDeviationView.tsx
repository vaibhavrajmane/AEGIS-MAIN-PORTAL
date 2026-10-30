import React, { useState } from 'react';
import { TargetVessel, NavigationScreen } from '../types';
import { ASSETS_IMAGES, TARGET_VESSELS } from '../data/mockData';
import { getVesselRoute } from '../data/vesselRoutes';
import { useLiveTelemetry } from '../context/LiveTelemetryContext';
import { TravelingRouteBeacon } from './TravelingRouteBeacon';

interface RouteDeviationViewProps {
  selectedVessel: TargetVessel;
  onSelectVessel: (vessel: TargetVessel) => void;
  onNavigate: (screen: NavigationScreen) => void;
  onShowToast: (title: string, message: string, type?: 'primary' | 'error' | 'success') => void;
}

export const RouteDeviationView: React.FC<RouteDeviationViewProps> = ({
  selectedVessel,
  onSelectVessel,
  onNavigate,
  onShowToast,
}) => {
  const { pulseActive, tick, liveVessels } = useLiveTelemetry();
  const [mapMode, setMapMode] = useState<'TRACK' | 'THERMAL' | 'SAR'>('TRACK');
  const [highSeverityOnly, setHighSeverityOnly] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeWaypoint, setActiveWaypoint] = useState<string | null>(null);

  const routeData = getVesselRoute(selectedVessel);
  
  const filteredAnomalies = highSeverityOnly
    ? routeData.anomalyTableStops.filter(
        (a) => a.severity === 'Severe Incursion' || a.severity === 'Critical Encounter'
      )
    : routeData.anomalyTableStops;

  const exportCsv = () => {
    onShowToast(
      'LOG EXPORTED',
      `Complete travel tracking data for ${selectedVessel.name} saved as CSV.`
    );
  };

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-7rem)] select-none p-4 sm:p-6 lg:p-8 gap-6 transition-colors">
      {/* Top Vessel Selector & Metrics Ribbon */}
      <div className="rounded-2xl glass-panel p-5 shadow-xl flex flex-col xl:flex-row items-start xl:items-center justify-between gap-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sky-600 dark:text-sky-400 text-2xl">polyline</span>
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Choose Ship to Inspect
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <select
                  value={selectedVessel.id}
                  onChange={(e) => {
                    const found = liveVessels.find((v) => v.id === e.target.value);
                    if (found) onSelectVessel(found);
                  }}
                  className="bg-white/80 dark:bg-slate-800 border border-slate-300 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer shadow-sm font-mono"
                >
                  {liveVessels.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.flagCode}) • Score {v.score} • {v.sogKts} kts
                    </option>
                  ))}
                </select>
                <span className="px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold border border-red-500/30 flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${pulseActive ? 'bg-emerald-400' : 'bg-red-500'}`}></span>
                  <span>Live Track</span>
                </span>
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200 dark:bg-white/10 hidden md:block"></div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Off-Route Detours</div>
              <div className="text-sm font-bold text-red-600 dark:text-red-400">{routeData.anomalyStops.length} Confirmed</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Excess Delay</div>
              <div className="text-sm font-bold text-red-600 dark:text-red-400">{routeData.extraDelayHours}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Live SOG / Course</div>
              <div className="text-sm font-bold text-sky-600 dark:text-sky-400 font-mono">{selectedVessel.sogKts} kts • {selectedVessel.cogDeg}°</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Detection Confidence</div>
              <div className="text-sm font-bold text-sky-600 dark:text-sky-400 font-mono">{selectedVessel.score}% Accurate</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('vessel-dossier')}
            className="px-3.5 py-1.5 rounded-xl glass-panel text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-sm text-sky-600 dark:text-sky-400">folder_open</span>
            <span>Ship Profile</span>
          </button>
          <button
            onClick={() => {
              onShowToast(
                'PATROL DISPATCHED',
                `Fast response cutter dispatched toward intercept point for ${selectedVessel.name}.`
              );
              onNavigate('interception-ops');
            }}
            className="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
          >
            <span className="material-symbols-outlined text-sm">flight_takeoff</span>
            <span>Send Patrol Boat</span>
          </button>
        </div>
      </div>

      {/* Split Dual Geospatial & Kinematic Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Map of Passage Reconstruction */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="rounded-2xl glass-panel p-5 shadow-xl flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-white/10 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                  Map of Actual vs. Planned Travel
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Direct commercial route vs. trespass into protected wildlife waters
                </span>
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center gap-1 p-1 bg-slate-200/50 dark:bg-slate-800/80 rounded-xl border border-slate-300/40 dark:border-white/10">
                <button
                  onClick={() => setMapMode('TRACK')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    mapMode === 'TRACK'
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Route Map
                </button>
                <button
                  onClick={() => setMapMode('THERMAL')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    mapMode === 'THERMAL'
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Heat Map
                </button>
                <button
                  onClick={() => setMapMode('SAR')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    mapMode === 'SAR'
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Satellite Radar
                </button>
              </div>
            </div>

            {/* Visual Canvas Map */}
            <div className="relative w-full h-[380px] rounded-2xl overflow-hidden bg-[#070e1b] border border-slate-200 dark:border-white/10 group">
              {/* Zoom Controls Overlay */}
              <div className="absolute top-3 right-3 z-20 flex items-center bg-slate-900/80 backdrop-blur-md rounded-xl border border-white/15 shadow-lg overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.2))}
                  className="px-2 py-1 text-white hover:bg-white/20 transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <span className="material-symbols-outlined text-[16px]">remove</span>
                </button>
                <div className="px-2 text-xs font-mono text-sky-400 border-x border-white/15">
                  {Math.round(zoomLevel * 100)}%
                </div>
                <button
                  onClick={() => setZoomLevel(z => Math.min(3, z + 0.2))}
                  className="px-2 py-1 text-white hover:bg-white/20 transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                </button>
              </div>

              {/* Zoomable Content Area */}
              <div 
                className="absolute inset-0 w-full h-full transition-transform duration-300 transform-origin-center"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <img
                  alt="Bathymetric map"
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    mapMode === 'THERMAL' ? 'opacity-30 invert' : mapMode === 'SAR' ? 'opacity-40 grayscale' : 'opacity-45'
                  }`}
                  src={ASSETS_IMAGES.bathymetryMap}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070e1b] via-transparent to-[#070e1b]/60 pointer-events-none"></div>

                {/* SVG Vector Overlays */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 400" preserveAspectRatio="none">
                {/* Declared Direct Course */}
                <path
                  d={routeData.plannedPathD}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  strokeDasharray="6,6"
                  strokeOpacity="0.8"
                />
                <text x={routeData.startPoint.x + 20} y={routeData.startPoint.y + 20} fill="#38bdf8" fontFamily="sans-serif" fontSize="11" fontWeight="bold">
                  PLANNED ROUTE
                </text>

                {/* Protected Sanctuary Zone */}
                <polygon
                  points={routeData.protectedZone.points}
                  fill="#c8a0f0"
                  fillOpacity="0.1"
                  stroke="#c8a0f0"
                  strokeWidth="2"
                  strokeDasharray="5,4"
                />
                <text x={routeData.protectedZone.labelX} y={routeData.protectedZone.labelY} fill="#e9d5ff" fontFamily="sans-serif" fontSize="12" fontWeight="bold">
                  {routeData.protectedZone.label}
                </text>

                {/* Actual Path */}
                <path
                  d={routeData.actualPathD}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="3.5"
                />

                {/* Interactive Waypoints */}
                <g onClick={() => setActiveWaypoint('START')} className="cursor-pointer">
                  <circle cx={routeData.startPoint.x} cy={routeData.startPoint.y} r="6" fill="#38bdf8" />
                  <text x={routeData.startPoint.x - 20} y={routeData.startPoint.y - 15} fill="#38bdf8" fontFamily="sans-serif" fontSize="10" fontWeight="bold">
                    Start
                  </text>
                </g>

                {routeData.anomalyStops.map((stop, idx) => (
                  <g key={stop.id} onClick={() => setActiveWaypoint(stop.id)} className="cursor-pointer">
                    <circle cx={stop.x} cy={stop.y} r="8" fill={stop.color} />
                    <text x={stop.x - 20} y={stop.y - 15} fill={stop.color} fontFamily="sans-serif" fontSize="10" fontWeight="bold">
                      {stop.name}
                    </text>
                  </g>
                ))}

                {/* Traveling Red Circle: strictly travels along the route from departure point to current location */}
                <TravelingRouteBeacon
                  pathD={routeData.actualPathD}
                  pathId={`deviation-actual-path-${selectedVessel.vesselCode}`}
                  durationSeconds={5.5}
                  label={selectedVessel.vesselCode}
                  showHeadingArrow={true}
                />

                {/* Current Position */}
                <g onClick={() => setActiveWaypoint('CURRENT')} className="cursor-pointer">
                  <circle cx={routeData.currentPoint.x} cy={routeData.currentPoint.y} r="9" fill="#ef4444" />
                  <circle cx={routeData.currentPoint.x} cy={routeData.currentPoint.y} r="22" fill="none" stroke="#ef4444" strokeWidth="2" opacity="0.7">
                    <animate attributeName="r" values="9;26;9" dur="1.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0;0.8" dur="1.8s" repeatCount="indefinite" />
                  </circle>
                  <text x={routeData.currentPoint.x - 30} y={routeData.currentPoint.y + 25} fill="#fca5a5" fontFamily="sans-serif" fontSize="11" fontWeight="bold">
                    NOW HERE
                  </text>
                </g>
              </svg>
              </div>

              {/* Waypoint Inspector Tooltip */}
              <div className="absolute bottom-3 left-3 bg-slate-900/90 text-white backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/15 text-xs flex items-center gap-3 shadow-lg pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span className="font-semibold text-slate-300">Selected Point:</span>
                <span className="text-sky-400 font-bold">{activeWaypoint || 'None'}</span>
                <span className="text-slate-300">
                  {activeWaypoint === 'START'
                    ? `${routeData.startPoint.label}`
                    : activeWaypoint === 'CURRENT'
                    ? `Current Position • Score: ${selectedVessel.score}`
                    : routeData.anomalyStops.find(s => s.id === activeWaypoint)?.activity || 'Select a point on the map to view details.'}
                </span>
              </div>
            </div>

            {/* Coordinates & Nav Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1 font-medium">
              <span>Area: South Pacific Ocean &amp; Wildlife Sanctuary</span>
              <span className="text-sky-600 dark:text-sky-400 font-semibold">Live Satellite Tracking Active</span>
            </div>
          </div>
        </div>

        {/* Right Column: Speed & Engine Profile */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="rounded-2xl glass-panel p-5 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                  Speed &amp; Engine Activity
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Zigzag fishing speeds compared to signal turn-offs
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 font-bold border border-red-500/30">
                Heavy Drag
              </span>
            </div>

            {/* Speed Graph */}
            <div className="relative w-full h-56 bg-white/50 dark:bg-slate-900/60 rounded-2xl p-3.5 border border-slate-200 dark:border-white/10 flex flex-col justify-between shadow-inner">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span>15 knots (Normal Cruise)</span>
                <span className="text-red-600 dark:text-red-400 font-bold">Signal Off (46h)</span>
                <span>Now (1.4 kts)</span>
              </div>

              <svg className="w-full h-36" viewBox="0 0 400 120" preserveAspectRatio="none">
                {/* Horizontal reference lines */}
                <line x1="0" y1="20" x2="400" y2="20" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.4" />
                <line x1="0" y1="60" x2="400" y2="60" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.4" />
                <line x1="0" y1="100" x2="400" y2="100" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.4" />

                {/* Dark Fleet Blackout Area */}
                <rect x="160" y="0" width="100" height="120" fill="#ef4444" fillOpacity="0.12" />
                <line x1="160" y1="0" x2="160" y2="120" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,3" />
                <line x1="260" y1="0" x2="260" y2="120" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,3" />

                {/* Gear drag threshold band */}
                <rect x="0" y="88" width="400" height="24" fill="#38bdf8" fillOpacity="0.1" />
                <text x="8" y="103" fill="#0284c7" fontFamily="sans-serif" fontSize="9" fontWeight="bold">
                  FISHING SPEED ZONE (0.5 - 2.5 knots)
                </text>

                {/* Speed Curve */}
                <path
                  d="M 0,35 L 50,38 L 80,42 L 100,98 L 120,86 L 135,102 L 150,90 L 160,95 L 260,98 L 290,105 L 320,88 L 350,96 L 380,30 L 400,98"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2.5"
                />
              </svg>

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span>Day 1 (Cruising)</span>
                <span>Day 8 (Slow Fishing)</span>
                <span>Day 14 (Beacon Off)</span>
                <span>Day 27 (Now)</span>
              </div>
            </div>

            {/* Signal Continuity Bar */}
            <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-700 dark:text-slate-200 font-semibold">Signal History Summary:</span>
                <span className="text-red-600 dark:text-red-400 font-bold">54% of Journey Unrecorded</span>
              </div>

              {/* Bar breakdown */}
              <div className="w-full h-3.5 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden flex">
                <div className="h-full bg-sky-500" style={{ width: '38%' }} title="Normal signal broadcast"></div>
                <div className="h-full bg-red-500" style={{ width: '46%' }} title="Signal turned off"></div>
                <div className="h-full bg-purple-500" style={{ width: '16%' }} title="Transfer meeting"></div>
              </div>

              <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                  <span>Normal Signal (38%)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  <span>Turned Off (46%)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                  <span>Boat Meeting (16%)</span>
                </span>
              </div>
            </div>

            {/* Anomaly Metrics */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white/50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-white/5">
                <div className="text-slate-500 dark:text-slate-400 font-medium">Repetitive Fishing Sweeps</div>
                <div className="text-sm font-bold text-red-600 dark:text-red-400 mt-0.5">38 Drag Passes</div>
              </div>
              <div className="p-3 rounded-xl bg-white/50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-white/5">
                <div className="text-slate-500 dark:text-slate-400 font-medium">Engine Strain Level</div>
                <div className="text-sm font-bold text-red-600 dark:text-red-400 mt-0.5">High Drag / Pulling Gear</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Log Table */}
      <div className="rounded-2xl glass-panel p-5 shadow-xl flex flex-col gap-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
              Detailed Log of Suspicious Stops &amp; Delays
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pattern detection matching fishing nets, squid jigs, and boat-to-boat cargo transfers
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={highSeverityOnly}
                onChange={(e) => setHighSeverityOnly(e.target.checked)}
                className="accent-sky-500 rounded w-4 h-4"
              />
              <span>High Risk Only</span>
            </label>

            <button
              onClick={exportCsv}
              className="px-3 py-1.5 rounded-xl bg-white/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-700 border border-slate-200 dark:border-white/10 text-xs font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 uppercase text-[11px]">
                <th className="pb-2.5 font-bold">Stop ID</th>
                <th className="pb-2.5 font-bold">Coordinates</th>
                <th className="pb-2.5 font-bold">Zone Name</th>
                <th className="pb-2.5 font-bold">Start Time</th>
                <th className="pb-2.5 font-bold">Time Stopped</th>
                <th className="pb-2.5 font-bold">Average Speed</th>
                <th className="pb-2.5 font-bold">Detected Activity</th>
                <th className="pb-2.5 font-bold text-right">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-white/5">
              {filteredAnomalies.map((anom) => (
                <tr key={anom.id} className="hover:bg-slate-200/40 dark:hover:bg-slate-800/40 transition-colors text-slate-800 dark:text-slate-200">
                  <td className="py-3 font-bold text-sky-600 dark:text-sky-400 font-mono">{anom.id}</td>
                  <td className="py-3 font-mono">{anom.coordinates}</td>
                  <td className="py-3 font-medium">{anom.jurisdiction}</td>
                  <td className="py-3 font-mono">{anom.startUtc}</td>
                  <td className="py-3 font-bold">{anom.duration}</td>
                  <td className="py-3 text-red-600 dark:text-red-400 font-semibold">{anom.driftSog}</td>
                  <td className="py-3">{anom.activityCluster}</td>
                  <td className="py-3 text-right">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                      style={{
                        backgroundColor: `${anom.clusterColor}20`,
                        color: anom.clusterColor,
                        borderColor: `${anom.clusterColor}40`,
                      }}
                    >
                      {anom.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Evidence Statement & Satellite Photo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl glass-panel border-red-500/40 p-5 shadow-xl flex flex-col justify-between gap-4 ring-1 ring-red-500/20">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                Official Evidence Summary • Maritime Authorities
              </h3>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
              Speed analysis and satellite imagery confirm <strong>FV HAI LONG 88</strong> engaged in systematic illegal squid fishing inside the protected wildlife sanctuary. Intentionally turning off the location tracker for 46 consecutive hours directly violates international maritime treaties.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400">Recommendation:</span>
              <strong className="text-red-600 dark:text-red-400 uppercase font-bold">BOARD &amp; DETAIN VESSEL</strong>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  onShowToast(
                    'NOTICE FILED',
                    'Official violation alert dispatched to Interpol and port authorities for FV HAI LONG 88.',
                    'error'
                  )
                }
                className="px-3.5 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-red-600 transition-colors cursor-pointer border border-slate-200 dark:border-white/10 shadow-sm"
              >
                Alert International Police
              </button>
              <button
                onClick={() => {
                  onShowToast(
                    'PATROL DIRECTIVE ISSUED',
                    'Coast Guard Cutter directed to set full speed intercept course.',
                    'primary'
                  );
                  onNavigate('interception-ops');
                }}
                className="px-4 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                Send Coast Guard Cutter
              </button>
            </div>
          </div>
        </div>

        {/* Satellite Evidence Box */}
        <div className="rounded-2xl glass-panel p-5 shadow-xl flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-sky-600 dark:text-sky-400 font-bold uppercase">Satellite Photo Proof</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Pass #842</span>
          </div>

          <div className="relative w-full h-36 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-white/10">
            <img
              alt="Satellite radar evidence"
              className="w-full h-full object-cover"
              src={ASSETS_IMAGES.sarMonochromeProof}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            <div className="absolute bottom-2 left-2 text-xs text-white font-medium">
              Radar Reflection Match: 99.8%
            </div>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Satellite photo confirms high-intensity squid lights and fishing nets were deployed in forbidden waters.
          </div>
        </div>
      </div>
    </div>
  );
};

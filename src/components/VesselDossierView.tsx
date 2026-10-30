import React, { useState } from 'react';
import { TargetVessel, NavigationScreen } from '../types';
import { ASSETS_IMAGES, TARGET_VESSELS } from '../data/mockData';
import { getVesselRoute } from '../data/vesselRoutes';
import { generateVesselPdfReport } from '../utils/pdfGenerator';
import { useLiveTelemetry } from '../context/LiveTelemetryContext';
import { TravelingRouteBeacon } from './TravelingRouteBeacon';

interface VesselDossierViewProps {
  selectedVessel: TargetVessel;
  onNavigate: (screen: NavigationScreen) => void;
  onShowToast: (title: string, message: string, type?: 'primary' | 'error' | 'success') => void;
  onSelectVessel?: (vessel: TargetVessel) => void;
}

export const VesselDossierView: React.FC<VesselDossierViewProps> = ({
  selectedVessel,
  onNavigate,
  onShowToast,
  onSelectVessel,
}) => {
  const { pulseActive, tick } = useLiveTelemetry();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showReportPreview, setShowReportPreview] = useState(false);
  const routeData = getVesselRoute(selectedVessel);

  const handleGeneratePdf = () => {
    setIsGeneratingPdf(true);
    try {
      generateVesselPdfReport(selectedVessel);
      onShowToast(
        'PDF REPORT GENERATED',
        `Surveillance and telemetry dossier for ${selectedVessel.name} downloaded successfully.`,
        'success'
      );
    } catch (err) {
      console.error('PDF error:', err);
      onShowToast('GENERATION FAILED', 'Could not compile PDF report.', 'error');
    } finally {
      setTimeout(() => setIsGeneratingPdf(false), 500);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-7rem)] select-none p-4 sm:p-6 lg:p-8 gap-6 transition-colors">
      {/* Top Breadcrumb & Quick Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          <button
            onClick={() => onNavigate('global-radar')}
            className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer font-semibold"
          >
            Ocean Radar
          </button>
          <span>/</span>
          <span className="text-slate-700 dark:text-slate-300">Ship Profile</span>
          <span>/</span>
          <span className="text-sky-600 dark:text-sky-400 font-bold">{selectedVessel.name}</span>

          {onSelectVessel && (
            <div className="ml-2 flex items-center gap-1.5">
              <select
                value={selectedVessel.vesselCode}
                onChange={(e) => {
                  const target = TARGET_VESSELS.find(v => v.vesselCode === e.target.value);
                  if (target) onSelectVessel(target);
                }}
                aria-label="Switch Ship Profile"
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-white/15 outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer shadow-sm"
              >
                {TARGET_VESSELS.map((v, i) => (
                  <option key={v.vesselCode} value={v.vesselCode}>
                    #{i + 1} {v.vesselCode}: {v.name} ({v.dashboardStatus} • Score: {v.score})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Generate PDF Report Button */}
          <button
            onClick={handleGeneratePdf}
            disabled={isGeneratingPdf}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-sky-500/20 disabled:opacity-60"
            title="Generate and download official PDF report summarizing intercepted telemetry and surveillance findings"
          >
            {isGeneratingPdf ? (
              <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-base">picture_as_pdf</span>
            )}
            <span>{isGeneratingPdf ? 'Generating PDF...' : 'Generate PDF Report'}</span>
          </button>

          {/* Report Summary Preview Button */}
          <button
            onClick={() => setShowReportPreview(true)}
            className="px-3.5 py-2 rounded-xl glass-panel text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="Preview telemetry and surveillance summary on screen"
          >
            <span className="material-symbols-outlined text-base text-sky-600 dark:text-sky-400">visibility</span>
            <span>Preview Summary</span>
          </button>

          <button
            onClick={() => {
              onShowToast(
                'POLICE NOTICE ISSUED',
                `Official violation alert broadcast to coast guards and port authorities for ${selectedVessel.name}.`,
                'error'
              );
            }}
            className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-base">emergency</span>
            <span>Alert Global Coast Guard</span>
          </button>

          <button
            onClick={() => onNavigate('ai-sentinel')}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            title="Launch live AI agent search and maps intelligence check"
          >
            <span className="material-symbols-outlined text-base">smart_toy</span>
            <span>AI Grounding Intel</span>
          </button>

          <button
            onClick={() => onNavigate('route-deviation')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <span>Inspect Route Delay</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* Main Vessel Header Card */}
      <div className="rounded-2xl glass-panel p-6 shadow-xl flex flex-col lg:flex-row gap-6 items-start justify-between">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="relative w-28 h-28 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-white/10 shrink-0 shadow-md">
            <img
              alt="Ship photo"
              className="w-full h-full object-cover"
              src={ASSETS_IMAGES.vesselProfilePhoto}
            />
            <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md bg-red-500 text-[10px] font-bold text-white uppercase shadow">
              High Alert
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono px-2.5 py-1 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-400 font-extrabold text-xs border border-sky-500/30">
                {selectedVessel.vesselCode}
              </span>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                "{selectedVessel.nickname}" <span className="text-slate-500 text-lg font-normal">({selectedVessel.name})</span>
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold border border-red-500/30">
                {selectedVessel.dashboardStatus} ({selectedVessel.score}/100)
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>MMSI: <strong className="text-slate-800 dark:text-white">{selectedVessel.mmsi}</strong></span>
              <span>IMO: <strong className="text-slate-800 dark:text-white">{selectedVessel.imo}</strong></span>
              <span>Radio: <strong className="text-slate-800 dark:text-white">{selectedVessel.callsign}</strong></span>
              <span>Country: <strong className="text-red-600 dark:text-red-400 font-bold">{selectedVessel.flag}</strong></span>
              <span>Type: <strong className="text-slate-800 dark:text-white">{selectedVessel.type}</strong></span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
              <span>Weight: <strong className="text-slate-800 dark:text-white">{selectedVessel.displacement}</strong></span>
              <span>•</span>
              <span>Length: <strong className="text-slate-800 dark:text-white">{selectedVessel.lengthMeters}m</strong></span>
              <span>•</span>
              <span>Crew: <strong className="text-slate-800 dark:text-white">{selectedVessel.crewCount} People</strong></span>
              <span>•</span>
              <span>Owner: <strong className="text-slate-800 dark:text-white">{selectedVessel.beneficialOwner}</strong></span>
            </div>
          </div>
        </div>

        {/* Warning Badge Block & Algorithmic Trigger */}
        <div className="flex flex-col gap-2 max-w-md lg:text-right">
          <div className="inline-flex items-center lg:justify-end gap-2 px-3 py-1.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold">
            <span className="material-symbols-outlined text-sm animate-pulse">crisis_alert</span>
            <span>{selectedVessel.systemAction}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-200/60 dark:bg-slate-800/60 border border-slate-300 dark:border-white/10 text-xs text-left">
            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              AEGIS Behavioral Trigger ({selectedVessel.algorithmUsed.split(' ')[0]}):
            </div>
            <p className="text-slate-800 dark:text-slate-200 font-medium mt-0.5">
              {selectedVessel.behavioralTrigger}
            </p>
          </div>
        </div>
      </div>

      {/* 5 Journey Metrics Matrix Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl glass-card flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Departure Port</span>
          <span className="text-base font-bold text-slate-900 dark:text-white">{routeData.departurePort}</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Departed {routeData.departureDate}</span>
        </div>

        <div className="p-4 rounded-2xl glass-card flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Stated Destination</span>
          <span className="text-base font-bold text-slate-900 dark:text-white">{routeData.destinationPort}</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Claimed direct trip</span>
        </div>

        <div className="p-4 rounded-2xl glass-card flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Expected Trip Time</span>
          <span className="text-base font-bold text-sky-600 dark:text-sky-400">{routeData.expectedTripTime}</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Estimated {routeData.expectedDistanceMiles}</span>
        </div>

        <div className="p-4 rounded-2xl glass-card flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Actual Time Taken</span>
          <span className="text-base font-bold text-red-600 dark:text-red-400">{routeData.actualTimeTaken}</span>
          <span className="text-[11px] text-red-600 dark:text-red-400 font-semibold">{routeData.timeDeviationPercent}</span>
        </div>

        <div className="p-4 rounded-2xl glass-card flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Extra Delay / Stopping</span>
          <span className="text-base font-bold text-red-600 dark:text-red-400">{routeData.extraDelayHours}</span>
          <span className="text-[11px] text-red-600 dark:text-red-400 font-semibold">{routeData.delayStopsSummary}</span>
        </div>
      </div>

      {/* Real-time Telemetry Sensor Stream Strip */}
      <div className="rounded-2xl glass-panel p-4 shadow-lg border border-sky-500/20 bg-sky-500/5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${pulseActive ? 'bg-emerald-400 scale-125' : 'bg-sky-500'} transition-all`}></span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Live Telemetry Feed (2.5s Sync)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-sky-500/20 text-sky-600 dark:text-sky-300 font-bold">STREAMING</span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Direct satellite transponder &amp; Doppler radar link</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs font-mono">
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase">Speed (SOG)</span>
            <span className="font-bold text-sky-600 dark:text-sky-400 text-sm">{selectedVessel.sogKts} kts</span>
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-white/10 hidden sm:block"></div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase">Course (COG)</span>
            <span className="font-bold text-slate-800 dark:text-white text-sm">{selectedVessel.cogDeg}°</span>
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-white/10 hidden sm:block"></div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase">Hull Draft</span>
            <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">{selectedVessel.calculatedDraft}</span>
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-white/10 hidden sm:block"></div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase">Engine Load</span>
            <span className="font-bold text-slate-800 dark:text-white text-sm">{Math.round(820 + (selectedVessel.sogKts * 32))} RPM</span>
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-white/10 hidden sm:block"></div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase">Fuel Burn Rate</span>
            <span className="font-bold text-slate-800 dark:text-white text-sm">{Math.round(250 + (selectedVessel.sogKts * 22))} L/h</span>
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-white/10 hidden sm:block"></div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase">Live Coordinates</span>
            <span className="font-bold text-sky-600 dark:text-sky-400 text-xs">{selectedVessel.currentCoordinates}</span>
          </div>
        </div>
      </div>

      {/* Planned Course vs Actual Track Deviation Map Card */}
      <div className="rounded-2xl glass-panel p-5 shadow-xl flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-sky-600 dark:text-sky-400 text-xl">route</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                  Planned Route vs. Actual Route Map
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30">
                  {selectedVessel.vesselCode} • {selectedVessel.nickname}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct expected route (Blue) compared to real zigzagging path and stops (Red) for {selectedVessel.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-1 bg-sky-500 rounded-full inline-block"></span>
              <span className="text-slate-700 dark:text-slate-300">Declared Route</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-1 bg-red-500 rounded-full inline-block"></span>
              <span className="text-red-600 dark:text-red-400 font-bold">Real Suspicious Path</span>
            </div>
          </div>
        </div>

        {/* Visual Map Underlay Canvas */}
        <div className="relative w-full h-84 rounded-2xl overflow-hidden bg-[#070e1b] border border-slate-200 dark:border-white/10">
          <img
            alt="Nautical chart satellite overlay"
            className="w-full h-full object-cover opacity-50 mix-blend-screen"
            src={ASSETS_IMAGES.southAmericaSatMap}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070e1b] via-transparent to-[#070e1b]/70"></div>

          {/* SVG Route Overlay with Dynamic Coordinates for Each Ship */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 400" preserveAspectRatio="none">
            <defs>
              <filter id="routeRedGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Grid lines */}
            <line x1="0" y1="100" x2="1000" y2="100" stroke="#7dd3fc" strokeWidth="0.5" strokeOpacity="0.15" />
            <line x1="0" y1="200" x2="1000" y2="200" stroke="#7dd3fc" strokeWidth="0.5" strokeOpacity="0.15" />
            <line x1="0" y1="300" x2="1000" y2="300" stroke="#7dd3fc" strokeWidth="0.5" strokeOpacity="0.15" />

            {/* Direct Planned Route (Cyan dashed) */}
            <path
              d={routeData.plannedPathD}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeDasharray="6,6"
              strokeOpacity="0.85"
            />
            {/* Start and Destination Markers */}
            <circle cx={routeData.startPoint.x} cy={routeData.startPoint.y} r={6} fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
            <circle cx={routeData.startPoint.x} cy={routeData.startPoint.y} r={2.5} fill="#ffffff" />
            <circle cx={routeData.destPoint.x} cy={routeData.destPoint.y} r={6} fill="#0284c7" stroke="#ffffff" strokeWidth="2" strokeDasharray="2,2" />
            <circle cx={routeData.destPoint.x} cy={routeData.destPoint.y} r={2.5} fill="#38bdf8" />

            <text
              x={Math.max(20, routeData.startPoint.x - 20)}
              y={Math.min(380, routeData.startPoint.y + 25)}
              fill="#38bdf8"
              fontFamily="sans-serif"
              fontSize="11"
              fontWeight="bold"
            >
              {routeData.startPoint.label}
            </text>
            <text
              x={Math.max(20, Math.min(800, routeData.destPoint.x - 140))}
              y={Math.max(25, routeData.destPoint.y - 15)}
              fill="#38bdf8"
              fontFamily="sans-serif"
              fontSize="11"
              fontWeight="bold"
            >
              {routeData.destPoint.label}
            </text>

            {/* Protected Zone */}
            <polygon
              points={routeData.protectedZone.points}
              fill="#c8a0f0"
              fillOpacity="0.12"
              stroke="#c8a0f0"
              strokeWidth="1.5"
              strokeDasharray="4,4"
            />
            <text
              x={routeData.protectedZone.labelX}
              y={routeData.protectedZone.labelY}
              fill="#e9d5ff"
              fontFamily="sans-serif"
              fontSize="11"
              fontWeight="bold"
            >
              {routeData.protectedZone.label}
            </text>

            {/* Real Deviated Path for This Vessel */}
            <path
              d={routeData.actualPathD}
              fill="none"
              stroke="#ef4444"
              strokeWidth="3.5"
            />

            {/* Live Current Location Anchor Pin */}
            {routeData.currentPoint && (
              <g>
                <circle
                  cx={routeData.currentPoint.x}
                  cy={routeData.currentPoint.y}
                  r={14}
                  fill="#ef4444"
                  fillOpacity="0.2"
                  stroke="#ef4444"
                  strokeWidth="1.5"
                />
                <circle
                  cx={routeData.currentPoint.x}
                  cy={routeData.currentPoint.y}
                  r={6}
                  fill="#dc2626"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              </g>
            )}

            {/* Dynamic Stop Clusters for This Vessel (Kept intact with exact unchanged coordinates) */}
            {routeData.anomalyStops.map((stop, idx) => (
              <g key={stop.id || idx}>
                <circle
                  cx={stop.x}
                  cy={stop.y}
                  r={14}
                  fill={stop.color || '#ef4444'}
                  fillOpacity="0.25"
                  stroke={stop.color || '#ef4444'}
                  strokeWidth="1.5"
                />
                <circle cx={stop.x} cy={stop.y} r={4.5} fill={stop.color || '#ef4444'} />
                <text
                  x={Math.max(10, Math.min(880, stop.x - 30))}
                  y={stop.y > 200 ? stop.y + 25 : stop.y - 15}
                  fill={stop.color === '#c8a0f0' ? '#e9d5ff' : stop.color === '#f59e0b' ? '#fde68a' : '#fca5a5'}
                  fontFamily="sans-serif"
                  fontSize="10"
                  fontWeight="bold"
                >
                  {stop.name}
                </text>
              </g>
            ))}

            {/* Traveling Red Circle: strictly travels along the route from departure point to current location */}
            <TravelingRouteBeacon
              pathD={routeData.actualPathD}
              pathId={`dossier-actual-path-${selectedVessel.vesselCode}`}
              durationSeconds={5.5}
              label={selectedVessel.vesselCode}
              showHeadingArrow={true}
            />
          </svg>
        </div>
      </div>

      {/* Chronological Dwell Stop Registry Cards */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
            Timeline of Suspicious Stops &amp; Delays ({selectedVessel.name})
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">{routeData.delayStopsSummary}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {routeData.anomalyStops.map((stop, idx) => (
            <div
              key={stop.id || idx}
              className={`p-4 rounded-2xl glass-card flex flex-col gap-2 ${
                stop.severity === 'Severe Incursion'
                  ? 'border-red-500/40 ring-1 ring-red-500/20'
                  : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold ${
                    stop.severity === 'Severe Incursion'
                      ? 'text-red-600 dark:text-red-400'
                      : stop.severity === 'Critical Encounter'
                      ? 'text-purple-600 dark:text-purple-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {stop.name}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    stop.severity === 'Severe Incursion'
                      ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                      : stop.severity === 'Critical Encounter'
                      ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                      : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  Duration {stop.hours}
                </span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between gap-2 py-1 px-2.5 rounded-lg bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-white/10">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Stoppage Coordinates:</span>
                <strong className="font-mono text-xs font-bold text-sky-700 dark:text-sky-300 tracking-tight bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                  {stop.coordinates || routeData.anomalyTableStops[idx]?.coordinates || selectedVessel.currentCoordinates}
                </strong>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {stop.activity}
              </p>
              <div className="pt-2 mt-auto border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">Severity: {stop.severity}</span>
                <span className="text-red-600 dark:text-red-400 font-bold">Logged in Matrix</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Historical Travel Logs Table */}
      <div className="rounded-2xl glass-panel p-5 shadow-xl flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
            Past Trips &amp; Violation Record ({selectedVessel.vesselCode})
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {routeData.voyages.length} Recorded Trips
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 uppercase text-[11px]">
                <th className="pb-2.5 font-bold">Trip ID</th>
                <th className="pb-2.5 font-bold">Departure → Destination</th>
                <th className="pb-2.5 font-bold">Scheduled vs Actual</th>
                <th className="pb-2.5 font-bold">Extra Delay</th>
                <th className="pb-2.5 font-bold">Suspicious Stops</th>
                <th className="pb-2.5 font-bold text-right">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-white/5">
              {routeData.voyages.map((vy) => (
                <tr
                  key={vy.id}
                  className={`hover:bg-slate-200/40 dark:hover:bg-slate-800/40 transition-colors ${
                    vy.isActualHighlight
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400 font-semibold'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <td className="py-2.5 font-mono">{vy.id}</td>
                  <td className="py-2.5 font-medium">{vy.originDest}</td>
                  <td className="py-2.5">{vy.schedVsActual}</td>
                  <td className="py-2.5">{vy.excessDelay}</td>
                  <td className="py-2.5">{vy.stopEvents}</td>
                  <td className="py-2.5 text-right">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        vy.threatLevel === 'CRITICAL'
                          ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
                          : vy.threatLevel === 'HIGH'
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          : 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                      }`}
                    >
                      {vy.threatLabel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Smart Risk Score Breakdown & Satellite Evidence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Risk Score Breakdown */}
        <div className="rounded-2xl glass-panel p-5 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Risk Score Breakdown
            </h3>
            <span className="text-[11px] bg-red-500/15 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-bold border border-red-500/30">
              98% Confidence
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200 dark:text-slate-800"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="text-red-500 transition-all duration-700"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray={`${selectedVessel.score}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-xl font-bold text-red-600 dark:text-red-400 font-mono">{selectedVessel.score}</span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Total Risk</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span>Sanctuary Trespassing:</span>
                <span className="font-bold text-red-600 dark:text-red-400">+42 pts</span>
              </div>
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span>Signal Turned Off (&gt;6h):</span>
                <span className="font-bold text-red-600 dark:text-red-400">+28 pts</span>
              </div>
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span>Open-Sea Cargo Transfer:</span>
                <span className="font-bold text-red-600 dark:text-red-400">+14 pts</span>
              </div>
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span>Flag of Convenience:</span>
                <span className="font-bold text-red-600 dark:text-red-400">+10 pts</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white/60 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-white/10">
            <strong>Summary:</strong> This ship matches the behavior of unauthorized squid fishing fleets. Its movements confirm deliberate illegal fishing in protected waters. We recommend immediate interception by the Coast Guard patrol cutter.
          </p>
        </div>

        {/* Satellite Photo Proof */}
        <div className="rounded-2xl glass-panel p-5 shadow-xl flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Satellite Photo Evidence
            </h3>
            <span className="text-xs text-sky-600 dark:text-sky-400 font-semibold">Taken 3 hours ago</span>
          </div>

          <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-white/10">
            <img
              alt="Satellite photo match"
              className="w-full h-full object-cover"
              src={ASSETS_IMAGES.infraredJiggingSat}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-black/70 text-xs text-red-400 backdrop-blur-md border border-red-500/30 font-semibold">
              High-Powered Fishing Lights Spotted
            </div>
            <div className="absolute bottom-2 left-2 text-xs text-slate-300">
              Ship Length: 73.4m • Fishing gear clearly deployed in water
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Match: Industrial Squid Fishing Boat</span>
            <button
              onClick={() => onNavigate('interception-ops')}
              className="text-sky-600 dark:text-sky-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Launch Drone Interception</span>
              <span className="material-symbols-outlined text-sm">open_in_new</span>
            </button>
          </div>
        </div>
      </div>

      {/* PDF Report On-Screen Summary Preview Modal */}
      {showReportPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] glass-panel rounded-3xl border border-slate-300 dark:border-white/20 shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-sky-400 text-2xl">picture_as_pdf</span>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Official Surveillance &amp; Telemetry Dossier</h3>
                  <p className="text-[11px] text-slate-400">Summary of intercepted telemetry &amp; forensic findings</p>
                </div>
              </div>
              <button
                onClick={() => setShowReportPreview(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 dark:text-slate-200">
              {/* Vessel Header */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-600 dark:text-sky-400">
                      {selectedVessel.vesselCode}
                    </span>
                    <div className="text-base font-bold text-slate-900 dark:text-white">
                      "{selectedVessel.nickname}" • {selectedVessel.name}
                    </div>
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                    MMSI: {selectedVessel.mmsi} • Flag: {selectedVessel.flag} ({selectedVessel.flagCode}) • IMO: {selectedVessel.imo}
                  </div>
                  <div className="text-amber-600 dark:text-amber-400 text-[11px] font-medium mt-1">
                    Trigger: {selectedVessel.behavioralTrigger}
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 font-bold border border-red-500/30">
                  {selectedVessel.dashboardStatus} ({selectedVessel.score}/100)
                </span>
              </div>

              {/* Intercepted Telemetry */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  1. Current Intercepted Telemetry
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Coordinates</div>
                    <div className="font-bold text-sky-600 dark:text-sky-400 text-xs mt-0.5">{selectedVessel.currentCoordinates}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Speed (SOG)</div>
                    <div className="font-bold text-red-600 dark:text-red-400 text-xs mt-0.5">{selectedVessel.sogKts} kts</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Heading (COG)</div>
                    <div className="font-bold text-slate-800 dark:text-white text-xs mt-0.5">{selectedVessel.cogDeg}° ({selectedVessel.cogDirection})</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Tracker Status</div>
                    <div className="font-bold text-red-600 dark:text-red-400 text-xs mt-0.5">Off 46 Hours</div>
                  </div>
                </div>
              </div>

              {/* Surveillance Findings */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  2. Surveillance Findings &amp; Evidence
                </h4>
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-red-500 text-base mt-0.5">warning</span>
                    <div>
                      <strong className="text-slate-900 dark:text-white">Sanctuary Incursion:</strong>
                      <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                        Deliberate route diversion of 380 NM directly into strictly protected wildlife waters without authorization.
                      </p>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-red-500 text-base mt-0.5">cyclone</span>
                    <div>
                      <strong className="text-slate-900 dark:text-white">Active Fishing Pattern:</strong>
                      <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                        Radar Doppler verified 38 characteristic squid jigging sweeps at low drag speeds (0.8–1.3 kts).
                      </p>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-purple-500 text-base mt-0.5">sync_alt</span>
                    <div>
                      <strong className="text-slate-900 dark:text-white">High-Seas Cargo Transfer:</strong>
                      <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                        Tied alongside reefer HAI QING 12 for 18h; hull draft calculation rose +0.45m following cargo offload.
                      </p>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-sky-500 text-base mt-0.5">satellite_alt</span>
                    <div>
                      <strong className="text-slate-900 dark:text-white">Satellite SAR Verification:</strong>
                      <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                        Copernicus radar pass #842 matched 73.4m hull with active luminescent fishing arms deployed (99.8% match).
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legal Mandate */}
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/25">
                <div className="font-bold text-red-600 dark:text-red-400 text-xs flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">gavel</span>
                  <span>Legal Enforcement Mandate (UNCLOS Articles 62, 73 &amp; 111)</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-1 leading-relaxed">
                  USCGC Vigilant is legally authorized to execute hot pursuit, board vessel, seize fish holds and logbooks, and escort crew to nearest designated port authority for formal judicial impoundment.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-100/80 dark:bg-slate-900/80 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
              <button
                onClick={() => setShowReportPreview(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Close Preview
              </button>

              <button
                onClick={() => {
                  handleGeneratePdf();
                  setShowReportPreview(false);
                }}
                disabled={isGeneratingPdf}
                className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-base">download</span>
                <span>Download Official PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { TargetVessel } from '../types';
import { ASSETS_IMAGES } from '../data/mockData';
import { useLiveTelemetry } from '../context/LiveTelemetryContext';

interface InterceptionOpsViewProps {
  selectedVessel: TargetVessel;
  onShowToast: (title: string, message: string, type?: 'primary' | 'error' | 'success') => void;
}

export const InterceptionOpsView: React.FC<InterceptionOpsViewProps> = ({
  selectedVessel,
  onShowToast,
}) => {
  const { interceptMetrics, pulseActive, tick } = useLiveTelemetry();
  const [activeLayers, setActiveLayers] = useState({
    radarRange: true,
    aisSar: true,
    interceptCones: true,
  });

  const [boardingAuthorized, setBoardingAuthorized] = useState(false);
  const [radioHailed, setRadioHailed] = useState(false);

  const toggleLayer = (layer: keyof typeof activeLayers) => {
    setActiveLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  const handleAuthorizeBoarding = () => {
    setBoardingAuthorized(true);
    onShowToast(
      'BOARDING PERMITTED',
      `Coast Guard boarding crew cleared to board and inspect ${selectedVessel.name}.`,
      'error'
    );
  };

  const handleRadioHail = () => {
    setRadioHailed(true);
    onShowToast(
      'RADIO WARNING SENT',
      `Official warning broadcast on emergency channel VHF 16 to ${selectedVessel.name}: Stop engines immediately.`,
      'primary'
    );
  };

  const handleFullIntercept = () => {
    onShowToast(
      'CUTTER AT FULL SPEED',
      `Coast Guard Cutter Vigilant accelerating to 28 knots. Drone spotlight locked on ${selectedVessel.name}.`,
      'primary'
    );
  };

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-7rem)] select-none p-4 sm:p-6 lg:p-8 gap-6 transition-colors">
      {/* Top Telemetry Header Bar */}
      <div className="w-full rounded-2xl glass-panel p-5 shadow-xl flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-600 dark:text-red-400 shadow-sm">
              <span className="material-symbols-outlined text-xl">shield</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold tracking-wider text-red-600 dark:text-red-400 uppercase">
                Active Intercept Mission
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <h1 className="text-base font-bold text-slate-900 dark:text-white">Coast Guard Intercept Control</h1>
                <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-[10px] font-bold border border-red-500/30 animate-pulse">
                  High Alert
                </span>
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200 dark:bg-white/10 hidden md:block"></div>

          <div className="flex flex-wrap items-center gap-5 text-xs">
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Active Missions</div>
              <div className="text-sm font-bold text-red-600 dark:text-red-400">3 Priority</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Intercept Likelihood</div>
              <div className="text-sm font-bold text-sky-600 dark:text-sky-400">{interceptMetrics.interceptLikelihoodPct}% Projected</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Cutter Speed / Fuel</div>
              <div className="text-sm font-bold text-slate-800 dark:text-white">{interceptMetrics.cutterSpeedKts} kts • {interceptMetrics.cutterFuelPct}% Fuel</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Recon Drone Altitude</div>
              <div className="text-sm font-bold text-purple-600 dark:text-purple-400">{interceptMetrics.droneAltitudeFt.toLocaleString()} ft</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              onShowToast(
                'CASE FILE EXPORTED',
                'Official prosecution packet exported for maritime court review.'
              )
            }
            className="px-3.5 py-1.5 rounded-xl glass-panel text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-sm text-sky-600 dark:text-sky-400">cloud_download</span>
            <span>Export Case File</span>
          </button>
        </div>
      </div>

      {/* Main Dual Interdiction Theater */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Tactical Intercept Map */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="rounded-2xl glass-panel p-5 shadow-xl flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-white/10 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                  Live Intercept Map &amp; Distance
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time intercept path &amp; patrol vessel approach
                </span>
              </div>

              {/* Layer toggles */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-200/50 dark:bg-slate-800/80 rounded-xl border border-slate-300/40 dark:border-white/10 text-xs">
                <button
                  onClick={() => toggleLayer('radarRange')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    activeLayers.radarRange
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Distance Rings
                </button>
                <button
                  onClick={() => toggleLayer('aisSar')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    activeLayers.aisSar
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Signals + Sat
                </button>
                <button
                  onClick={() => toggleLayer('interceptCones')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    activeLayers.interceptCones
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Approach Cone
                </button>
              </div>
            </div>

            {/* Tactical Radar Display Canvas */}
            <div className="relative w-full h-[400px] rounded-2xl overflow-hidden bg-[#040914] border border-slate-200 dark:border-white/10">
              <img
                alt="Radar underlay"
                className="w-full h-full object-cover opacity-35"
                src={ASSETS_IMAGES.bathymetryMap}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#040914] via-transparent to-[#040914]/70"></div>

              {/* Tactical SVG Geometry */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 700 400" preserveAspectRatio="none">
                {/* Distance Rings */}
                {activeLayers.radarRange && (
                  <g>
                    <circle
                      cx="480"
                      cy="200"
                      r="70"
                      fill="none"
                      stroke="#ff6b6b"
                      strokeWidth="0.8"
                      strokeDasharray="4,4"
                      strokeOpacity="0.4"
                    />
                    <text x="555" y="204" fill="#fca5a5" fontFamily="sans-serif" fontSize="9">
                      10 Miles
                    </text>

                    <circle
                      cx="480"
                      cy="200"
                      r="140"
                      fill="none"
                      stroke="#ff6b6b"
                      strokeWidth="0.8"
                      strokeDasharray="4,4"
                      strokeOpacity="0.3"
                    />
                    <text x="625" y="204" fill="#fca5a5" fontFamily="sans-serif" fontSize="9">
                      20 Miles
                    </text>

                    <circle
                      cx="480"
                      cy="200"
                      r="220"
                      fill="none"
                      stroke="#ff6b6b"
                      strokeWidth="0.6"
                      strokeDasharray="6,6"
                      strokeOpacity="0.2"
                    />
                    <text x="700" y="204" fill="#fca5a5" fontFamily="sans-serif" fontSize="9">
                      35 Miles
                    </text>
                  </g>
                )}

                {/* Sanctuary Boundary */}
                <path
                  d="M 100,20 L 320,180 L 380,380"
                  fill="none"
                  stroke="#c8a0f0"
                  strokeWidth="2"
                  strokeDasharray="8,6"
                />
                <text x="140" y="70" fill="#e9d5ff" fontFamily="sans-serif" fontSize="11" fontWeight="bold">
                  PROTECTED WILDLIFE BORDER
                </text>

                {/* Intercept Approach Fan */}
                {activeLayers.interceptCones && (
                  <polygon
                    points="140,280 460,170 470,230"
                    fill="#38bdf8"
                    fillOpacity="0.1"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    strokeDasharray="4,4"
                  />
                )}

                {/* Coast Guard Cutter Approach Line */}
                <line x1="140" y1="280" x2="480" y2="200" stroke="#38bdf8" strokeWidth="2.5" />
                <circle cx="140" cy="280" r="7" fill="#38bdf8" />
                <text x="60" y="270" fill="#38bdf8" fontFamily="sans-serif" fontSize="11" fontWeight="bold">
                  COAST GUARD CUTTER VIGILANT
                </text>
                <text x="70" y="285" fill="#bae6fd" fontFamily="sans-serif" fontSize="10">
                  Speed {interceptMetrics.cutterSpeedKts} knots • ETA {interceptMetrics.etaFormatted}
                </text>

                {/* Recon Drone Circling */}
                <ellipse
                  cx="480"
                  cy="200"
                  rx="90"
                  ry="50"
                  fill="none"
                  stroke="#a78bfa"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                />
                <circle cx="560" cy="180" r="5" fill="#a78bfa" />
                <text x="575" y="180" fill="#ddd6fe" fontFamily="sans-serif" fontSize="10" fontWeight="bold">
                  RECON DRONE (OVERHEAD)
                </text>

                {/* Target Vessel */}
                <circle cx="480" cy="200" r="9" fill="#ef4444" />
                <circle cx="480" cy="200" r="24" fill="none" stroke="#ef4444" strokeWidth="1.5">
                  <animate attributeName="r" values="9;28;9" dur="1.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0;1" dur="1.8s" repeatCount="indefinite" />
                </circle>
                <line x1="480" y1="200" x2="540" y2="240" stroke="#ef4444" strokeWidth="2" strokeDasharray="3,3" />
                <text x="495" y="165" fill="#fca5a5" fontFamily="sans-serif" fontSize="12" fontWeight="bold">
                  TARGET: {selectedVessel.name}
                </text>
                <text x="495" y="180" fill="#fca5a5" fontFamily="sans-serif" fontSize="10">
                  Moving at {selectedVessel.sogKts} knots ({selectedVessel.cogDirection})
                </text>
              </svg>

              {/* Live HUD telemetry tag */}
              <div className="absolute top-3 left-3 bg-slate-900/90 text-white backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/15 text-xs flex items-center gap-3 shadow-lg">
                <span className={`w-2 h-2 rounded-full ${pulseActive ? 'bg-emerald-400 scale-125' : 'bg-red-500'} transition-all`}></span>
                <span>Distance to Boat:</span>
                <strong className="text-sky-400 font-bold font-mono">{interceptMetrics.distanceMiles} Miles</strong>
                <span className="opacity-30">|</span>
                <span>Time to Intercept:</span>
                <strong className="text-red-400 font-bold font-mono">{interceptMetrics.etaFormatted}</strong>
              </div>
            </div>

            {/* Asset Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-2xl glass-panel border-sky-500/30 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-600 dark:text-sky-400">Coast Guard Cutter Vigilant</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 font-bold">
                    Top Speed ({interceptMetrics.cutterSpeedKts} kts)
                  </span>
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-300">
                  Speed: <strong className="font-mono">{interceptMetrics.cutterSpeedKts} knots</strong> • Engine: <strong className="font-mono">{interceptMetrics.engineRpm} RPM</strong>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Fuel: {interceptMetrics.cutterFuelPct}% • Inspection team &amp; boarding craft on standby.
                </div>
              </div>

              <div className="p-3.5 rounded-2xl glass-panel border-purple-500/30 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400">Recon Drone (Air Wing)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold">
                    Circling Target
                  </span>
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-300">
                  Altitude: <strong className="font-mono">{interceptMetrics.droneAltitudeFt.toLocaleString()} ft</strong> • Range: <strong className="font-mono">{interceptMetrics.droneDistanceMiles} NM</strong>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Continuous optical &amp; infrared tracking locked directly on target deck.
                </div>
              </div>
            </div>

            {/* DUAL LIVE SENSOR FEEDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Drone Camera Stream */}
              <div className="rounded-2xl overflow-hidden glass-panel border border-slate-200 dark:border-white/10 flex flex-col">
                <div className="p-2.5 bg-white/70 dark:bg-slate-800/70 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                    <span className="font-bold text-slate-800 dark:text-white">Drone Camera (Infrared)</span>
                  </div>
                  <span className="text-[10px] text-red-600 dark:text-red-400 font-bold">Live Stream</span>
                </div>
                <div className="relative w-full h-44 bg-black">
                  <img
                    alt="Thermal drone stream"
                    className="w-full h-full object-cover"
                    src={ASSETS_IMAGES.droneThermalStream}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-16 h-16 border border-sky-400/60 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-2 text-[10px] text-sky-400 bg-black/80 px-2.5 py-0.5 rounded-md font-mono">
                    Distance: {interceptMetrics.droneDistanceMiles} Miles • Alt: {interceptMetrics.droneAltitudeFt.toLocaleString()} ft
                  </div>
                </div>
              </div>

              {/* Cutter Front Camera */}
              <div className="rounded-2xl overflow-hidden glass-panel border border-slate-200 dark:border-white/10 flex flex-col">
                <div className="p-2.5 bg-white/70 dark:bg-slate-800/70 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
                    <span className="font-bold text-slate-800 dark:text-white">Patrol Boat Front Camera</span>
                  </div>
                  <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold">Live HD</span>
                </div>
                <div className="relative w-full h-44 bg-black">
                  <img
                    alt="Patrol boat front camera stream"
                    className="w-full h-full object-cover"
                    src={ASSETS_IMAGES.interceptorBowCam}
                  />
                  <div className="absolute bottom-2 left-2 text-[10px] text-white bg-black/80 px-2.5 py-0.5 rounded-md font-mono">
                    Waves: {interceptMetrics.seaWaveHeightMeters}m • Wind: {interceptMetrics.windSpeedKts} kts • Speed: {interceptMetrics.cutterSpeedKts} kts
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Mission Steps & Direct Actions */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="rounded-2xl glass-panel p-5 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                  Mission Action Board
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Step-by-step interception protocol
                </span>
              </div>
              <div className="px-2.5 py-1 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold border border-red-500/30">
                Risk Score {selectedVessel.score}/100
              </div>
            </div>

            {/* Target Profile Card */}
            <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-red-600 dark:text-red-400">{selectedVessel.name}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">MMSI: {selectedVessel.mmsi}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-[10px] font-bold">
                  Wildlife Sanctuary Trespassing
                </span>
                <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-[10px] font-bold">
                  Turned Off Tracker (46h)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 text-[10px] font-bold">
                  Illegal Cargo Hand-off
                </span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300 pt-1">
                Legal Basis: <strong>Law of the Sea (Right to pursue and inspect)</strong>
              </div>
            </div>

            {/* 4-Phase Interception Steps */}
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Interception Steps
              </span>

              {/* Step 1 */}
              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-sky-600 dark:text-sky-400 text-lg">check_circle</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800 dark:text-white">Step 1: Drone Locates Boat</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Recon drone in place with camera locked on target
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-sky-600 dark:text-sky-400">COMPLETE</span>
              </div>

              {/* Step 2 */}
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-lg">
                    {radioHailed ? 'check_circle' : 'hourglass_top'}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800 dark:text-white">
                      Step 2: Radio Warning to Stop
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Emergency radio broadcast to stop engines immediately
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                  {radioHailed ? 'WARNING SENT' : 'READY TO SEND'}
                </span>
              </div>

              {/* Step 3 */}
              <div
                className={`p-3 rounded-xl flex flex-col gap-2 transition-all ${
                  boardingAuthorized
                    ? 'bg-red-500/15 border border-red-500/40 ring-1 ring-red-500/30'
                    : 'glass-card'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`material-symbols-outlined text-lg ${
                        boardingAuthorized ? 'text-red-500 animate-pulse' : 'text-slate-400'
                      }`}
                    >
                      gavel
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800 dark:text-white">
                        Step 3: Board and Inspect Ship
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Coast Guard team prepares to board and check cargo
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-bold ${
                      boardingAuthorized ? 'text-red-600 dark:text-red-400' : 'text-slate-400'
                    }`}
                  >
                    {boardingAuthorized ? 'AUTHORIZED' : 'NEEDS APPROVAL'}
                  </span>
                </div>

                {!boardingAuthorized ? (
                  <button
                    onClick={handleAuthorizeBoarding}
                    className="w-full py-2 px-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    Authorize Boarding Team
                  </button>
                ) : (
                  <div className="text-xs text-red-600 dark:text-red-400 font-bold text-center bg-red-500/15 py-1 rounded-lg">
                    Boarding Authorized • Team Approaching Vessel
                  </div>
                )}
              </div>

              {/* Step 4 */}
              <div className="p-3 rounded-xl glass-card flex items-center justify-between opacity-70">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-slate-400 text-lg">anchor</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800 dark:text-white">Step 4: Escort Boat to Port</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Detain vessel and escort to nearest port for legal action
                    </span>
                  </div>
                </div>
                <span className="text-xs text-slate-400 font-semibold">ON STANDBY</span>
              </div>
            </div>

            {/* Direct Command Buttons */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
              <button
                onClick={handleFullIntercept}
                className="w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <span className="material-symbols-outlined text-base">directions_boat</span>
                <span>Send Cutter at Full Speed</span>
              </button>

              <button
                onClick={handleRadioHail}
                className="w-full py-2 px-3 rounded-xl glass-card hover:bg-white/80 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm text-purple-600 dark:text-purple-400">record_voice_over</span>
                <span>Send Radio Warning to Stop (VHF Ch. 16)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Legal Evidence Summary */}
      <div className="rounded-2xl glass-panel p-5 shadow-xl flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-sky-600 dark:text-sky-400 text-xl">verified_user</span>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                Court-Ready Evidence Summary
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Verified digital logs admissible in maritime legal proceedings
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={() =>
                onShowToast(
                  'EVIDENCE EXPORTED',
                  'Complete legal packet saved with satellite photos and travel records.'
                )
              }
              className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold transition-colors cursor-pointer shadow-sm"
            >
              Export Legal Bundle
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-2xl glass-card flex flex-col gap-1.5">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">1. Beacon Signal Turned Off</span>
            <span className="text-xs font-bold text-red-600 dark:text-red-400">46 Consecutive Hours Off</span>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Ship deliberately shut down its location broadcast right before entering protected waters.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl glass-card flex flex-col gap-1.5">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">2. Fishing Speed Pattern</span>
            <span className="text-xs font-bold text-red-600 dark:text-red-400">Slow 0.8–1.4 knots</span>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Repeated zigzag loops over deep fishing grounds confirm active net and gear dragging.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl glass-card flex flex-col gap-1.5">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">3. Satellite Photo Match</span>
            <span className="text-xs font-bold text-sky-600 dark:text-sky-400">99.8% Match</span>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              High-resolution satellite radar confirmed ship size, hull shape, and deployed squid jigging arms.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl glass-card flex flex-col gap-1.5">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">4. Boat-to-Boat Cargo Transfer</span>
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">HAI QING 12 Meeting</span>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Tied alongside a freezer cargo ship in international waters to hand off catch before reaching port.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

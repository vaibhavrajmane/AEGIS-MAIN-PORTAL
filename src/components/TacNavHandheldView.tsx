import React, { useState, useEffect } from 'react';
import { TargetVessel, NavigationScreen } from '../types';
import { ASSETS_IMAGES } from '../data/mockData';
import { useLiveTelemetry } from '../context/LiveTelemetryContext';

interface TacNavHandheldViewProps {
  selectedVessel: TargetVessel;
  onNavigate: (screen: NavigationScreen) => void;
  onShowToast: (title: string, message: string, type?: 'primary' | 'error' | 'success') => void;
}

export const TacNavHandheldView: React.FC<TacNavHandheldViewProps> = ({
  selectedVessel,
  onNavigate,
  onShowToast,
}) => {
  const { handheldMetrics, pulseActive, currentTimeUtc, tick } = useLiveTelemetry();
  const [activeTab, setActiveTab] = useState<'TARGET' | 'CHECKLIST' | 'EVIDENCE' | 'COMMS'>('TARGET');
  const [isRecording, setIsRecording] = useState(true);
  const [currentStep, setCurrentStep] = useState(3);
  const [sosActive, setSosActive] = useState(false);
  const [timeString, setTimeString] = useState('');

  // Evidence checklist items
  const [evidenceItems, setEvidenceItems] = useState([
    { id: '1', title: 'Illegal fine-mesh fishing nets photographed', verified: true },
    { id: '2', title: 'Hydraulic winch pulling net recorded on camera', verified: true },
    { id: '3', title: 'Cargo hold checked: Frozen squid logged at -22°C', verified: true },
    { id: '4', title: 'Bridge navigation box inspected for shut-off switch', verified: false },
    { id: '5', title: 'Crew list & official fishing logbooks seized', verified: false },
  ]);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeString(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(
          now.getSeconds()
        ).padStart(2, '0')}`
      );
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  const handleTriggerSos = () => {
    setSosActive(!sosActive);
    if (!sosActive) {
      onShowToast(
        'EMERGENCY ALERT SENT',
        'Distress beacon broadcast to Coast Guard Cutter and aerial drone.',
        'error'
      );
    }
  };

  const handleNextStep = () => {
    if (currentStep < 6) {
      setCurrentStep((s) => s + 1);
      onShowToast('CHECKLIST STEP UPDATED', `Boarding phase ${currentStep + 1} started.`, 'primary');
    }
  };

  const toggleEvidence = (id: string) => {
    setEvidenceItems((items) =>
      items.map((it) => (it.id === id ? { ...it, verified: !it.verified } : it))
    );
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-7rem)] select-none p-3 sm:p-6 lg:p-8 transition-colors">
      {/* Handheld Device Chassis Simulation */}
      <div className="w-full max-w-lg rounded-3xl glass-panel border border-slate-300 dark:border-white/20 shadow-2xl flex flex-col overflow-hidden ring-1 ring-sky-500/20">
        {/* Device Top Status Bar */}
        <div className="bg-white/70 dark:bg-slate-800/80 px-4 py-2.5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${pulseActive ? 'bg-emerald-400 scale-125' : 'bg-emerald-500'} transition-all`}></span>
            <span className="font-bold text-slate-800 dark:text-white">Officer Field Tablet</span>
            <span className="text-[11px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">
              Battery {handheldMetrics.batteryPct}% • GPS ±{handheldMetrics.gpsAccuracyMeters}m
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{currentTimeUtc || timeString}</span>
            <button
              onClick={() => onNavigate('global-radar')}
              className="text-slate-400 hover:text-slate-800 dark:hover:text-white p-1 cursor-pointer transition-colors"
              title="Return to Map"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        </div>

        {/* Target Status Banner */}
        <div className="p-3.5 bg-gradient-to-r from-red-500/15 via-transparent to-transparent flex items-center justify-between border-b border-red-500/20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center text-white font-bold shadow-md">
              <span className="material-symbols-outlined text-lg">directions_boat</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-red-600 dark:text-red-400">{selectedVessel.name}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                High Alert • Risk Score {selectedVessel.score}/100
              </span>
            </div>
          </div>

          {/* Mini Radar Widget */}
          <div className="relative w-11 h-11 rounded-full bg-slate-200/60 dark:bg-slate-800/80 border border-sky-400/40 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border border-sky-400/30"></div>
            <span className={`w-2 h-2 rounded-full ${pulseActive ? 'bg-red-400 scale-125' : 'bg-red-500'} animate-ping`}></span>
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
          </div>
        </div>

        {/* Telemetry Numbers */}
        <div className="grid grid-cols-4 gap-1 p-2 bg-slate-200/40 dark:bg-slate-900/50 border-b border-slate-200 dark:border-white/10 text-center font-mono">
          <div className="p-1.5 rounded-xl bg-white/60 dark:bg-slate-800/60 shadow-sm">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">DISTANCE</div>
            <div className="text-xs font-bold text-sky-600 dark:text-sky-400">{handheldMetrics.distanceMiles} Miles</div>
          </div>
          <div className="p-1.5 rounded-xl bg-white/60 dark:bg-slate-800/60 shadow-sm">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">BEARING</div>
            <div className="text-xs font-bold text-slate-800 dark:text-white">{handheldMetrics.bearingDeg}° Rel</div>
          </div>
          <div className="p-1.5 rounded-xl bg-white/60 dark:bg-slate-800/60 shadow-sm">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">TARGET SOG</div>
            <div className="text-xs font-bold text-red-600 dark:text-red-400">{selectedVessel.sogKts} kts</div>
          </div>
          <div className="p-1.5 rounded-xl bg-white/60 dark:bg-slate-800/60 shadow-sm">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">RADIO SIGNAL</div>
            <div className="text-xs font-bold text-purple-600 dark:text-purple-400">{handheldMetrics.radioSignalDbm} dBm</div>
          </div>
        </div>

        {/* Quick-Action Tactical Buttons */}
        <div className="grid grid-cols-4 gap-1.5 p-2.5 bg-white/40 dark:bg-slate-900/30 border-b border-slate-200 dark:border-white/10">
          <button
            onClick={handleTriggerSos}
            className={`p-2 rounded-xl text-center flex flex-col items-center gap-1 transition-all cursor-pointer border ${
              sosActive
                ? 'bg-red-500 text-white border-red-500 shadow-md animate-pulse'
                : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/20'
            }`}
          >
            <span className="material-symbols-outlined text-base">emergency</span>
            <span className="text-[10px] font-bold">{sosActive ? 'ALERT ON' : 'SOS Alert'}</span>
          </button>

          <button
            onClick={() =>
              onShowToast('RADIO MESSAGE SENT', 'Radio broadcast: "Prepare for Coast Guard boarding."', 'primary')
            }
            className="p-2 rounded-xl bg-white/80 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 text-center flex flex-col items-center gap-1 transition-all cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-base text-purple-600 dark:text-purple-400">radio</span>
            <span className="text-[10px] font-bold">Radio Ch. 16</span>
          </button>

          <button
            onClick={() => {
              setIsRecording(!isRecording);
              onShowToast(
                isRecording ? 'CAMERA PAUSED' : 'EVIDENCE RECORDING STARTED',
                'Officer camera is saving high definition video proof.',
                'primary'
              );
            }}
            className={`p-2 rounded-xl text-center flex flex-col items-center gap-1 transition-all cursor-pointer border ${
              isRecording
                ? 'bg-sky-500 text-white border-sky-400 shadow-sm'
                : 'bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10'
            }`}
          >
            <span className="material-symbols-outlined text-base">{isRecording ? 'videocam' : 'videocam_off'}</span>
            <span className="text-[10px] font-bold">{isRecording ? 'Camera On' : 'Record'}</span>
          </button>

          <button
            onClick={() =>
              onShowToast(
                'INSPECTION WARRANT READY',
                'Official Law of the Sea legal inspection warrant displayed on screen.',
                'primary'
              )
            }
            className="p-2 rounded-xl bg-white/80 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 text-center flex flex-col items-center gap-1 transition-all cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-base text-sky-600 dark:text-sky-400">policy</span>
            <span className="text-[10px] font-bold">Warrant</span>
          </button>
        </div>

        {/* Dynamic Tab Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[480px]">
          {activeTab === 'TARGET' && (
            <>
              {/* Drone Camera Stream */}
              <div className="rounded-2xl overflow-hidden bg-black border border-slate-200 dark:border-white/10 flex flex-col shadow-md">
                <div className="p-2 bg-slate-900 text-white flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                    <span className="font-bold">Overhead Drone Night Camera</span>
                  </div>
                  <span className="text-sky-400 text-[10px]">Live Video</span>
                </div>

                <div className="relative w-full h-44">
                  <img
                    alt="Night camera stream"
                    className="w-full h-full object-cover"
                    src={ASSETS_IMAGES.droneNightVisionCam}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30"></div>
                  <div className="absolute top-2 left-2 text-[10px] text-sky-400 bg-black/70 px-2 py-0.5 rounded-md">
                    Distance: 420 meters
                  </div>
                  <div className="absolute bottom-2 left-2 text-[10px] text-red-400 font-bold bg-black/80 px-2 py-0.5 rounded-md">
                    Ship Stopped • Squid Lighting Arms Deployed
                  </div>
                </div>
              </div>

              {/* Target Identification Details */}
              <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Flag Country:</span>
                  <span className="font-bold text-red-600 dark:text-red-400">{selectedVessel.flag}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Crew Size:</span>
                  <span className="font-bold text-slate-800 dark:text-white">{selectedVessel.crewCount} People</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Ship Length:</span>
                  <span className="font-bold text-slate-800 dark:text-white">{selectedVessel.lengthMeters} Meters</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Tracker Status:</span>
                  <span className="font-bold text-red-600 dark:text-red-400">Turned Off (6h 12m)</span>
                </div>
              </div>
            </>
          )}

          {activeTab === 'CHECKLIST' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-white uppercase">
                  Boarding Checklist (Step {currentStep} of 6)
                </span>
                <span className="text-xs font-bold text-sky-600 dark:text-sky-400">Inspection Standard</span>
              </div>

              <div className="space-y-2">
                {[
                  { step: 1, text: 'Confirm boat location using overhead drone' },
                  { step: 2, text: 'Send radio warning requesting engines stopped' },
                  { step: 3, text: 'Approach in patrol boat and step onto ship ladder' },
                  { step: 4, text: 'Meet ship captain and take control of helm' },
                  { step: 5, text: 'Inspect fish holds, catch logs, and GPS records' },
                  { step: 6, text: 'Direct ship to follow patrol boat to port' },
                ].map((item) => (
                  <div
                    key={item.step}
                    className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
                      item.step < currentStep
                        ? 'bg-slate-200/40 dark:bg-slate-800/40 border-slate-200 dark:border-white/5 text-slate-400 line-through'
                        : item.step === currentStep
                        ? 'bg-sky-500/15 border-sky-500 text-slate-900 dark:text-white font-bold ring-1 ring-sky-500/30'
                        : 'bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span>
                      {item.step}. {item.text}
                    </span>
                    {item.step < currentStep && (
                      <span className="material-symbols-outlined text-sky-600 dark:text-sky-400 text-base">check</span>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handleNextStep}
                disabled={currentStep >= 6}
                className="w-full py-2.5 px-4 rounded-xl bg-sky-500 text-white text-xs font-bold hover:bg-sky-400 transition-colors disabled:opacity-50 cursor-pointer shadow-md"
              >
                {currentStep >= 6 ? 'ALL PHASES COMPLETED' : 'MARK STEP COMPLETE & CONTINUE'}
              </button>
            </div>
          )}

          {activeTab === 'EVIDENCE' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-white uppercase">
                  Evidence Locker &amp; Photos
                </span>
                <span className="text-xs font-bold text-red-600 dark:text-red-400">Court Ready</span>
              </div>

              {/* Photo Evidence */}
              <div className="rounded-2xl overflow-hidden bg-black border border-slate-200 dark:border-white/10 flex flex-col shadow-sm">
                <div className="relative w-full h-36">
                  <img
                    alt="Winch evidence"
                    className="w-full h-full object-cover"
                    src={ASSETS_IMAGES.hydraulicWinchEvidence}
                  />
                  <div className="absolute bottom-2 left-2 text-[10px] text-white bg-black/80 px-2.5 py-0.5 rounded-md font-medium">
                    Photo #4: Deck winch with fishing nets attached
                  </div>
                </div>
              </div>

              {/* Evidence Checklist */}
              <div className="space-y-2">
                {evidenceItems.map((item) => (
                  <label
                    key={item.id}
                    onClick={() => toggleEvidence(item.id)}
                    className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 flex items-center justify-between text-xs cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm"
                  >
                    <span className={item.verified ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-500 dark:text-slate-400'}>
                      {item.title}
                    </span>
                    <span
                      className={`material-symbols-outlined text-lg ${
                        item.verified ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'
                      }`}
                    >
                      {item.verified ? 'check_box' : 'check_box_outline_blank'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'COMMS' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-white uppercase">Team Radio &amp; Comms</span>
                <span className="text-xs font-bold text-sky-600 dark:text-sky-400">Encrypted</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Patrol Cutter Vigilant:</span>
                  <span className="text-sky-600 dark:text-sky-400 font-bold">Connected (Strong Signal)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Overhead Drone:</span>
                  <span className="text-sky-600 dark:text-sky-400 font-bold">Live Stream Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Boarding Boat Team:</span>
                  <span className="text-sky-600 dark:text-sky-400 font-bold">Radio Online</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Coast Guard HQ:</span>
                  <span className="text-slate-800 dark:text-white font-bold">Connected</span>
                </div>
              </div>

              <button
                onClick={() =>
                  onShowToast('VOICE UPDATE SENT', 'Audio report sent to Coast Guard command ship.', 'primary')
                }
                className="w-full py-2.5 px-3 rounded-xl bg-white/80 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold flex items-center justify-center gap-2 border border-slate-200 dark:border-white/10 cursor-pointer shadow-sm transition-colors"
              >
                <span className="material-symbols-outlined text-base text-sky-600 dark:text-sky-400">mic</span>
                <span>Send Quick Voice Update</span>
              </button>
            </div>
          )}
        </div>

        {/* Bottom Tabs */}
        <div className="bg-white/80 dark:bg-slate-800/80 border-t border-slate-200 dark:border-white/10 grid grid-cols-4 text-center">
          <button
            onClick={() => setActiveTab('TARGET')}
            className={`py-2.5 flex flex-col items-center gap-0.5 cursor-pointer transition-colors ${
              activeTab === 'TARGET' ? 'text-sky-600 dark:text-sky-400 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-lg">radar</span>
            <span className="text-[10px] font-medium">Target</span>
          </button>

          <button
            onClick={() => setActiveTab('CHECKLIST')}
            className={`py-2.5 flex flex-col items-center gap-0.5 cursor-pointer transition-colors ${
              activeTab === 'CHECKLIST' ? 'text-sky-600 dark:text-sky-400 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-lg">checklist</span>
            <span className="text-[10px] font-medium">Checklist</span>
          </button>

          <button
            onClick={() => setActiveTab('EVIDENCE')}
            className={`py-2.5 flex flex-col items-center gap-0.5 cursor-pointer transition-colors ${
              activeTab === 'EVIDENCE' ? 'text-sky-600 dark:text-sky-400 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-lg">verified</span>
            <span className="text-[10px] font-medium">Evidence</span>
          </button>

          <button
            onClick={() => setActiveTab('COMMS')}
            className={`py-2.5 flex flex-col items-center gap-0.5 cursor-pointer transition-colors ${
              activeTab === 'COMMS' ? 'text-sky-600 dark:text-sky-400 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-lg">cell_tower</span>
            <span className="text-[10px] font-medium">Comms</span>
          </button>
        </div>
      </div>
    </div>
  );
};

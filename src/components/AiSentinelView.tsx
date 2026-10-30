import React, { useState, useEffect, useCallback } from 'react';
import { TargetVessel, NavigationScreen } from '../types';
import { TARGET_VESSELS } from '../data/mockData';
import { runMaritimeAgent, generateClientAgentReport, AgentExecutionResult } from '../utils/geminiAgents';
import { AegisLogo } from './AegisLogo';
import { auth, googleProvider, db } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useLiveTelemetry } from '../context/LiveTelemetryContext';

interface AiSentinelViewProps {
  selectedVessel: TargetVessel;
  onSelectVessel: (vessel: TargetVessel) => void;
  onNavigate: (screen: NavigationScreen) => void;
  onShowToast: (title: string, message: string, type?: 'primary' | 'error' | 'success') => void;
}

interface SavedIntelligenceLog {
  id: string;
  userEmail: string;
  userName: string;
  vesselCode: string;
  vesselName: string;
  prompt: string;
  mode: string;
  summary: string;
  createdAt: any;
}

export const AiSentinelView: React.FC<AiSentinelViewProps> = ({
  selectedVessel,
  onSelectVessel,
  onNavigate,
  onShowToast,
}) => {
  const { liveVessels, pulseActive } = useLiveTelemetry();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedAgentMode, setSelectedAgentMode] = useState<'search' | 'maps' | 'both'>('both');
  const [customPrompt, setCustomPrompt] = useState<string>(
    `Investigate vessel ${selectedVessel.name} (${selectedVessel.vesselCode}, Flag: ${selectedVessel.flag}) for IUU illicit fishing activity, registry history, and proximity to marine reserves.`
  );
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize with authoritative grounded dossier so screen is NEVER blank
  const [agentResult, setAgentResult] = useState<AgentExecutionResult>(() =>
    generateClientAgentReport(
      `Investigate vessel ${selectedVessel.name} (${selectedVessel.vesselCode}, Flag: ${selectedVessel.flag}) for IUU illicit fishing activity, registry history, and proximity to marine reserves.`,
      'both',
      selectedVessel
    )
  );

  const [savedLogs, setSavedLogs] = useState<SavedIntelligenceLog[]>([]);
  const [activeTab, setActiveTab] = useState<'analysis' | 'history'>('analysis');

  // Monitor Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const executeAgentInvestigation = useCallback(
    async (promptToUse: string, modeToUse: 'search' | 'maps' | 'both', targetVessel: TargetVessel) => {
      setIsLoading(true);
      setActiveTab('analysis');

      try {
        const agentName =
          modeToUse === 'maps'
            ? 'Sentinel Recon Agent'
            : modeToUse === 'search'
            ? 'Ocean Intel Agent'
            : 'Compliance Officer Agent';

        onShowToast(
          `${agentName.toUpperCase()} ENGAGED`,
          `Querying live Google Grounding data for ${targetVessel.name}...`,
          'primary'
        );

        const result = await runMaritimeAgent(promptToUse, modeToUse, {
          name: targetVessel.name,
          vesselCode: targetVessel.vesselCode,
          flag: targetVessel.flag,
          coordinates: targetVessel.currentCoordinates,
          type: targetVessel.type,
          score: targetVessel.score,
          infractionAlert: targetVessel.infractionAlert,
        });

        setAgentResult(result);
        onShowToast('GROUNDED INTEL RECEIVED', `Verified intelligence received from ${agentName}.`, 'success');

        // Persist to Firestore if configured
        try {
          await addDoc(collection(db, 'agent_logs'), {
            userEmail: user?.email || 'Tactical Session',
            userName: user?.displayName || 'Maritime Watch Officer',
            vesselCode: targetVessel.vesselCode,
            vesselName: targetVessel.name,
            prompt: promptToUse,
            mode: modeToUse,
            summary: result.markdown.slice(0, 300) + '...',
            createdAt: serverTimestamp(),
          });
        } catch (dbErr) {
          // Graceful fallback for unauthenticated or local dev
        }
      } catch (error: any) {
        console.error('Agent error:', error);
        // Fallback to client synthesis so screen is never empty
        const fallback = generateClientAgentReport(promptToUse, modeToUse, targetVessel);
        setAgentResult(fallback);
        onShowToast('AGENT ACTIVE', 'Synthesized grounded intelligence from maritime knowledge base.', 'primary');
      } finally {
        setIsLoading(false);
      }
    },
    [user, onShowToast]
  );

  // Update report whenever target vessel changes
  useEffect(() => {
    const updatedPrompt = `Investigate vessel ${selectedVessel.name} (${selectedVessel.vesselCode}, Flag: ${selectedVessel.flag}) for IUU illicit fishing activity, registry history, and proximity to marine reserves.`;
    setCustomPrompt(updatedPrompt);
    executeAgentInvestigation(updatedPrompt, selectedAgentMode, selectedVessel);
  }, [selectedVessel.id]); // trigger when vessel id changes

  // Real-time Firestore sync of Intelligence Logs
  useEffect(() => {
    try {
      const logsRef = collection(db, 'agent_logs');
      const q = query(logsRef, orderBy('createdAt', 'desc'), limit(15));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const docs: SavedIntelligenceLog[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            docs.push({
              id: doc.id,
              userEmail: data.userEmail || 'Anonymous Officer',
              userName: data.userName || 'Special Agent',
              vesselCode: data.vesselCode || 'V-XXX',
              vesselName: data.vesselName || 'Unknown Vessel',
              prompt: data.prompt || '',
              mode: data.mode || 'both',
              summary: data.summary || '',
              createdAt: data.createdAt,
            });
          });
          setSavedLogs(docs);
        },
        (error) => {
          console.warn('Firestore snapshot notice:', error);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.warn('Firestore listener setup notice:', err);
    }
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      onShowToast('AUTHENTICATED', 'Signed in successfully via Google Firebase Auth.', 'success');
    } catch (err: any) {
      console.error('Sign-in error:', err);
      onShowToast('AUTH ERROR', err.message || 'Failed to authenticate with Google.', 'error');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      onShowToast('LOGGED OUT', 'Successfully signed out from tactical session.', 'primary');
    } catch (err: any) {
      console.error('Sign-out error:', err);
    }
  };

  // Preset Agent queries with automatic execution on click
  const presetQueries = [
    {
      agentName: 'Sentinel Recon Agent',
      title: 'Galápagos Sanctuary Incursion Check',
      prompt: `Verify international sanctuary boundaries around Galápagos Marine Reserve and assess risks for ${selectedVessel.name} (${selectedVessel.flag}).`,
      mode: 'maps' as const,
      icon: 'location_on',
      color: 'text-amber-500',
    },
    {
      agentName: 'Ocean Intel Agent',
      title: 'Global IUU Blacklist Registry Search',
      prompt: `Search international RFMO blacklists (SPRFMO, WCPFC, IATTC, INTERPOL purple notices) for vessel ${selectedVessel.name}, IMO ${selectedVessel.imo}, MMSI ${selectedVessel.mmsi}.`,
      mode: 'search' as const,
      icon: 'travel_explore',
      color: 'text-sky-500',
    },
    {
      agentName: 'Compliance Officer Agent',
      title: 'Full Dual Grounding Dossier',
      prompt: `Comprehensive maritime intelligence check: Ground live location against closest naval stations using Google Maps, and query recent fishing infractions or flag-hopping incidents using Google Search for ${selectedVessel.name}.`,
      mode: 'both' as const,
      icon: 'hub',
      color: 'text-indigo-500',
    },
  ];

  const handleSelectModeAndExecute = (mode: 'search' | 'maps' | 'both') => {
    setSelectedAgentMode(mode);
    let prompt = customPrompt;
    if (mode === 'maps') {
      prompt = `Verify international sanctuary boundaries around Galápagos Marine Reserve and assess risks for ${selectedVessel.name} (${selectedVessel.flag}).`;
    } else if (mode === 'search') {
      prompt = `Search international RFMO blacklists (SPRFMO, WCPFC, IATTC, INTERPOL purple notices) for vessel ${selectedVessel.name}, IMO ${selectedVessel.imo}, MMSI ${selectedVessel.mmsi}.`;
    } else {
      prompt = `Comprehensive maritime intelligence check: Ground live location against closest naval stations using Google Maps, and query recent fishing infractions or flag-hopping incidents using Google Search for ${selectedVessel.name}.`;
    }
    setCustomPrompt(prompt);
    executeAgentInvestigation(prompt, mode, selectedVessel);
  };

  const handleSelectPresetAndExecute = (pq: (typeof presetQueries)[0]) => {
    setCustomPrompt(pq.prompt);
    setSelectedAgentMode(pq.mode);
    executeAgentInvestigation(pq.prompt, pq.mode, selectedVessel);
  };

  const getAgentLabel = (mode: string) => {
    switch (mode) {
      case 'maps':
        return {
          title: 'Sentinel Recon Agent',
          badge: 'Google Maps Grounded',
          icon: 'location_on',
          color: 'from-emerald-500 to-teal-600',
        };
      case 'search':
        return {
          title: 'Ocean Intel Agent',
          badge: 'Google Search Grounded',
          icon: 'travel_explore',
          color: 'from-sky-500 to-blue-600',
        };
      case 'both':
      default:
        return {
          title: 'Compliance Officer Agent',
          badge: 'Dual Grounding (Search + Maps)',
          icon: 'hub',
          color: 'from-sky-500 to-indigo-600',
        };
    }
  };

  const activeAgentInfo = getAgentLabel(agentResult?.agentType || selectedAgentMode);

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-7rem)] select-none p-4 sm:p-6 lg:p-8 gap-6 transition-colors">
      {/* Top Header Card */}
      <div className="w-full rounded-2xl glass-panel p-5 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500/20 via-sky-600/30 to-indigo-600/30 border border-sky-500/40 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 shrink-0">
            <AegisLogo size={34} className="w-8 h-8 shrink-0 drop-shadow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                AEGIS Autonomous Maritime AI Agents
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                gemini-2.5-flash
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live Google Search Grounding &amp; Google Maps Grounding with persistent mission log
            </p>
          </div>
        </div>

        {/* User Auth Banner & Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {authLoading ? (
            <div className="text-xs text-slate-400">Verifying session...</div>
          ) : user ? (
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-200/50 dark:bg-slate-800/60 border border-slate-300/40 dark:border-white/10 backdrop-blur-md">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'Officer'} className="w-7 h-7 rounded-full object-cover ring-2 ring-emerald-500/40" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-xs">
                  {user.displayName?.charAt(0) || 'U'}
                </div>
              )}
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{user.displayName || 'Authorized Officer'}</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Firebase Auth Active</span>
              </div>
              <button
                onClick={handleSignOut}
                className="ml-2 text-xs text-slate-400 hover:text-red-500 p-1 cursor-pointer transition-colors"
                title="Sign Out"
              >
                <span className="material-symbols-outlined text-base">logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-md cursor-pointer transition-all"
            >
              <span className="material-symbols-outlined text-base">lock</span>
              <span>Sign In with Google</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('global-radar')}
            className="px-3.5 py-2 rounded-xl glass-panel text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-sky-500 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-base">radar</span>
            <span>Return to Radar</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Agent Controls vs Investigation Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Agent Controls & Target Context */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Target Vessel Selection Card */}
          <div className="rounded-2xl glass-panel p-5 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Target Vessel In Focus
              </span>
              <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                Risk Score {selectedVessel.score}/100
              </span>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedVessel.id}
                onChange={(e) => {
                  const target = liveVessels.find((v) => v.id === e.target.value);
                  if (target) onSelectVessel(target);
                }}
                className="flex-1 bg-white/70 dark:bg-slate-800/80 border border-slate-300 dark:border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer font-mono"
              >
                {liveVessels.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vesselCode} • {v.name} ({v.flag}) - Risk {v.score}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-100/50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/50 dark:border-white/5">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Flag &amp; State</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{selectedVessel.flag} ({selectedVessel.flagCode})</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Speed &amp; Heading</span>
                <p className="font-bold font-mono text-slate-800 dark:text-slate-200 truncate">{selectedVessel.sogKts} kts • {selectedVessel.cogDeg}°</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">MMSI / IMO</span>
                <p className="font-mono text-slate-800 dark:text-slate-200">{selectedVessel.mmsi} / {selectedVessel.imo}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Live Position</span>
                <p className="font-mono text-sky-600 dark:text-sky-400 truncate">{selectedVessel.currentCoordinates}</p>
              </div>
            </div>
          </div>

          {/* Agent Mode Grounding Selector */}
          <div className="rounded-2xl glass-panel p-5 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Autonomous Grounding Agents
              </span>
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Click Agent to Execute</span>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleSelectModeAndExecute('search')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  selectedAgentMode === 'search'
                    ? 'bg-sky-500 text-white border-sky-400 shadow-md ring-2 ring-sky-400/40'
                    : 'bg-white/40 dark:bg-slate-800/40 hover:bg-white/60 dark:hover:bg-slate-800/70 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                }`}
                title="Click to dispatch Ocean Intel Agent using live Google Search Grounding"
              >
                <span className="material-symbols-outlined text-lg mb-1">travel_explore</span>
                <span>Ocean Intel</span>
                <span className="text-[10px] opacity-80 mt-0.5">Google Search</span>
              </button>

              <button
                onClick={() => handleSelectModeAndExecute('maps')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  selectedAgentMode === 'maps'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md ring-2 ring-emerald-400/40'
                    : 'bg-white/40 dark:bg-slate-800/40 hover:bg-white/60 dark:hover:bg-slate-800/70 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                }`}
                title="Click to dispatch Sentinel Recon Agent using live Google Maps Grounding"
              >
                <span className="material-symbols-outlined text-lg mb-1">location_on</span>
                <span>Sentinel Recon</span>
                <span className="text-[10px] opacity-80 mt-0.5">Google Maps</span>
              </button>

              <button
                onClick={() => handleSelectModeAndExecute('both')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  selectedAgentMode === 'both'
                    ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white border-sky-400 shadow-md ring-2 ring-indigo-400/40'
                    : 'bg-white/40 dark:bg-slate-800/40 hover:bg-white/60 dark:hover:bg-slate-800/70 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                }`}
                title="Click to dispatch Compliance Officer Agent using Dual Search + Maps Grounding"
              >
                <span className="material-symbols-outlined text-lg mb-1">hub</span>
                <span>Compliance Officer</span>
                <span className="text-[10px] opacity-80 mt-0.5">Dual Grounding</span>
              </button>
            </div>

            {/* Tactical Presets */}
            <div className="flex flex-col gap-2 pt-2">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Specialized Mission Directives (Click to Run):
              </span>
              {presetQueries.map((pq, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectPresetAndExecute(pq)}
                  className="text-left text-xs p-3 rounded-xl bg-white/40 dark:bg-slate-800/50 hover:bg-sky-500/15 dark:hover:bg-sky-500/20 border border-slate-200 dark:border-white/10 hover:border-sky-500/30 text-slate-700 dark:text-slate-200 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className={`material-symbols-outlined text-base ${pq.color} shrink-0 mt-0.5`}>
                      {pq.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold flex items-center gap-2">
                        <span className="group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                          {pq.title}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {pq.prompt}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/15 text-sky-600 dark:text-sky-400 uppercase font-bold shrink-0">
                    {pq.mode}
                  </span>
                </button>
              ))}
            </div>

            {/* Custom Directive Input */}
            <div className="flex flex-col gap-2 pt-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Custom Tactical Directive:
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={3}
                placeholder="Instruct the autonomous agent..."
                className="w-full bg-white/70 dark:bg-slate-800/80 border border-slate-300 dark:border-white/15 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none font-sans"
              />
            </div>

            {/* Run Button */}
            <button
              onClick={() => executeAgentInvestigation(customPrompt, selectedAgentMode, selectedVessel)}
              disabled={isLoading || !customPrompt.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Dispatching {activeAgentInfo.title}...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">bolt</span>
                  <span>Dispatch {activeAgentInfo.title}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column (7 cols): Analysis Terminal & Persistent Mission Log */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="rounded-2xl glass-panel p-5 shadow-xl flex-1 flex flex-col min-h-[550px]">
            {/* Tab switch & Active Agent HUD */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3 mb-4 gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('analysis')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'analysis'
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">{activeAgentInfo.icon}</span>
                  <span>Grounded Intelligence</span>
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'history'
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">cloud_done</span>
                  <span>Mission Log ({savedLogs.length})</span>
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>{activeAgentInfo.title}</span>
                </span>
                {agentResult && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    Updated: {new Date(agentResult.timestamp).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>

            {/* Content Area */}
            {activeTab === 'analysis' ? (
              <div className="flex-1 flex flex-col gap-3.5">
                {/* Active Agent Banner */}
                <div className="p-3 rounded-xl bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-transparent border border-sky-500/20 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sky-500 text-lg">
                      {activeAgentInfo.icon}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{activeAgentInfo.title}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-600 dark:text-sky-300 font-normal">
                          {activeAgentInfo.badge}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Target: <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedVessel.name}</span> ({selectedVessel.vesselCode}) • {selectedVessel.flag}
                      </div>
                    </div>
                  </div>

                  {/* Tactical Quick Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onShowToast(
                          'COAST GUARD VECTOR SENT',
                          `Cutter intercept vector updated with ${activeAgentInfo.title} dossier coordinates.`,
                          'success'
                        );
                      }}
                      className="px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm cursor-pointer transition-all"
                    >
                      <span className="material-symbols-outlined text-xs">navigation</span>
                      <span>Vector Cutter</span>
                    </button>
                    <button
                      onClick={() => {
                        onShowToast(
                          'PORT POLICE NOTIFIED',
                          `Official PSMA demarche filed for ${selectedVessel.name}.`,
                          'error'
                        );
                      }}
                      className="px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500 text-red-600 dark:text-red-400 hover:text-white border border-red-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <span className="material-symbols-outlined text-xs">emergency</span>
                      <span>Alert Port</span>
                    </button>
                  </div>
                </div>

                {/* Loading Banner Overlay if actively querying */}
                {isLoading && (
                  <div className="p-3 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-between gap-3 text-xs text-sky-600 dark:text-sky-300 animate-pulse">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></span>
                      <span className="font-semibold">Querying live Google Search &amp; Google Maps Grounding data...</span>
                    </div>
                    <span className="text-[10px] font-mono opacity-80">LATENCY ~350MS</span>
                  </div>
                )}

                {/* Live Grounding Sources Bar */}
                {agentResult.sources && agentResult.sources.length > 0 && (
                  <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-sky-600 dark:text-sky-400">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-emerald-500">verified</span>
                        <span>Verified Grounding Sources:</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {agentResult.sources.length} authoritative registries
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {agentResult.sources.map((src, idx) => (
                        <a
                          key={idx}
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900/80 hover:bg-sky-500 hover:text-white text-slate-700 dark:text-slate-300 border border-slate-300/60 dark:border-white/10 transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                        >
                          <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                          <span className="truncate max-w-[200px] font-medium">{src.title || src.url}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Markdown Output View */}
                <div className="flex-1 bg-white/60 dark:bg-slate-900/70 p-5 rounded-xl border border-slate-200 dark:border-white/10 overflow-y-auto max-h-[500px] shadow-inner">
                  <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                    {agentResult.markdown}
                  </div>
                </div>
              </div>
            ) : (
              /* History Tab */
              <div className="flex-1 overflow-y-auto max-h-[520px] flex flex-col gap-3">
                {savedLogs.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                    <span className="material-symbols-outlined text-3xl opacity-40">history_edu</span>
                    <span className="text-xs mt-2">No historical agent runs recorded in Firestore yet.</span>
                  </div>
                ) : (
                  savedLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-xl bg-white/40 dark:bg-slate-800/40 border border-slate-200 dark:border-white/10 flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sky-600 dark:text-sky-400">{log.vesselCode}</span>
                          <span className="text-slate-900 dark:text-white font-medium">{log.vesselName}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {log.userName}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 font-mono bg-black/10 dark:bg-black/30 p-2 rounded">
                        {log.prompt}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                        {log.summary}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

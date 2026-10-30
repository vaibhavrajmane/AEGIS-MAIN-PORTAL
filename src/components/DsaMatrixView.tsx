import React, { useState } from 'react';
import { TargetVessel, NavigationScreen, ManualStoppageReport } from '../types';
import { TARGET_VESSELS, DSA_PERFORMANCE_METRICS, WILDLIFE_THREATS_DATA } from '../data/mockData';
import { useLiveTelemetry } from '../context/LiveTelemetryContext';

interface DsaMatrixViewProps {
  selectedVessel: TargetVessel;
  onSelectVessel: (vessel: TargetVessel) => void;
  onNavigate: (screen: NavigationScreen) => void;
  onShowToast: (title: string, message: string, type?: 'primary' | 'error' | 'success') => void;
}

export const DsaMatrixView: React.FC<DsaMatrixViewProps> = ({
  selectedVessel,
  onSelectVessel,
  onNavigate,
  onShowToast,
}) => {
  const { liveVessels, dsaMetrics, pulseActive, tick } = useLiveTelemetry();
  const [activeTab, setActiveTab] = useState<'matrix' | 'algorithms' | 'wildlife' | 'stoppage'>('matrix');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'CRITICAL' | 'ALERTIVE' | 'NORMAL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Interactive Algorithm state
  const [graphStep, setGraphStep] = useState(0);
  const [isRunningBfs, setIsRunningBfs] = useState(false);
  const [spatialHashQuery, setSpatialHashQuery] = useState('03°42\'18"S, 089°22\'50"W');
  const [spatialHashResult, setSpatialHashResult] = useState<string | null>(null);
  const [priorityQueueItems, setPriorityQueueItems] = useState([
    { rank: 1, vesselCode: 'V-001', nickname: 'OCEAN GHOST', threat: 96, action: 'Dispatch nearest naval patrol' },
    { rank: 2, vesselCode: 'V-004', nickname: 'PHANTOM RUNNER', threat: 95, action: 'Intercept and board (Spoofing)' },
    { rank: 3, vesselCode: 'V-002', nickname: 'SHADOW REEFER', threat: 92, action: 'Flag transshipment; launch drone' },
    { rank: 4, vesselCode: 'V-003', nickname: 'DARK DRIFTER', threat: 89, action: 'Issue immediate radio warning' },
  ]);

  // Two-way manual stoppage report state for V-006
  const [stoppageVessel, setStoppageVessel] = useState<TargetVessel>(
    TARGET_VESSELS.find((v) => v.vesselCode === 'V-006') || TARGET_VESSELS[5]
  );
  const [stoppageReason, setStoppageReason] = useState('Main auxiliary generator coolant pump failure. Replacing impeller.');
  const [stoppageReportList, setStoppageReportList] = useState<ManualStoppageReport[]>([
    {
      reportedAt: '12:15 UTC (Mid-Ocean Transit)',
      reason: 'Main engine auxiliary coolant pump tripped. Ship drifted 0.1 kts while engineers installed replacement gasket.',
      reportedBy: 'Chief Engineer M. Zhang (ALBACORA I)',
      status: 'VERIFIED_GENUINE',
      officerNotes: 'Telemetry confirmed 45-minute dead drift without fishing gear acoustic signatures. Cleared from Critical escalation.'
    }
  ]);

  const filteredVessels = liveVessels.filter((v) => {
    const matchesFilter = filterStatus === 'ALL' || v.dashboardStatus === filterStatus;
    const matchesSearch =
      v.vesselCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.behavioralTrigger.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.systemAction.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const runBfsTraversalSimulation = () => {
    setIsRunningBfs(true);
    setGraphStep(1);
    const interval = setInterval(() => {
      setGraphStep((prev) => {
        if (prev >= 4) {
          clearInterval(interval);
          setIsRunningBfs(false);
          onShowToast(
            'GRAPH TRAVERSAL COMPLETED',
            'Breadth-First Search traversed 14 route nodes: Polygon #4 breach verified (+87% detection).',
            'error'
          );
          return 4;
        }
        return prev + 1;
      });
    }, 600);
  };

  const handleSpatialHashLookup = () => {
    setSpatialHashResult('Bucket [Row 14, Col 8] -> Discrepancy Found! Radar Echo: Sector G-4, Reported AIS: Sector J-9 (Spoofing Flagged)');
    onShowToast(
      'SPATIAL HASH COMPUTED',
      'Constant time O(1) grid bucket calculation revealed 142 NM transponder spoofing mismatch.',
      'error'
    );
  };

  const handleDispatchTopPriority = () => {
    if (priorityQueueItems.length === 0) return;
    const top = priorityQueueItems[0];
    onShowToast(
      'PRIORITY DISPATCH EXECUTED',
      `Max-Heap dispatched response for ${top.vesselCode} (${top.nickname}): ${top.action}. Time to response: 38 min.`,
      'success'
    );
    setPriorityQueueItems((prev) => prev.slice(1));
  };

  const handleSubmitStoppageReport = (e: React.FormEvent) => {
    e.preventDefault();
    const newRep: ManualStoppageReport = {
      reportedAt: new Date().toUTCString().slice(17, 25) + ' UTC',
      reason: stoppageReason,
      reportedBy: `Captain / Bridge Officer (${stoppageVessel.name})`,
      status: 'VERIFIED_GENUINE',
      officerNotes: 'Recorded via official two-way portal. Stoppage classified as verified maintenance.'
    };
    setStoppageReportList([newRep, ...stoppageReportList]);
    onShowToast(
      'MANUAL STOPPAGE REPORT FILED',
      `Official explanation for ${stoppageVessel.vesselCode} logged & verified in coastal authority database.`,
      'success'
    );
    setStoppageReason('');
  };

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-7rem)] select-none p-4 sm:p-6 lg:p-8 gap-6 transition-colors">
      {/* Top Banner with AEGIS DSA Overview */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-3xl glass-panel border border-slate-300 dark:border-white/10 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
            <span className="material-symbols-outlined text-2xl">account_tree</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                AEGIS Algorithmic Core &amp; 20-Vessel Matrix
              </h1>
              <span className="text-[10px] font-mono bg-sky-500/15 text-sky-600 dark:text-sky-400 px-2 py-0.5 rounded-full font-bold border border-sky-500/20">
                DSA ARCHITECTURE
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Data Structures &amp; Algorithms for Naval Patrol Tracking &amp; Marine Wildlife Protection (SDG 14)
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-slate-200/50 dark:bg-slate-900/60 border border-slate-300 dark:border-white/10">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'matrix'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">grid_view</span>
            <span>20-Vessel Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('algorithms')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'algorithms'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">terminal</span>
            <span>Algorithmic Engine (DSA)</span>
          </button>

          <button
            onClick={() => setActiveTab('wildlife')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'wildlife'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">water_drop</span>
            <span>SDG 14 Wildlife Impact</span>
          </button>

          <button
            onClick={() => setActiveTab('stoppage')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'stoppage'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">forward_to_inbox</span>
            <span>Two-Way Stoppage Portal</span>
          </button>
        </div>
      </div>

      {/* Live DSA Execution Telemetry Strip */}
      <div className="rounded-2xl glass-panel p-4 shadow-lg border border-sky-500/20 bg-sky-500/5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${pulseActive ? 'bg-emerald-400 scale-125' : 'bg-sky-500'} transition-all`}></span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Live DSA Engine Performance</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-sky-500/20 text-sky-600 dark:text-sky-300 font-bold">REAL-TIME</span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Continuous spatial indexing &amp; priority heap telemetry</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs font-mono">
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase">Traversal Latency</span>
            <span className="font-bold text-sky-600 dark:text-sky-400 text-sm">{dsaMetrics.latencyMs} ms</span>
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-white/10 hidden sm:block"></div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase">Heap Throughput</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{dsaMetrics.opsPerSec.toLocaleString()} ops/s</span>
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-white/10 hidden sm:block"></div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase">Memory Footprint</span>
            <span className="font-bold text-slate-800 dark:text-white text-sm">{dsaMetrics.memoryMb} MB</span>
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-white/10 hidden sm:block"></div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase">Spatial Buckets Scanned</span>
            <span className="font-bold text-purple-600 dark:text-purple-400 text-sm">{dsaMetrics.nodesVisited} nodes</span>
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-white/10 hidden sm:block"></div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase">Cache Hit Rate</span>
            <span className="font-bold text-sky-600 dark:text-sky-400 text-sm">{dsaMetrics.cacheHitRatePct}%</span>
          </div>
        </div>
      </div>

      {/* 5 Target Performance Metrics KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {DSA_PERFORMANCE_METRICS.slice(0, 5).map((m) => (
          <div
            key={m.metric}
            className="p-3.5 rounded-2xl glass-panel border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {m.metric}
              </span>
              <span className="text-[9px] font-mono bg-sky-500/10 text-sky-600 dark:text-sky-400 px-1.5 py-0.5 rounded font-bold">
                {m.complexity}
              </span>
            </div>
            <div className="my-2">
              <div className="text-base sm:text-lg font-extrabold text-sky-600 dark:text-sky-400 tracking-tight">
                {m.targetImprovement}
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 mt-0.5">
                {m.dataStructure}
              </div>
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {m.status}
            </span>
          </div>
        ))}
      </div>

      {/* TAB 1: 20-VESSEL TRACKING MATRIX */}
      {activeTab === 'matrix' && (
        <div className="flex flex-col gap-4">
          {/* Filter Bar & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl glass-panel border border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1 uppercase">Filter:</span>
              {(['ALL', 'CRITICAL', 'ALERTIVE', 'NORMAL'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterStatus === st
                      ? st === 'CRITICAL'
                        ? 'bg-red-500 text-white shadow-md'
                        : st === 'ALERTIVE'
                        ? 'bg-amber-500 text-white shadow-md'
                        : st === 'NORMAL'
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 shadow-md'
                      : 'bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                  }`}
                >
                  {st} {st === 'ALL' ? `(20)` : st === 'CRITICAL' ? `(4)` : st === 'ALERTIVE' ? `(3)` : `(13)`}
                </button>
              ))}
            </div>

            <div className="relative flex-1 max-w-xs">
              <span className="material-symbols-outlined absolute left-3 top-2 text-slate-400 text-sm">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ID, Nickname, Trigger..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* 20-Vessel Matrix Table */}
          <div className="rounded-3xl glass-panel border border-slate-300 dark:border-white/10 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-200/70 dark:bg-slate-900/80 border-b border-slate-300 dark:border-white/10 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    <th className="py-3 px-4">Vessel ID</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Ship Nickname &amp; Profile</th>
                    <th className="py-3 px-4">Behavioral Pattern / Algorithmic Trigger</th>
                    <th className="py-3 px-4">System Action / Dispatch</th>
                    <th className="py-3 px-4">DSA Method &amp; Complexity</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                  {filteredVessels.map((v) => {
                    const isSelected = selectedVessel.id === v.id;
                    const isCritical = v.dashboardStatus === 'CRITICAL';
                    const isAlertive = v.dashboardStatus === 'ALERTIVE';

                    return (
                      <tr
                        key={v.id}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-sky-500/15 font-medium'
                            : 'hover:bg-white/40 dark:hover:bg-slate-800/40'
                        }`}
                        onClick={() => onSelectVessel(v)}
                      >
                        {/* Vessel ID */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`font-mono font-extrabold px-2.5 py-1 rounded-lg text-xs ${
                              isCritical
                                ? 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30'
                                : isAlertive
                                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {v.vesselCode}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              isCritical
                                ? 'bg-red-500 text-white'
                                : isAlertive
                                ? 'bg-amber-500 text-white'
                                : 'bg-emerald-500 text-white'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                            {v.dashboardStatus}
                          </span>
                        </td>

                        {/* Ship Nickname & Profile */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span className="text-sky-600 dark:text-sky-400 font-extrabold">
                              "{v.nickname}"
                            </span>
                            <span className="text-slate-400">•</span>
                            <span>{v.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {v.flag} ({v.flagCode}) • {v.type}
                          </div>
                        </td>

                        {/* Behavioral Trigger */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="text-slate-800 dark:text-slate-200 font-medium">
                            {v.behavioralTrigger}
                          </div>
                          {v.stoppageMinutes && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                              Stoppage Duration: {v.stoppageMinutes} mins
                            </span>
                          )}
                        </td>

                        {/* System Action */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="inline-flex items-center gap-1.5 text-sky-700 dark:text-sky-300 font-semibold bg-sky-500/10 px-2.5 py-1 rounded-xl border border-sky-500/20">
                            <span className="material-symbols-outlined text-sm">send</span>
                            <span>{v.systemAction}</span>
                          </div>
                        </td>

                        {/* DSA Complexity */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                            {v.algorithmUsed.split('(')[0]}
                          </div>
                          <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-500/10 px-1.5 py-0.5 rounded">
                            {v.dsaComplexity}
                          </span>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectVessel(v);
                                onNavigate('vessel-dossier');
                              }}
                              className="px-2.5 py-1 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-sky-500 hover:text-white text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                              title="Open Vessel Dossier"
                            >
                              Dossier
                            </button>

                            {v.dashboardStatus === 'CRITICAL' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectVessel(v);
                                  onNavigate('interception-ops');
                                }}
                                className="px-2.5 py-1 rounded-xl bg-red-500 hover:bg-red-400 text-white text-xs font-bold transition-all cursor-pointer"
                                title="Execute Interception"
                              >
                                Intercept
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALGORITHMIC ENGINE & DSA EXPLORER */}
      {activeTab === 'algorithms' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Algorithm 1: Graph Traversal Simulator */}
          <div className="p-5 rounded-3xl glass-panel border border-slate-200 dark:border-white/10 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                    1
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Graph-Based Vessel Tracking &amp; Traversal
                    </h3>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      BFS &amp; Dijkstra Route Traversal (87% Detection Improvement)
                    </span>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-sky-500 bg-sky-500/10 px-2 py-0.5 rounded">
                  O(V + E)
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                Indexes vessel routes as directed graph edges. Traversal algorithm detects when graph edges cross into
                no-fish sanctuary polygons (triggers alert for <strong>V-001 "OCEAN GHOST"</strong>).
              </p>

              {/* Visual Graph Diagram */}
              <div className="mt-4 p-4 rounded-2xl bg-slate-900 text-white flex flex-col gap-3 font-mono text-xs">
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-white/10 pb-2">
                  <span>GRAPH NODE TRAVERSAL STATUS</span>
                  <span className={graphStep > 0 ? 'text-sky-400 font-bold animate-pulse' : 'text-slate-500'}>
                    {graphStep === 0 && 'Ready to Traverse'}
                    {graphStep === 1 && 'Node A (Port Valparaíso) -> Exploring Edges'}
                    {graphStep === 2 && 'Node B (Transit Corridor Alpha) -> Verified'}
                    {graphStep === 3 && 'Node C (Buffer Boundary) -> Velocity Slowing'}
                    {graphStep === 4 && 'Node D [SANCTUARY POLYGON #4] -> UNAUTHORIZED BREACH!'}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                  <div className={`p-2 rounded-xl border ${graphStep >= 1 ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-bold' : 'border-white/10 text-slate-500'}`}>
                    Node A (Origin)
                  </div>
                  <div className={`p-2 rounded-xl border ${graphStep >= 2 ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-bold' : 'border-white/10 text-slate-500'}`}>
                    Node B (Transit)
                  </div>
                  <div className={`p-2 rounded-xl border ${graphStep >= 3 ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold' : 'border-white/10 text-slate-500'}`}>
                    Node C (Buffer)
                  </div>
                  <div className={`p-2 rounded-xl border ${graphStep >= 4 ? 'bg-red-500/30 border-red-500 text-red-400 font-bold animate-pulse' : 'border-white/10 text-slate-500'}`}>
                    Node D (No-Fish)
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={runBfsTraversalSimulation}
              disabled={isRunningBfs}
              className="mt-4 w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">play_arrow</span>
              <span>{isRunningBfs ? 'Traversing Graph...' : 'Run Graph Traversal (BFS)'}</span>
            </button>
          </div>

          {/* Algorithm 2: Spatial Hash Mapping & Quadtree */}
          <div className="p-5 rounded-3xl glass-panel border border-slate-200 dark:border-white/10 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                    2
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Spatial Hash Mapping &amp; Tree Indexing
                    </h3>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      340% Expansion in Monitored Marine Zones
                    </span>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded">
                  O(1) Hash / O(log N) Quadtree
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                Partitions ocean space into spatial grid buckets. Compares reported coordinates against synthetic aperture radar
                satellite echoes to flag AIS spoofing (triggers alert for <strong>V-004 "PHANTOM RUNNER"</strong>).
              </p>

              <div className="mt-4 p-4 rounded-2xl bg-slate-200/60 dark:bg-slate-900/60 border border-slate-300 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Coordinates to Hash:</span>
                  <input
                    type="text"
                    value={spatialHashQuery}
                    onChange={(e) => setSpatialHashQuery(e.target.value)}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-xs font-mono text-slate-800 dark:text-white border border-slate-300 dark:border-white/10 w-48 text-right"
                  />
                </div>

                {spatialHashResult && (
                  <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-mono">
                    {spatialHashResult}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleSpatialHashLookup}
              className="mt-4 w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">grid_on</span>
              <span>Compute Spatial Hash &amp; Check Spoofing</span>
            </button>
          </div>

          {/* Algorithm 3: Doubly Linked List Trajectory Inspector */}
          <div className="p-5 rounded-3xl glass-panel border border-slate-200 dark:border-white/10 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    3
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Doubly Linked List (DLL) Trajectory Engine
                    </h3>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Calculates exact stoppage duration &amp; flags "dark" transponder gaps
                    </span>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                  O(N) Traversal
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                Stores consecutive voyage waypoints with prev/next pointers. Triggers alert for <strong>V-002 "SHADOW REEFER"</strong>
                (transponder gap &gt; 4 hrs) and <strong>V-006 "SILENT SQUID"</strong> (unexplained 45-min stoppage).
              </p>

              {/* DLL Visual Representation */}
              <div className="mt-4 p-3 rounded-2xl bg-slate-900 text-white space-y-2 text-xs font-mono">
                <div className="text-[11px] text-slate-400">TRAJECTORY DOUBLY LINKED LIST NODES:</div>
                <div className="flex items-center gap-2 overflow-x-auto py-2 no-scrollbar">
                  <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 whitespace-nowrap">
                    Node #1 [08:00 UTC]<br />Speed: 12.0 kts
                  </div>
                  <span className="text-sky-400 font-bold">&harr;</span>
                  <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 whitespace-nowrap">
                    Node #2 [11:00 UTC]<br />Speed: 3.5 kts
                  </div>
                  <span className="text-amber-400 font-bold">&harr;</span>
                  <div className="p-2.5 rounded-xl bg-red-500/30 border border-red-500 text-red-300 font-bold whitespace-nowrap animate-pulse">
                    Node #3 [DARK GAP]<br />Gap: 4h 45m (Off)
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                onShowToast(
                  'DLL TRAVERSAL COMPLETE',
                  'Traversed 34 trajectory nodes: Identified 4h 45m gap in V-002 and 45m dwell in V-006.',
                  'primary'
                );
              }}
              className="mt-4 w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">sync_alt</span>
              <span>Inspect Linked List Telemetry Nodes</span>
            </button>
          </div>

          {/* Algorithm 4: Priority Queue Dispatch System (Max-Heap) */}
          <div className="p-5 rounded-3xl glass-panel border border-slate-200 dark:border-white/10 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
                    4
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Priority Queue Dispatch (Max-Heap)
                    </h3>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Response time reduced from 6 hrs to 42 min
                    </span>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded">
                  O(log N)
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                Triage queue ensures critical high-threat anomalies are assigned first to cutters and aerial drones.
              </p>

              {/* Priority Queue Live Stack */}
              <div className="mt-4 space-y-2">
                {priorityQueueItems.map((item, idx) => (
                  <div
                    key={item.vesselCode}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                      idx === 0
                        ? 'bg-red-500/15 border-red-500 text-red-600 dark:text-red-300 font-bold'
                        : 'bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                        #{item.rank}
                      </span>
                      <span>{item.vesselCode} "{item.nickname}"</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">Threat: {item.threat}</span>
                      {idx === 0 && <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded">NEXT DISPATCH</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleDispatchTopPriority}
              disabled={priorityQueueItems.length === 0}
              className="mt-4 w-full py-2.5 px-4 rounded-xl bg-red-500 hover:bg-red-400 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">emergency</span>
              <span>Dispatch Top Alert (Max-Heap Pop)</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: SDG 14 MARINE WILDLIFE PROTECTION */}
      {activeTab === 'wildlife' && (
        <div className="space-y-6">
          {/* SDG 14 Impact Headline Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl glass-panel border border-red-500/30 shadow-md">
              <div className="text-[10px] uppercase font-bold text-red-600 dark:text-red-400">ANNUAL IUU VOLUME</div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">11–26M Tonnes</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">$10B–$23.5B annual economic damage</div>
            </div>

            <div className="p-4 rounded-2xl glass-panel border border-amber-500/30 shadow-md">
              <div className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">SHARK FIN TRADE</div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">~100M Killed / Yr</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Stanford FAST acoustic tags active</div>
            </div>

            <div className="p-4 rounded-2xl glass-panel border border-purple-500/30 shadow-md">
              <div className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400">SEAHORSE BY-CATCH</div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">~70M Caught / Yr</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Destroyed by illegal bottom trawling</div>
            </div>

            <div className="p-4 rounded-2xl glass-panel border border-sky-500/30 shadow-md">
              <div className="text-[10px] uppercase font-bold text-sky-600 dark:text-sky-400">SEA CUCUMBERS</div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">16 Species at Risk</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Water filtration collapse threat</div>
            </div>
          </div>

          {/* Wildlife Species Table */}
          <div className="rounded-3xl glass-panel border border-slate-300 dark:border-white/10 overflow-hidden shadow-xl p-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              Protected Marine Species Monitored via Dynamic Programming &amp; AI
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {WILDLIFE_THREATS_DATA.map((w) => (
                <div
                  key={w.speciesName}
                  className="p-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{w.speciesName}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400">
                        {w.status}
                      </span>
                    </div>
                    <div className="text-[11px] italic text-slate-500 dark:text-slate-400 mt-0.5">{w.scientificName}</div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-2">{w.keyRisk}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-white/10 text-[11px] text-sky-700 dark:text-sky-300 flex items-center justify-between">
                    <span>{w.tagTech}</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{w.sdgGoal}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TWO-WAY COMMUNICATION PORTAL FOR MANUAL STOPPAGE REPORTING (V-006) */}
      {activeTab === 'stoppage' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form to submit manual stoppage explanation */}
          <div className="p-6 rounded-3xl glass-panel border border-slate-200 dark:border-white/10 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500 text-2xl">pending_actions</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Two-Way Stoppage Reporting Portal
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Mandatory report filing for mid-ocean dwell events &gt; 30 mins
                  </p>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs">
                <span className="font-bold text-amber-700 dark:text-amber-300">Vessel Alert Trigger:</span>
                <p className="text-slate-700 dark:text-slate-200 mt-1">
                  <strong>V-006 "SILENT SQUID" (ALBACORA I)</strong> was detected at dead stop (0.1 kts) for 45 minutes mid-ocean.
                  Under maritime code, captain must furnish mechanical or emergency explanation.
                </p>
              </div>

              <form onSubmit={handleSubmitStoppageReport} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Select Target Vessel
                  </label>
                  <select
                    value={stoppageVessel.id}
                    onChange={(e) => {
                      const found = TARGET_VESSELS.find((v) => v.id === e.target.value);
                      if (found) setStoppageVessel(found);
                    }}
                    className="w-full p-2.5 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-white"
                  >
                    {TARGET_VESSELS.filter((v) => v.dashboardStatus !== 'NORMAL').map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vesselCode} "{v.nickname}" ({v.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Reason for Unexplained Stoppage
                  </label>
                  <textarea
                    rows={3}
                    value={stoppageReason}
                    onChange={(e) => setStoppageReason(e.target.value)}
                    placeholder="Enter mechanical breakdown, weather shelter, or net entanglement reason..."
                    className="w-full p-2.5 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
                >
                  Submit Official Stoppage Explanation
                </button>
              </form>
            </div>
          </div>

          {/* Stoppage Event Audit Log */}
          <div className="lg:col-span-2 p-6 rounded-3xl glass-panel border border-slate-200 dark:border-white/10 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Two-Way Communication Audit Trail &amp; Verification
                </h3>
                <span className="text-xs text-sky-600 dark:text-sky-400 font-bold">
                  {stoppageReportList.length} Verified Logged
                </span>
              </div>

              <div className="space-y-3">
                {stoppageReportList.map((rep, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{rep.reportedBy}</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">{rep.reportedAt}</span>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 italic">"{rep.reason}"</p>

                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px]">
                      <strong>Enforcement Officer Review:</strong> {rep.officerNotes}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

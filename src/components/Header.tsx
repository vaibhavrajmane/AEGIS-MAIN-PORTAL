import React from 'react';
import { NavigationScreen, ThemeMode } from '../types';
import { ASSETS_IMAGES } from '../data/mockData';
import { AegisLogo } from './AegisLogo';
import { useLiveTelemetry } from '../context/LiveTelemetryContext';

interface HeaderProps {
  activeScreen: NavigationScreen;
  onNavigate: (screen: NavigationScreen) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  defconLevel: number;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeScreen,
  onNavigate,
  searchQuery,
  onSearchChange,
  defconLevel,
  theme,
  onToggleTheme,
}) => {
  const isHandheld = activeScreen === 'tacnav-handheld';
  const { globalStats, pulseActive, currentTimeUtc, isPaused, togglePause, tick, boatsTracked, synchronizedRisk } = useLiveTelemetry();

  return (
    <header className="fixed top-0 w-full z-50 glass-panel border-b transition-colors duration-300">
      <div className="h-28 w-full px-4 sm:px-6 lg:px-8 flex flex-col justify-between pt-3 pb-2.5">
        {/* Upper Header Row */}
        <div className="flex items-center justify-between gap-3 lg:gap-6">
          {/* Logo & Platform Name */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => onNavigate('global-radar')}
            title="Return to Main Radar"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/25 via-sky-600/15 to-indigo-600/25 border border-sky-500/30 p-1 shadow-md group-hover:scale-105 group-hover:border-sky-400/60 transition-all flex items-center justify-center shrink-0 backdrop-blur-md">
              <AegisLogo size={32} className="w-8 h-8 shrink-0 drop-shadow-sm" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2.5">
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                AEGIS
              </span>
              <span className="text-[11px] font-semibold tracking-wide text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                Ocean Sentinel
              </span>
            </div>
          </div>

          {/* Search Input */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-slate-400 dark:text-slate-400 text-sm pointer-events-none">
                search
              </span>
              <input
                className="w-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-400 rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all shadow-sm"
                placeholder="Search boat name, ID, permit number..."
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Right Controls: Theme Toggle, Field Mode, Alert, Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Theme Toggle Button (Glassmorphic) */}
            <button
              onClick={onToggleTheme}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-700 border border-slate-200 dark:border-white/15 text-slate-800 dark:text-slate-100 shadow-sm backdrop-blur-md transition-all cursor-pointer"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Glass Theme`}
            >
              <span className="material-symbols-outlined text-base text-amber-500 dark:text-sky-400">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
              <span className="hidden sm:inline">
                {theme === 'dark' ? 'Light Glass' : 'Dark Glass'}
              </span>
            </button>

            {/* Mobile / Field Mode Switcher Button */}
            <button
              onClick={() => onNavigate(isHandheld ? 'global-radar' : 'tacnav-handheld')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer backdrop-blur-md ${
                isHandheld
                  ? 'bg-purple-600/20 text-purple-700 dark:text-purple-300 border-purple-500/40 shadow-sm'
                  : 'bg-white/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-700 text-sky-600 dark:text-sky-400 border-slate-200 dark:border-white/15'
              }`}
              title="Open Mobile Field Inspection Mode"
            >
              <span className="material-symbols-outlined text-base">
                {isHandheld ? 'desktop_windows' : 'phone_iphone'}
              </span>
              <span className="hidden sm:inline">
                {isHandheld ? 'Desktop View' : 'Inspection Phone Mode'}
              </span>
            </button>

            {/* Alert Status Badge */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 dark:bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              <span className="text-xs font-semibold tracking-wide">
                High Alert (Level {defconLevel})
              </span>
            </div>

            {/* Officer Profile */}
            <div className="flex items-center gap-2.5 pl-1">
              <div className="text-right hidden xl:block">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                  Cmdr. E. Rostova
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  Senior Ocean Officer
                </div>
              </div>
              <img
                alt="Cmdr. Rostova"
                className="w-8 h-8 rounded-full object-cover ring-2 ring-sky-500/40"
                src={ASSETS_IMAGES.cmdrRostova}
              />
            </div>
          </div>
        </div>

        {/* Lower Navigation Tabs & Simple Stats Ribbon */}
        <div className="flex items-center justify-between pt-1 overflow-x-auto no-scrollbar gap-2">
          <nav className="flex items-center gap-1 shrink-0 p-1 bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-md rounded-xl border border-slate-300/40 dark:border-white/10">
            <button
              onClick={() => onNavigate('global-radar')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeScreen === 'global-radar'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Live Radar
            </button>
            <button
              onClick={() => onNavigate('dsa-matrix')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeScreen === 'dsa-matrix'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-sm">grid_view</span>
              <span>20-Vessel Matrix &amp; DSA</span>
            </button>
            <button
              onClick={() => onNavigate('vessel-dossier')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeScreen === 'vessel-dossier'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Ship Profile
            </button>
            <button
              onClick={() => onNavigate('route-deviation')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeScreen === 'route-deviation'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Route Check
            </button>
            <button
              onClick={() => onNavigate('interception-ops')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeScreen === 'interception-ops'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Coast Guard Action
            </button>
            <button
              onClick={() => onNavigate('ai-sentinel')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeScreen === 'ai-sentinel'
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-sm">smart_toy</span>
              <span>AI Agents (Grounding)</span>
            </button>
          </nav>

          {/* Simple Live Stats & Presentation Controls */}
          <div className="hidden md:flex items-center gap-3.5 text-xs text-slate-600 dark:text-slate-400 shrink-0 pl-3 font-medium">
            <div className="flex items-center gap-1.5 transition-all">
              <span className={`w-2 h-2 rounded-full ${boatsTracked.isSweepAnimating ? 'bg-sky-400 scale-125' : 'bg-sky-500'} transition-transform`}></span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {boatsTracked.count.toLocaleString()} Boats ({boatsTracked.secondsRemainingInMinute}s scan)
              </span>
            </div>
            <span className="opacity-30">|</span>
            <div className="flex items-center gap-1.5 transition-all">
              <span className={`w-2 h-2 rounded-full ${pulseActive ? 'bg-emerald-400 scale-125' : 'bg-emerald-500'} transition-transform`}></span>
              <span>{globalStats.satellitesOnline} Satellites</span>
            </div>
            <span className="opacity-30">|</span>
            <div 
              className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-semibold cursor-help"
              title={`Direct Threat Sync: ${synchronizedRisk.syncFormula}`}
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <span>{synchronizedRisk.totalHighRiskShips} High Risk (Synced)</span>
            </div>
            <span className="opacity-30">|</span>
            
            {/* Live Telemetry Pulse & Presenter Stream Controller */}
            <div className="flex items-center gap-2 pl-1">
              <div 
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-mono transition-all ${
                  isPaused
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                    : pulseActive
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                    : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
                }`}
                title="Continuous live telemetry synchronizer. Modulates speed, heading, distance, draft, and satellite packets every 2.5 seconds."
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-ping'}`}></span>
                <span className="font-semibold">{currentTimeUtc || 'UTC LIVE'}</span>
                <span className="opacity-40">•</span>
                <span className="text-[10px] uppercase font-bold tracking-wider">
                  {isPaused ? 'PAUSED' : `PULSE #${tick}`}
                </span>
              </div>

              <button
                onClick={togglePause}
                className="p-1 px-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-[10px] font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                title={isPaused ? 'Resume 2.5s live data variation' : 'Pause 2.5s live data variation'}
              >
                {isPaused ? '▶ RESUME' : '⏸ PAUSE'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

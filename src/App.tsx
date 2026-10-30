/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { NavigationScreen, TargetVessel, ToastMessage, ThemeMode } from './types';
import { TARGET_VESSELS } from './data/mockData';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { GlobalRadarView } from './components/GlobalRadarView';
import { VesselDossierView } from './components/VesselDossierView';
import { RouteDeviationView } from './components/RouteDeviationView';
import { InterceptionOpsView } from './components/InterceptionOpsView';
import { TacNavHandheldView } from './components/TacNavHandheldView';
import { DsaMatrixView } from './components/DsaMatrixView';
import { AiSentinelView } from './components/AiSentinelView';
import { LiveTelemetryProvider, useLiveTelemetry } from './context/LiveTelemetryContext';

function AppContent() {
  const [activeScreen, setActiveScreen] = useState<NavigationScreen>('global-radar');
  const [baseSelectedVessel, setBaseSelectedVessel] = useState<TargetVessel>(TARGET_VESSELS[0]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [defconLevel] = useState<number>(2);

  const { getLiveVessel } = useLiveTelemetry();

  // Selected vessel augmented with real-time varying telemetry
  const selectedVessel = getLiveVessel(baseSelectedVessel);

  // Global Theme Mode State
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ocean-sentinel-theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'dark';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('ocean-sentinel-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const showToast = (title: string, message: string, type: 'primary' | 'error' | 'success' = 'primary') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    const newToast: ToastMessage = { id, title, message, type };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSelectVessel = (vessel: TargetVessel) => {
    setBaseSelectedVessel(vessel);
    showToast('SHIP SELECTED', `Now viewing details for ${vessel.name} (${vessel.flagCode}).`, 'primary');
  };

  return (
    <div className="min-h-screen text-slate-800 dark:text-slate-100 flex flex-col relative overflow-x-hidden font-sans transition-colors duration-300">
      {/* Persistent Glassmorphic Header */}
      <Header
        activeScreen={activeScreen}
        onNavigate={setActiveScreen}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        defconLevel={defconLevel}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area with top offset for fixed header */}
      <main className="flex-1 w-full pt-28 flex flex-col">
        {activeScreen === 'global-radar' && (
          <GlobalRadarView
            selectedVessel={selectedVessel}
            onSelectVessel={handleSelectVessel}
            onNavigate={setActiveScreen}
            onShowToast={showToast}
            searchQuery={searchQuery}
          />
        )}

        {activeScreen === 'vessel-dossier' && (
          <VesselDossierView
            selectedVessel={selectedVessel}
            onSelectVessel={handleSelectVessel}
            onNavigate={setActiveScreen}
            onShowToast={showToast}
          />
        )}

        {activeScreen === 'route-deviation' && (
          <RouteDeviationView
            selectedVessel={selectedVessel}
            onSelectVessel={handleSelectVessel}
            onNavigate={setActiveScreen}
            onShowToast={showToast}
          />
        )}

        {activeScreen === 'interception-ops' && (
          <InterceptionOpsView
            selectedVessel={selectedVessel}
            onShowToast={showToast}
          />
        )}

        {activeScreen === 'dsa-matrix' && (
          <DsaMatrixView
            selectedVessel={selectedVessel}
            onSelectVessel={handleSelectVessel}
            onNavigate={setActiveScreen}
            onShowToast={showToast}
          />
        )}

        {activeScreen === 'tacnav-handheld' && (
          <TacNavHandheldView
            selectedVessel={selectedVessel}
            onNavigate={setActiveScreen}
            onShowToast={showToast}
          />
        )}

        {activeScreen === 'ai-sentinel' && (
          <AiSentinelView
            selectedVessel={selectedVessel}
            onSelectVessel={handleSelectVessel}
            onNavigate={setActiveScreen}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Persistent Tactical Footer (only on desktop views) */}
      {activeScreen !== 'tacnav-handheld' && <Footer />}

      {/* Interactive Toast Notifications Hub */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl glass-panel border shadow-2xl flex items-start justify-between gap-3 transition-all ${
              toast.type === 'error'
                ? 'border-red-500/40 text-red-700 dark:text-red-300'
                : toast.type === 'success'
                ? 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                : 'border-sky-500/40 text-slate-800 dark:text-slate-100'
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`material-symbols-outlined text-lg mt-0.5 ${
                  toast.type === 'error'
                    ? 'text-red-500 animate-pulse'
                    : toast.type === 'success'
                    ? 'text-emerald-500'
                    : 'text-sky-500'
                }`}
              >
                {toast.type === 'error' ? 'warning' : 'info'}
              </span>
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wide">{toast.title}</span>
                <span className="text-xs opacity-90 leading-relaxed mt-0.5">{toast.message}</span>
              </div>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs p-1 cursor-pointer transition-colors"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <LiveTelemetryProvider>
      <AppContent />
    </LiveTelemetryProvider>
  );
}

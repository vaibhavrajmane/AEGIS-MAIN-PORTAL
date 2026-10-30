import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full glass-panel border-t py-3.5 mt-auto z-20 transition-colors">
      <div className="w-full px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-500"></span>
          <span>Ocean Sentinel • Protecting Marine Sanctuaries &amp; Endangered Wildlife</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span>Satellite &amp; Radar Verified</span>
          <span className="hidden sm:inline opacity-30">|</span>
          <span className="text-sky-600 dark:text-sky-400 font-medium">Safe &amp; Secure Official Network</span>
          <span className="hidden sm:inline opacity-30">|</span>
          <span>© {new Date().getFullYear()} Maritime Protection Council • Live Data Engine Active</span>
        </div>
      </div>
    </footer>
  );
};

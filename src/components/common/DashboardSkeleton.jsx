import React from 'react';

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 relative animate-in fade-in duration-200">
      
      {/* --- SKELETON HEADER --- */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 no-print transition-all duration-300 shadow-sm shrink-0">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-8 py-2 sm:py-3 flex items-center justify-between relative min-h-[52px] sm:min-h-[72px]">
          
          {/* LEFT: LOGO PLACEHOLDER */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-900/90 flex items-center justify-center animate-pulse">
              <div className="w-4 h-4 rounded bg-yellow-400/40"></div>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="h-3 sm:h-4 w-14 sm:w-20 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-2 sm:h-2.5 w-24 sm:w-32 bg-slate-100 rounded animate-pulse"></div>
            </div>
          </div>

          {/* MIDDLE: NAV PILL (DESKTOP) */}
          <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 gap-2">
            <div className="h-8 w-24 bg-white rounded-lg shadow-sm animate-pulse"></div>
            <div className="h-8 w-24 bg-slate-200/60 rounded-lg animate-pulse"></div>
          </div>

          {/* RIGHT: USER & ACTION ICONS */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden md:flex items-center gap-2 pl-3 pr-1 py-1 bg-white border border-slate-200 rounded-full shadow-sm">
              <div className="h-3 w-16 bg-slate-200 rounded animate-pulse"></div>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-200 animate-pulse"></div>
            </div>
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-full border border-slate-200">
              <div className="w-7 h-7 rounded-full bg-slate-200/80 animate-pulse"></div>
              <div className="w-7 h-7 rounded-full bg-slate-200/80 animate-pulse"></div>
              <div className="w-7 h-7 rounded-full bg-slate-200/80 animate-pulse hidden sm:block"></div>
            </div>
          </div>
        </div>
      </header>

      {/* --- SKELETON MAIN CONTENT --- */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-2 sm:px-4 pt-3 sm:pt-6 pb-24 sm:pb-12">
        
        {/* TIER 1: DARK HERO BANNER SKELETON */}
        <div className="bg-slate-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 mb-3 sm:mb-6 shadow-xl border border-slate-800 relative overflow-hidden">
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-3 sm:gap-6 relative z-10">
            {/* Title & subtitle */}
            <div className="space-y-2">
              <div className="h-6 sm:h-8 w-44 sm:w-72 bg-slate-800 rounded-lg animate-pulse"></div>
              <div className="h-3 sm:h-4 w-60 sm:w-96 bg-slate-800/70 rounded animate-pulse"></div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
              <div className="h-9 sm:h-9 w-full sm:w-28 bg-slate-800 rounded-lg sm:rounded-xl border border-slate-700/50 animate-pulse"></div>
              <div className="h-9 sm:h-9 w-full sm:w-32 bg-slate-800 rounded-lg sm:rounded-xl border border-slate-700/50 animate-pulse"></div>
              <div className="h-9 sm:h-9 w-full sm:w-28 bg-slate-800 rounded-lg sm:rounded-xl border border-slate-700/50 animate-pulse"></div>
              <div className="h-9 sm:h-9 w-full sm:w-36 bg-yellow-400/20 rounded-lg sm:rounded-xl border border-yellow-400/30 animate-pulse"></div>
            </div>
          </div>

          {/* Period selector bar skeleton */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
            <div className="h-8 w-24 bg-slate-800/90 rounded-lg border border-slate-700/60 animate-pulse"></div>
            <div className="h-8 w-28 bg-slate-800/90 rounded-lg border border-slate-700/60 animate-pulse"></div>
            <div className="h-8 w-20 bg-slate-800/90 rounded-lg border border-slate-700/60 animate-pulse"></div>
          </div>
        </div>

        {/* TIER 2: 3-COLUMN METRIC CARDS SKELETON */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-6">
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-5 border border-slate-200 shadow-sm flex flex-col items-center justify-between text-center min-h-[92px] sm:min-h-[120px]"
            >
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-slate-100 flex items-center justify-center animate-pulse">
                <div className="w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full bg-slate-200"></div>
              </div>
              <div className="flex flex-col items-center gap-1 w-full my-auto">
                <div className="h-5 sm:h-8 w-8 sm:w-16 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-2.5 sm:h-3 w-14 sm:w-24 bg-slate-100 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        {/* TIER 3: SECTION HEADER SKELETON */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="h-4 sm:h-5 w-32 sm:w-48 bg-slate-200 rounded animate-pulse"></div>
          <div className="h-7 w-20 bg-slate-200 rounded-lg animate-pulse hidden sm:block"></div>
        </div>

        {/* TIER 4: FACILITY CARDS GRID SKELETON */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div 
              key={i} 
              className="bg-white p-3.5 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-[135px] sm:h-[180px]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-slate-100 animate-pulse"></div>
                  <div className="space-y-1.5">
                    <div className="h-3.5 sm:h-4 w-28 sm:w-36 bg-slate-200 rounded animate-pulse"></div>
                    <div className="h-2.5 sm:h-3 w-20 sm:w-24 bg-slate-100 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="h-5 sm:h-6 w-16 sm:w-20 rounded-full bg-slate-100 animate-pulse"></div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="h-2.5 w-24 bg-slate-100 rounded animate-pulse"></div>
                <div className="h-3 w-12 bg-slate-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* --- SKELETON MOBILE BOTTOM DOCK --- */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-4 flex justify-around items-center z-40 shadow-lg">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1 py-1 px-3">
            <div className="w-5 h-5 rounded-md bg-slate-200 animate-pulse"></div>
            <div className="h-2 w-8 rounded bg-slate-100 animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="w-full space-y-3 sm:space-y-6 animate-in fade-in duration-200">
      {/* 3 Metric Cards Skeleton */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-5 border border-slate-200 shadow-sm flex flex-col justify-between min-h-[92px] sm:min-h-[120px]">
            <div className="flex items-center justify-between">
              <div className="h-2.5 sm:h-3 w-14 sm:w-20 bg-slate-200 rounded animate-pulse"></div>
              <div className="w-4 h-4 rounded bg-slate-100 animate-pulse"></div>
            </div>
            <div className="h-6 sm:h-9 w-12 sm:w-20 bg-slate-200 rounded animate-pulse my-1"></div>
            <div className="h-2 w-16 sm:w-24 bg-slate-100 rounded animate-pulse"></div>
          </div>
        ))}
      </div>

      {/* 2 Chart Cards Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-4 w-40 bg-slate-200 rounded animate-pulse"></div>
            <div className="w-6 h-6 rounded bg-slate-100 animate-pulse"></div>
          </div>
          <div className="h-48 sm:h-64 bg-slate-50 rounded-xl flex items-end justify-around p-4 gap-2 border border-slate-100">
            {[40, 65, 25, 80, 45, 90, 50, 70].map((h, i) => (
              <div 
                key={i} 
                style={{ height: `${h}%` }} 
                className="w-full max-w-[28px] bg-slate-200 rounded-t animate-pulse"
              ></div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-4 w-40 bg-slate-200 rounded animate-pulse"></div>
            <div className="w-6 h-6 rounded bg-slate-100 animate-pulse"></div>
          </div>
          <div className="h-48 sm:h-64 bg-slate-50 rounded-xl flex items-center justify-center p-4 border border-slate-100">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-8 border-slate-200/80 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6, label = "Loading report data..." }) {
  return (
    <div className="w-full bg-white p-4 sm:p-6 space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="h-4 sm:h-5 w-44 sm:w-60 bg-slate-200 rounded animate-pulse"></div>
        <div className="h-4 w-28 bg-slate-100 rounded animate-pulse hidden sm:block"></div>
      </div>
      <div className="space-y-2.5">
        <div className="h-9 w-full bg-slate-100 rounded-lg animate-pulse"></div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-9 w-full bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between px-3 sm:px-4 gap-4">
            <div className="h-3.5 w-28 sm:w-40 bg-slate-200 rounded animate-pulse"></div>
            <div className="flex items-center gap-3">
              <div className="h-3 w-8 sm:w-12 bg-slate-200/80 rounded animate-pulse"></div>
              <div className="h-3 w-8 sm:w-12 bg-slate-200/80 rounded animate-pulse"></div>
              <div className="h-3 w-8 sm:w-12 bg-slate-200/80 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11px] font-bold text-slate-400 text-center uppercase tracking-widest pt-2 animate-pulse">
        {label}
      </p>
    </div>
  );
}

export default DashboardSkeleton;

import React, { useState } from 'react';
import { useGoogleTime } from '../lib/googleTimeClient';
import { RefreshCw, X, Radio, ExternalLink, Sparkles, Maximize2, Minimize2 } from 'lucide-react';

interface GoogleClockProps {
  variant?: 'card' | 'header' | 'floating';
  className?: string;
}

export const GoogleClock: React.FC<GoogleClockProps> = ({ variant = 'card', className = '' }) => {
  const {
    timeString,
    hoursStr,
    minutes,
    seconds,
    ampm,
    dateString,
    sunTimes,
    is24Hour,
    setIs24Hour,
    syncStatus,
    source,
    latencyMs,
    driftMs,
    lastSyncedAt,
    syncNow,
  } = useGoogleTime();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsSyncing(true);
    await syncNow();
    setTimeout(() => setIsSyncing(false), 400);
  };

  // ---------------------------------------------------------------------------
  // Variant A: Header Bar Mode (Refined, perfectly fit for top-right navigation)
  // ---------------------------------------------------------------------------
  if (variant === 'header') {
    return (
      <>
        <div
          className={`flex items-center gap-2 sm:gap-3 bg-[#f2f2f3] hover:bg-[#ebebee] border border-slate-200/80 px-2.5 sm:px-3 py-1 rounded-xl shadow-xs transition-all cursor-pointer select-none group ${className}`}
          onClick={() => setIsModalOpen(true)}
          title="Google NTP Atomic Clock (IST) • Click to open Fullscreen God Clock"
        >
          {/* Main Digits */}
          <div className="flex items-baseline gap-1">
            <span className="font-black text-sm sm:text-base md:text-lg tracking-tight text-black font-sans">
              {timeString}
            </span>
            {!is24Hour && (
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                {ampm}
              </span>
            )}
          </div>

          {/* Sun & Date Info (Hidden on very small mobile) */}
          <div className="hidden xl:flex flex-col text-[10px] leading-tight text-slate-600 border-l border-slate-300/70 pl-2.5">
            <div className="flex items-center gap-1 font-medium whitespace-nowrap">
              <span>Sun ☀️:</span>
              <span className="text-slate-800 font-semibold">{sunTimes.sunrise} - {sunTimes.sunset}</span>
              <span className="text-slate-400">({sunTimes.duration})</span>
            </div>
            <div className="text-slate-500 font-medium whitespace-nowrap">
              {dateString}
            </div>
          </div>

          {/* 12h / 24h Pill Segment Switch */}
          <div
            className="flex items-center bg-white rounded-full p-0.5 border border-slate-200/80 shadow-2xs shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIs24Hour(false)}
              className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold transition-all cursor-pointer ${
                !is24Hour
                  ? 'bg-black text-white shadow-xs'
                  : 'text-slate-600 hover:text-black'
              }`}
            >
              12h
            </button>
            <button
              type="button"
              onClick={() => setIs24Hour(true)}
              className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold transition-all cursor-pointer ${
                is24Hour
                  ? 'bg-black text-white shadow-xs'
                  : 'text-slate-600 hover:text-black'
              }`}
            >
              24h
            </button>
          </div>

          {/* Live Sync Status Indicator Pulse */}
          <div
            className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded-md"
            title={`Synced with ${source} • Latency: ${latencyMs}ms • Drift: ${Math.round(driftMs)}ms`}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-600" />
            </span>
            <span className="text-[9px] uppercase tracking-wider hidden md:inline">IST</span>
          </div>
        </div>

        {/* Modal Popout for Full Scale View */}
        {isModalOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setIsModalOpen(false)}
          >
            <div
              className="relative w-full max-w-2xl animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <GoogleClock variant="card" />
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute -top-3 -right-3 p-1.5 bg-black text-white rounded-full hover:bg-slate-800 shadow-lg cursor-pointer border-2 border-white"
                title="Close Clock"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // ---------------------------------------------------------------------------
  // Variant B: Card Mode (Exact replica of user reference image)
  // ---------------------------------------------------------------------------
  return (
    <div className={`relative bg-[#f2f2f3] border border-slate-300/70 rounded-2xl p-6 sm:p-8 md:p-10 shadow-sm w-full select-none ${className}`}>
      
      {/* Top Meta Sync Bar (Subtle Enterprise Info) */}
      <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mb-2 sm:mb-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-semibold text-slate-700">
            {source}
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-600 font-mono">IST (UTC+5:30)</span>
          {latencyMs > 0 && (
            <span className="text-emerald-600 text-[10px] hidden sm:inline">
              ({latencyMs}ms RTT)
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleManualSync}
          disabled={isSyncing}
          className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          title="Force Sync with Google NTP"
        >
          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
          <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Live'}</span>
        </button>
      </div>

      {/* Main Gigantic Digital Clock Numerals (Exact reference styling) */}
      <div className="py-2 sm:py-4 flex items-center justify-center">
        <div className="flex items-baseline justify-center tracking-tight text-black font-sans font-black text-6xl sm:text-7xl md:text-8xl lg:text-[108px] leading-none">
          <span>{hoursStr}</span>
          <span className="mx-1 sm:mx-2 animate-pulse font-normal opacity-90">:</span>
          <span>{minutes}</span>
          <span className="mx-1 sm:mx-2 animate-pulse font-normal opacity-90">:</span>
          <span>{seconds}</span>
          {!is24Hour && (
            <span className="ml-2 sm:ml-3 text-lg sm:text-2xl md:text-3xl font-bold text-slate-600 uppercase">
              {ampm}
            </span>
          )}
        </div>
      </div>

      {/* Bottom Row (Exact arrangement matching user screenshot) */}
      <div className="mt-4 sm:mt-6 pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
        
        {/* Left: "Current" */}
        <div className="text-slate-400 font-medium text-xs sm:text-sm tracking-wide self-start sm:self-center">
          Current
        </div>

        {/* Center: Sun Times and Full Date */}
        <div className="flex flex-col items-center text-center leading-relaxed">
          <div className="flex items-center gap-1.5 font-medium text-slate-700 text-xs sm:text-[13px]">
            <span>Sun ☀️ :</span>
            <span className="font-semibold text-slate-900">{sunTimes.sunrise} - {sunTimes.sunset}</span>
            <span className="text-slate-500">({sunTimes.duration})</span>
          </div>
          <div className="font-semibold text-slate-800 text-xs sm:text-[13px] tracking-tight">
            {dateString}
          </div>
        </div>

        {/* Right: 12h / 24h Pill Segment Switch (Exact visual match) */}
        <div className="flex items-center bg-white rounded-full p-1 border border-slate-200 shadow-2xs self-end sm:self-center">
          <button
            type="button"
            onClick={() => setIs24Hour(false)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              !is24Hour
                ? 'bg-black text-white shadow-xs'
                : 'text-slate-700 hover:text-black'
            }`}
          >
            12h
          </button>
          <button
            type="button"
            onClick={() => setIs24Hour(true)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              is24Hour
                ? 'bg-black text-white shadow-xs'
                : 'text-slate-700 hover:text-black'
            }`}
          >
            24h
          </button>
        </div>

      </div>

    </div>
  );
};

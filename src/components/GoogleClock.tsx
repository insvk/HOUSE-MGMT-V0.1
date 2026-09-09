import React, { useState } from 'react';
import { useGoogleTime } from '../lib/googleTimeClient';
import { RefreshCw, X, Sun, Calendar, MapPin, Clock, ShieldCheck } from 'lucide-react';

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
    dayName,
    monthShort,
    dayOfMonth,
    year,
    dateString,
    sunTimes,
    is24Hour,
    setIs24Hour,
    source,
    latencyMs,
    driftMs,
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
          className={`flex items-center gap-2 sm:gap-3 bg-white/90 hover:bg-white border border-slate-200/90 px-2.5 sm:px-3 py-1.5 rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer select-none group ${className}`}
          onClick={() => setIsModalOpen(true)}
          title="Google NTP Atomic Clock (IST) • Click for Full Precision Chronometer"
        >
          {/* Main Digits */}
          <div className="flex items-baseline gap-1 font-mono tabular-nums">
            <span className="font-bold text-sm sm:text-base md:text-lg tracking-tight text-slate-900">
              {timeString}
            </span>
            {!is24Hour && (
              <span className="text-[10px] font-bold text-slate-500 uppercase font-sans">
                {ampm}
              </span>
            )}
          </div>

          {/* Sun & Date Info (Hidden on smaller screens) */}
          <div className="hidden xl:flex flex-col text-[10px] leading-tight text-slate-600 border-l border-slate-200 pl-2.5">
            <div className="flex items-center gap-1 font-medium whitespace-nowrap">
              <Sun className="w-3 h-3 text-amber-500 shrink-0" />
              <span className="text-slate-800 font-semibold font-mono tabular-nums">{sunTimes.sunrise} – {sunTimes.sunset}</span>
              <span className="text-slate-400">({sunTimes.duration})</span>
            </div>
            <div className="text-slate-500 font-medium whitespace-nowrap">
              {dateString}
            </div>
          </div>

          {/* 12h / 24h Pill Segment Switch */}
          <div
            className="flex items-center bg-slate-100 rounded-full p-0.5 border border-slate-200/80 shadow-2xs shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIs24Hour(false)}
              className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold transition-all cursor-pointer ${
                !is24Hour
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              12h
            </button>
            <button
              type="button"
              onClick={() => setIs24Hour(true)}
              className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold transition-all cursor-pointer ${
                is24Hour
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              24h
            </button>
          </div>

          {/* Live Sync Status Indicator Pulse */}
          <div
            className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/60"
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
              className="relative w-full max-w-xl animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <GoogleClock variant="card" />
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute -top-3 -right-3 p-2 bg-slate-900 text-white rounded-full hover:bg-black shadow-xl cursor-pointer border-2 border-white transition-transform active:scale-95"
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
  // Variant B: Card Mode (Executive Precision Chronometer)
  // ---------------------------------------------------------------------------
  const secondNum = Number(seconds) || 0;
  const progressPercent = Math.min(100, Math.max(0, ((secondNum + 1) / 60) * 100));

  return (
    <div className={`relative bg-gradient-to-b from-white via-white to-slate-50/80 border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/40 w-full select-none transition-all duration-300 ${className}`}>
      
      {/* Top Header: System Status & Controls */}
      <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-100">
        
        {/* Live NTP Sync Beacon */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-slate-800 text-xs tracking-tight">
              {source === 'Local System Clock' ? 'Local System Time' : 'Google NTP Atomic Sync'}
            </span>
            <span className="text-slate-300">•</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200/60">
              IST (UTC+5:30)
            </span>
            {latencyMs > 0 && (
              <span className="hidden sm:inline-flex items-center text-[10px] font-mono font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                {latencyMs}ms RTT
              </span>
            )}
          </div>
        </div>

        {/* Right Controls: 12h/24h toggle & Sync button */}
        <div className="flex items-center gap-2 shrink-0">
          {/* 12h / 24h Pill */}
          <div className="flex items-center bg-slate-100/90 p-0.5 rounded-lg border border-slate-200/80 shadow-2xs">
            <button
              type="button"
              onClick={() => setIs24Hour(false)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                !is24Hour
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              12h
            </button>
            <button
              type="button"
              onClick={() => setIs24Hour(true)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                is24Hour
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              24h
            </button>
          </div>

          {/* Sync Button */}
          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-lg shadow-2xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            title="Force synchronization with atomic time servers"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>
      </div>

      {/* Main Digital Chronometer Hero Display */}
      <div className="my-5 sm:my-7 py-5 sm:py-7 px-4 bg-gradient-to-b from-slate-50/70 to-slate-100/40 rounded-2xl border border-slate-200/70 shadow-inner">
        <div className="flex items-center justify-center">
          <div className="flex items-center font-mono tabular-nums tracking-tighter select-all">
            
            {/* Hours */}
            <span className="font-bold text-slate-900 text-6xl sm:text-7xl md:text-8xl lg:text-[96px] leading-none drop-shadow-xs">
              {hoursStr}
            </span>
            
            {/* Colon */}
            <span className="font-light text-slate-300 text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-none mx-1 sm:mx-2 select-none animate-pulse">
              :
            </span>
            
            {/* Minutes */}
            <span className="font-bold text-slate-900 text-6xl sm:text-7xl md:text-8xl lg:text-[96px] leading-none drop-shadow-xs">
              {minutes}
            </span>
            
            {/* Colon */}
            <span className="font-light text-slate-300 text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-none mx-1 sm:mx-2 select-none animate-pulse">
              :
            </span>
            
            {/* Seconds */}
            <span className="font-bold text-slate-700 text-6xl sm:text-7xl md:text-8xl lg:text-[96px] leading-none">
              {seconds}
            </span>

            {/* AM / PM Stack or 24H Badge */}
            <div className="ml-2.5 sm:ml-4 select-none">
              {!is24Hour ? (
                <div className="flex flex-col gap-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold tracking-widest font-mono uppercase transition-all ${
                    ampm === 'AM'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-300 border border-slate-200/80 bg-white/70'
                  }`}>
                    AM
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold tracking-widest font-mono uppercase transition-all ${
                    ampm === 'PM'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-300 border border-slate-200/80 bg-white/70'
                  }`}>
                    PM
                  </span>
                </div>
              ) : (
                <span className="px-2 py-1 rounded text-[10px] sm:text-xs font-bold tracking-wider font-mono uppercase bg-slate-200/80 text-slate-600 border border-slate-300/70">
                  24H
                </span>
              )}
            </div>

          </div>
        </div>

        {/* Dynamic 60-Second Cadence Timeline */}
        <div className="w-full max-w-sm sm:max-w-md mx-auto mt-4 sm:mt-5 pt-3 border-t border-slate-200/60">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1.5">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Second Cadence</span>
            </span>
            <span className="font-semibold text-slate-600 tabular-nums">
              {seconds}s / 60s
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-200/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-slate-900 via-indigo-600 to-emerald-500 rounded-full transition-all duration-300 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Precision Information Grid (Fixes orphan 'Current' and messy solar text) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-left">
        
        {/* Card 1: Calendar Date */}
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            <span>Calendar</span>
          </div>
          <div className="font-bold text-slate-800 text-xs sm:text-sm tracking-tight truncate">
            {dayName}
          </div>
          <div className="text-[11px] font-medium text-slate-500 truncate font-mono">
            {monthShort} {dayOfMonth}, {year}
          </div>
        </div>

        {/* Card 2: Solar Window */}
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>Maduravoyal Solar</span>
          </div>
          <div className="font-bold text-slate-800 text-xs sm:text-sm tracking-tight font-mono tabular-nums">
            {sunTimes.sunrise} – {sunTimes.sunset}
          </div>
          <div className="text-[11px] font-medium text-amber-600/90 truncate flex items-center gap-1 font-mono">
            {sunTimes.duration} daylight
          </div>
        </div>

        {/* Card 3: Location / Reference */}
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
            <span>Location</span>
          </div>
          <div className="font-bold text-slate-800 text-xs sm:text-sm tracking-tight truncate">
            Maduravoyal, TN
          </div>
          <div className="text-[11px] font-medium text-slate-500 truncate font-mono">
            13.0674° N, 80.1712° E
          </div>
        </div>

      </div>

    </div>
  );
};

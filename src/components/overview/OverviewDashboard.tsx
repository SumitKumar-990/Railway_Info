import React from 'react';
import { Train } from '../../types';
import { Sparkles, Clock, MapPin, Gauge, CloudRain, TrafficCone, ShieldCheck, Check, Train as TrainIcon, Navigation, ArrowRight } from 'lucide-react';

interface OverviewDashboardProps {
  trains: Train[];
  selectedTrain?: Train;
  onSelectTrain: (trainId: string) => void;
  onNavigatePage: (page: any) => void;
}

export default function OverviewDashboard({ trains, selectedTrain, onSelectTrain, onNavigatePage }: OverviewDashboardProps) {
  // Fallback to first train if selectedTrain not provided
  const train = selectedTrain || trains[0];

  // Dynamic conditions & impacts derived from active train state
  const isDelayed = train.delayMinutes > 5;
  const isCritical = train.delayMinutes > 25;

  const weatherText = train.delayMinutes > 25 ? 'Heavy Rain & Fog' : train.delayMinutes > 10 ? 'Light Rain' : 'Clear Sky';
  const trackStatusText = train.delayMinutes > 25 ? 'Signal Interlock Hold' : train.delayMinutes > 10 ? 'Moderate Congestion' : 'Clear Corridor';

  // Calculate remaining time dynamically against the live clock
  const remainingText = useMemo(() => {
    if (train.status === 'completed' || train.aiPredictedEta === 'Arrived') {
      return '0 min remaining (Arrived at Destination)';
    }
    if (train.status === 'not_started') {
      return `Scheduled departure at ${train.scheduledEta}`;
    }
    if (!train.aiPredictedEta || !train.aiPredictedEta.includes(':')) {
      return 'Calculating dynamic ETA...';
    }
    const now = new Date();
    const [hStr, mStr] = train.aiPredictedEta.split(':');
    const targetH = parseInt(hStr, 10);
    const targetM = parseInt(mStr, 10);
    const nowMins = now.getHours() * 60 + now.getMinutes();
    let targetMins = targetH * 60 + targetM;
    if (targetMins < nowMins) {
      targetMins += 24 * 60; // next day arrival
    }
    const diff = targetMins - nowMins;
    if (diff <= 1) return 'Arriving now';
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return h > 0 ? `${h} hr ${m} min remaining` : `${m} minutes remaining`;
  }, [train.aiPredictedEta, train.status, train.scheduledEta]);

  // Circular gauge SVG calculations
  const confidence = train.confidenceScore || 89;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (confidence / 100) * circumference;

  // Track progress fill percentage
  const trackProgressPct = Math.min(85, Math.max(15, (train.distanceCovered / (train.totalDistance || 600)) * 100 || 62));

  return (
    <div className="space-y-8">
      {/* ====================================================================
         1. MAIN HERO SECTION (Split Left ETA & Right Visual Route Card)
         ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Side: Dominant AI ETA Card */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden shadow-2xl">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-widest mb-2 font-mono">
              <Sparkles className="w-4 h-4" />
              <span>LIVE ETA PREDICTION</span>
            </div>

            <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight font-heading mb-6">
              Arriving at <span className="text-white">{train.destination}</span>
            </h2>

            {/* Subtlest accent glow around AI ETA only */}
            <div className="eta-glow-container mb-6">
              <div className="eta-large-time" id="hero-ai-eta">
                {train.aiPredictedEta}
              </div>
              <div className="text-sm font-semibold text-slate-400 mt-2">
                {remainingText}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-800/80">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Scheduled: <strong className="text-slate-200 font-mono">{train.scheduledEta}</strong></span>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>Current Delay:</span>
              <span
                className={`whitespace-nowrap inline-flex items-center justify-center font-mono font-bold px-2.5 py-1 rounded-lg text-xs leading-none border shadow-xs ${
                  isCritical
                    ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    : isDelayed
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                }`}
              >
                {train.delayMinutes === 0 ? 'On Time' : `+${train.delayMinutes} min`}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Premium Visual Route Card */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between shadow-2xl">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6">
              Live Position & Route Segment
            </div>

            <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800/80 space-y-6">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <div className="text-lg font-bold text-white font-heading">{train.origin}</div>
                  <div className="text-xs text-slate-500 font-mono">{train.originCode}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white font-heading">{train.destination}</div>
                  <div className="text-xs text-slate-500 font-mono">{train.destinationCode}</div>
                </div>
              </div>

              {/* Vector Track Bar with Train Position */}
              <div className="relative h-2 bg-slate-800 rounded-full my-6">
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full"
                  style={{ width: `${trackProgressPct}%` }}
                ></div>
                <div
                  className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-500"
                  style={{ left: `${trackProgressPct}%` }}
                >
                  <span className="bg-cyan-400 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider mb-1 whitespace-nowrap shadow-sm">
                    LIVE
                  </span>
                  <div className="w-9 h-9 rounded-full bg-slate-900 border-2 border-cyan-400 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-400/30">
                    <TrainIcon className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="flex justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                <span>Next Station Stop</span>
                <strong className="text-slate-200 font-mono">{train.nextStation} ({train.nextStationCode})</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 mt-4">
            <Navigation className="w-3.5 h-3.5 text-cyan-400" />
            <span>GPS Telemetry & Block Signaling Live Sync</span>
          </div>
        </div>
      </div>

      {/* ====================================================================
         2. CURRENT CONDITIONS (4 Compact Info Blocks)
         ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Location */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 hover:border-slate-700 transition">
          <div className="w-11 h-11 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-cyan-400 shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Current Location</div>
            <div className="text-sm font-bold text-white truncate mt-0.5">{train.currentLocation}</div>
          </div>
        </div>

        {/* Speed */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 hover:border-slate-700 transition">
          <div className="w-11 h-11 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-cyan-400 shrink-0">
            <Gauge className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Current Speed</div>
            <div className="text-sm font-bold text-white font-mono truncate mt-0.5">{train.currentSpeed} km/h</div>
          </div>
        </div>

        {/* Weather */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 hover:border-slate-700 transition">
          <div className="w-11 h-11 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-cyan-400 shrink-0">
            <CloudRain className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Weather</div>
            <div className="text-sm font-bold text-white truncate mt-0.5">{weatherText}</div>
          </div>
        </div>

        {/* Track Status */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 hover:border-slate-700 transition">
          <div className="w-11 h-11 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-cyan-400 shrink-0">
            <TrafficCone className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Track Status</div>
            <div className="text-sm font-bold text-white truncate mt-0.5">{trackStatusText}</div>
          </div>
        </div>
      </div>

      {/* ====================================================================
         3. ETA INTELLIGENCE SECTION (Two-Column Layout)
         ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Why the ETA changed */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-white font-heading">Why the ETA changed</h3>
            <p className="text-xs text-slate-400">Impact indicators & time delta breakdown</p>
          </div>

          <div className="space-y-3">
            {train.delayFactors && train.delayFactors.length > 0 ? (
              train.delayFactors.map((factor) => (
                <div
                  key={factor.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{factor.icon}</span>
                    <span className="text-sm font-semibold text-slate-200">{factor.name}</span>
                  </div>
                  <span
                    className={`font-mono text-xs font-bold px-2.5 py-1 rounded-lg ${
                      factor.type === 'gain'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {factor.impactMinutes > 0 ? `+${factor.impactMinutes} min` : `${factor.impactMinutes} min`}
                  </span>
                </div>
              ))
            ) : (
              <>
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🌧</span>
                    <span className="text-sm font-semibold text-slate-200">Rainfall Ahead</span>
                  </div>
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30">
                    +3 min
                  </span>
                </div>
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🚦</span>
                    <span className="text-sm font-semibold text-slate-200">Track Congestion</span>
                  </div>
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30">
                    +4 min
                  </span>
                </div>
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🚆</span>
                    <span className="text-sm font-semibold text-slate-200">Speed Below Average</span>
                  </div>
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30">
                    +2 min
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT: Prediction Confidence Gauge */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white font-heading">Prediction Confidence</h3>
              <p className="text-xs text-slate-400">Multi-source ensemble model accuracy</p>
            </div>
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
          </div>

          <div className="flex items-center gap-6 my-2">
            {/* SVG Circular Progress Meter */}
            <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="8"
                />
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke="url(#cyanProgressGrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-700"
                />
                <defs>
                  <linearGradient id="cyanProgressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0072ff" />
                    <stop offset="100%" stopColor="#00f2fe" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="absolute font-mono text-2xl font-black text-white">
                {confidence}%
              </span>
            </div>

            {/* Checklist */}
            <div className="space-y-2 text-xs text-slate-300">
              <div className="text-slate-400 font-bold text-[11px] uppercase tracking-wider mb-1">
                Prediction based on:
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Live Train Data</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Route Conditions</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Weather Telemetry</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Historical Delay Patterns</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
         4. ROUTE TIMELINE (Horizontal Station Visualization)
         ==================================================================== */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-white font-heading">Route Timeline</h3>
          <p className="text-xs text-slate-400">Station progression & predicted arrival sequence</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 relative">
          {train.timeline && train.timeline.length > 0 ? (
            train.timeline.map((stop, index) => {
              const isCompleted = stop.status === 'completed';
              const isActive = stop.status === 'current';
              const isLast = index === train.timeline.length - 1;

              return (
                <div key={stop.id} className="flex flex-col items-center text-center relative">
                  {!isLast && (
                    <div
                      className={`hidden md:block absolute top-4 left-1/2 w-full h-0.5 ${
                        isCompleted ? 'bg-gradient-to-r from-blue-600 to-cyan-400' : 'bg-slate-800'
                      }`}
                    ></div>
                  )}

                  <div
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs z-10 transition-all ${
                      isActive
                        ? 'bg-cyan-400 border-cyan-300 text-slate-950 shadow-lg shadow-cyan-400/40 scale-110'
                        : isCompleted
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400'
                        : 'bg-slate-900 border-slate-700 text-slate-500'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                  </div>

                  <div className="mt-3">
                    <div className="text-sm font-bold text-white font-heading uppercase">{stop.stationName}</div>
                    <div className="text-xs font-mono text-cyan-400 mt-0.5">
                      ETA {stop.predictedArrival || train.aiPredictedEta}
                    </div>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">
                      {isCompleted ? 'Completed' : isActive ? 'LIVE ETA' : 'Scheduled'}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <>
              {/* Default Fallback Demo Route */}
              <div className="flex flex-col items-center text-center relative">
                <div className="hidden md:block absolute top-4 left-1/2 w-full h-0.5 bg-gradient-to-r from-blue-600 to-cyan-400"></div>
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 border-2 border-cyan-400 text-cyan-400 flex items-center justify-center font-bold text-xs z-10">
                  <Check className="w-4 h-4" />
                </div>
                <div className="mt-3">
                  <div className="text-sm font-bold text-white font-heading">KANPUR</div>
                  <div className="text-xs text-slate-400">Completed</div>
                </div>
              </div>

              <div className="flex flex-col items-center text-center relative">
                <div className="hidden md:block absolute top-4 left-1/2 w-full h-0.5 bg-slate-800"></div>
                <div className="w-8 h-8 rounded-full bg-cyan-400 border-2 border-cyan-300 text-slate-950 font-bold text-xs flex items-center justify-center z-10 shadow-lg shadow-cyan-400/40 scale-110">
                  <TrainIcon className="w-4 h-4" />
                </div>
                <div className="mt-3">
                  <div className="text-sm font-bold text-white font-heading">PRAYAGRAJ</div>
                  <div className="text-xs font-mono text-cyan-400 font-bold">ETA {train.aiPredictedEta}</div>
                </div>
              </div>

              <div className="flex flex-col items-center text-center relative">
                <div className="hidden md:block absolute top-4 left-1/2 w-full h-0.5 bg-slate-800"></div>
                <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-slate-700 text-slate-500 flex items-center justify-center font-bold text-xs z-10">
                  3
                </div>
                <div className="mt-3">
                  <div className="text-sm font-bold text-white font-heading">MUGHALSARAI</div>
                  <div className="text-xs font-mono text-slate-400">ETA 20:42</div>
                </div>
              </div>

              <div className="flex flex-col items-center text-center relative">
                <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-slate-700 text-slate-500 flex items-center justify-center font-bold text-xs z-10">
                  4
                </div>
                <div className="mt-3">
                  <div className="text-sm font-bold text-white font-heading">PATNA</div>
                  <div className="text-xs font-mono text-slate-400">ETA 23:55</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ====================================================================
         5. MONITORED TRAINS SNAPSHOT TABLE
         ==================================================================== */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white font-heading">Monitored Express Trains Snapshot</h3>
            <p className="text-xs text-slate-400">Live operational telemetry & AI predicted arrival times</p>
          </div>
          <button
            onClick={() => onNavigatePage('monitor')}
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
          >
            <span>View All Monitored Trains</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-950/60">
                <th className="py-3 px-4 whitespace-nowrap">Train Number & Name</th>
                <th className="py-3 px-4 whitespace-nowrap">Current Location</th>
                <th className="py-3 px-4 whitespace-nowrap">Next Station</th>
                <th className="py-3 px-4 whitespace-nowrap">Speed</th>
                <th className="py-3 px-4 whitespace-nowrap">Current Delay</th>
                <th className="py-3 px-4 whitespace-nowrap">AI Predicted ETA</th>
                <th className="py-3 px-4 whitespace-nowrap">Confidence</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {trains.slice(0, 5).map(t => (
                <tr key={t.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[11px]">
                        {t.number}
                      </span>
                      <span>{t.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">{t.currentLocation}</td>
                  <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">{t.nextStation}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-cyan-400 whitespace-nowrap">{t.currentSpeed} km/h</td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`whitespace-nowrap inline-flex items-center justify-center font-mono font-bold px-2.5 py-1 rounded-md text-xs leading-none border shadow-xs ${
                        t.delayMinutes === 0
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : t.delayMinutes > 30
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {t.delayMinutes === 0 ? 'On Time' : `+${t.delayMinutes} min`}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-cyan-400 text-sm whitespace-nowrap">
                    {t.aiPredictedEta}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300 whitespace-nowrap">{t.confidenceScore}%</td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => {
                        onSelectTrain(t.id);
                        onNavigatePage('details');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition text-xs"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

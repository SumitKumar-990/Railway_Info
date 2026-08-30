import React from 'react';
import { Train } from '../../types';
import {
  MapPin,
  Gauge,
  Navigation,
  Clock,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  RotateCcw
} from 'lucide-react';

interface TrainDetailsViewProps {
  train: Train;
  trains: Train[];
  onSelectTrain: (trainId: string) => void;
}

export default function TrainDetailsView({ train, trains, onSelectTrain }: TrainDetailsViewProps) {
  const totalImpact = train.delayFactors.reduce((acc, df) => acc + df.impactMinutes, 0);

  return (
    <div className="space-y-6">
      {/* TRAIN SELECTOR BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Monitored Train:</span>
          <select
            value={train.id}
            onChange={e => onSelectTrain(e.target.value)}
            className="bg-slate-50 border border-slate-200 font-bold text-xs sm:text-sm text-slate-800 px-3 py-1.5 rounded-lg outline-none cursor-pointer w-full sm:w-auto"
          >
            {trains.map(t => (
              <option key={t.id} value={t.id}>
                {t.number} - {t.name} ({t.origin} → {t.destination})
              </option>
            ))}
          </select>
        </div>
        <div className="text-[11px] sm:text-xs text-slate-500 font-mono">
          Train ID: <strong className="text-slate-800">{train.id}</strong> | Zone: <strong className="text-slate-800">{train.zone}</strong>
        </div>
      </div>

      {/* TOP HEADER STATUS BANNER */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="bg-blue-600 text-white px-2.5 py-0.5 rounded font-mono font-bold text-xs">
              {train.number}
            </span>
            <span className="text-xs text-cyan-400 font-bold uppercase tracking-wider font-mono">
              {train.type} Express
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight font-heading">
            {train.name}
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            {train.origin} ({train.originCode}) → {train.destination} ({train.destinationCode})
          </p>
        </div>

        {/* Status Pill & Data Transparency Badges */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
          {/* Data Source Transparency Badges */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 text-[10px] font-mono font-bold">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> LIVE GPS
            </span>
            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
              ⚡ REAL XGBOOST MODEL
            </span>
          </div>

          <span
            className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 border shadow-lg ${
              train.status === 'completed'
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-blue-500/10'
                : train.status === 'not_started'
                ? 'bg-slate-500/20 text-slate-300 border-slate-500/40 shadow-slate-500/10'
                : train.status === 'on_time'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10'
                : train.status === 'critical'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-rose-500/10'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-500/10'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                train.status === 'completed'
                  ? 'bg-blue-400'
                  : train.status === 'not_started'
                  ? 'bg-slate-400'
                  : train.status === 'on_time'
                  ? 'bg-emerald-400'
                  : train.status === 'critical'
                  ? 'bg-rose-400'
                  : 'bg-amber-400'
              }`}
            ></span>
            {train.status === 'completed'
              ? 'Arrived at Destination'
              : train.status === 'not_started'
              ? 'Scheduled Departure'
              : train.delayMinutes === 0
              ? 'On Time Schedule'
              : `Running ${train.delayMinutes} Minutes Late`}
          </span>
        </div>
      </div>


      {/* TOP SUMMARY 6-GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* 1. Current Location */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Location</span>
          <div className="text-sm font-black text-slate-900 mt-1 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="truncate">{train.currentLocation}</span>
          </div>
        </div>

        {/* 2. Current Speed */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Speed</span>
          <div className="text-base font-black text-blue-700 font-mono mt-1 flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{train.currentSpeed} km/h</span>
          </div>
        </div>

        {/* 3. Distance Remaining */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Remaining Dist</span>
          <div className="text-sm font-black text-slate-900 font-mono mt-1 flex items-center gap-1.5">
            <Navigation className="w-4 h-4 text-slate-500 shrink-0" />
            <span>{train.totalDistance - train.distanceCovered} km</span>
          </div>
        </div>

        {/* 4. Next Station */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Next Station</span>
          <div className="text-sm font-black text-slate-900 mt-1 truncate">{train.nextStation}</div>
        </div>

        {/* 5. Final Predicted ETA */}
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Final AI ETA</span>
          <div className="text-lg font-black text-emerald-900 font-mono mt-0.5 flex items-center gap-1">
            <Clock className="w-4 h-4 text-emerald-700" />
            <span>{train.aiPredictedEta}</span>
          </div>
        </div>

        {/* 6. Prediction Confidence */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Confidence</span>
          <div className="text-base font-black text-cyan-600 font-mono mt-1 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-cyan-500" />
            <span>{train.confidenceScore}%</span>
          </div>
        </div>
      </div>

      {/* JOURNEY TIMELINE VISUALIZATION */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-heading">Route Journey Timeline</h3>
            <p className="text-xs text-slate-500">
              Completed stations, live current position & upcoming AI ETA forecasts
            </p>
          </div>
        </div>

        {/* Horizontal Timeline Track */}
        <div className="relative py-6 overflow-x-auto">
          <div className="min-w-[700px] flex items-center justify-between relative px-6">
            {/* Connecting Track Line */}
            <div className="absolute top-1/2 left-10 right-10 h-1 bg-slate-200 -translate-y-1/2 z-0"></div>

            {train.timeline.map((stop, idx) => {
              const isCompleted = stop.status === 'completed';
              const isCurrent = stop.status === 'current';

              return (
                <div key={stop.id} className="relative z-10 flex flex-col items-center text-center group min-w-[100px]">
                  {/* Station Marker Circle */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-md transition ${
                      isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-200 scale-125'
                        : isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white border-2 border-slate-300 text-slate-500'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : isCurrent ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>

                  {/* Station Code & Name */}
                  <div className="mt-3">
                    <div className="text-xs font-extrabold text-slate-900 uppercase font-mono">{stop.stationCode}</div>
                    <div className="text-[11px] font-semibold text-slate-600 max-w-[90px] truncate">
                      {stop.stationName}
                    </div>
                  </div>

                  {/* Arrival / ETA Badge */}
                  <div className="mt-1">
                    {isCompleted ? (
                      <span className="text-[10px] font-bold text-slate-400 font-mono">
                        Dep {stop.scheduledDeparture}
                      </span>
                    ) : (
                      <span
                        className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded ${
                          isCurrent
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        ETA {stop.predictedArrival}
                      </span>
                    )}
                  </div>

                  {/* Delay Diff */}
                  {stop.delayMinutes > 0 && (
                    <span className="text-[9px] font-bold font-mono text-amber-600 mt-0.5">
                      +{stop.delayMinutes}m delay
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ETA EXPLANATION PANEL ("Why Did the ETA Change?") */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SHAP Factor Breakdown (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900 font-heading">Why Did the ETA Change?</h3>
              </div>
              <p className="text-xs text-slate-500">
                AI Explainability: Feature contribution factors causing schedule deviation
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Net Delay Variance</span>
              <div className="text-lg font-black text-rose-600 font-mono">
                {totalImpact >= 0 ? `+${totalImpact} min` : `${totalImpact} min`}
              </div>
            </div>
          </div>

          {/* Factor List */}
          <div className="space-y-3">
            {train.delayFactors.map(factor => (
              <div
                key={factor.id}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between hover:bg-slate-100/70 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{factor.icon}</span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{factor.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{factor.description}</p>
                  </div>
                </div>
                <div
                  className={`whitespace-nowrap inline-flex items-center justify-center font-mono font-bold text-xs px-2.5 py-1 rounded border shadow-xs shrink-0 ${
                    factor.type === 'delay'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {factor.impactMinutes > 0 ? `+${factor.impactMinutes} min` : `${factor.impactMinutes} min`}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Confidence Gauge Panel (1 Col) */}
        <div className="bg-slate-900 text-white rounded-xl border border-slate-800 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider font-mono">
              Prediction Engine Confidence
            </span>
            <h3 className="text-base font-bold text-white mt-1">Telemetry Reliability</h3>

            {/* Gauge Circle */}
            <div className="my-6 flex flex-col items-center justify-center">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="64" cy="64" r="54" fill="none" stroke="#1e293b" strokeWidth="10" />
                  <circle
                    cx="64"
                    cy="64"
                    r="54"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="10"
                    strokeDasharray="339.29"
                    strokeDashoffset={339.29 * (1 - train.confidenceScore / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute font-mono font-black text-2xl text-white">
                  {train.confidenceScore}%
                </div>
              </div>
              <p className="text-xs text-emerald-400 font-bold mt-2">High Confidence Prediction</p>
            </div>

            <p className="text-xs text-slate-300 text-center leading-relaxed">
              Based on strong real-time GPS telemetry, high signal sensor density, and complete historical corridor records.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Model Refresh Rate:</span>
            <strong className="text-slate-200 font-mono">30s Live Ticker</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

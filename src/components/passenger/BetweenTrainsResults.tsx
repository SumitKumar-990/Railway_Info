import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, ArrowRight, Sparkles, Filter } from 'lucide-react';
import { BetweenTrainResult } from '../../types';
import { mockTrainService } from '../../services/mockTrainService';

interface BetweenTrainsResultsProps {
  fromCode: string;
  toCode: string;
  onSelectTrain: (trainId: string) => void;
  onBackToSearch: () => void;
}

const STATION_NAMES: Record<string, string> = {
  HWH: 'Howrah Jn',
  RNC: 'Ranchi',
  NDLS: 'New Delhi',
  CNB: 'Kanpur Central',
  PRYJ: 'Prayagraj Jn',
  MMCT: 'Mumbai Central',
  CSMT: 'Mumbai CSMT',
  MAO: 'Madgaon (Goa)',
  BSB: 'Varanasi Jn',
  DDU: 'Pt DD Upadhyaya',
  GAYA: 'Gaya Jn',
  DGR: 'Durgapur',
  DHN: 'Dhanbad Jn',
  RKMP: 'Rani Kamlapati',
  AGC: 'Agra Cantt',
  SDAH: 'Sealdah'
};

export default function BetweenTrainsResults({
  fromCode,
  toCode,
  onSelectTrain,
  onBackToSearch
}: BetweenTrainsResultsProps) {
  const [trains, setTrains] = useState<BetweenTrainResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadTrains() {
      setIsLoading(true);
      try {
        const res = await mockTrainService.getTrainsBetween(fromCode, toCode);
        if (isMounted) {
          setTrains(res);
        }
      } catch (e) {
        // Fallback
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadTrains();
    return () => {
      isMounted = false;
    };
  }, [fromCode, toCode]);

  const fromLabel = STATION_NAMES[fromCode] ? `${STATION_NAMES[fromCode]} (${fromCode})` : fromCode;
  const toLabel = STATION_NAMES[toCode] ? `${STATION_NAMES[toCode]} (${toCode})` : toCode;

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToSearch}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-blue-600 text-xs font-bold transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Change Stations</span>
        </button>

        <div className="text-right">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Search Route
          </span>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 justify-end">
            <span>{fromLabel}</span>
            <ArrowRight className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{toLabel}</span>
          </h2>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 font-heading">
            Direct & Connected Trains ({trains.length})
          </h3>
          <p className="text-xs text-slate-500">
            Click any train to view live position, station stops, and RailVue AI ETA.
          </p>
        </div>
      </div>

      {/* Trains List Cards */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 rounded-3xl bg-slate-100 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : trains.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl font-bold">
            🚆
          </div>
          <h4 className="text-base font-bold text-slate-800">No Direct Trains Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            We couldn't find direct trains between {fromLabel} and {toLabel} for today's schedule.
          </p>
          <button
            onClick={onBackToSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-blue-700 transition"
          >
            Try Another Search
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {trains.map((t) => (
            <div
              key={t.train_number}
              onClick={() => onSelectTrain(t.train_number)}
              className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-blue-500/80 shadow-md hover:shadow-xl transition cursor-pointer group space-y-4"
            >
              {/* Card Top */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-extrabold text-lg text-blue-600 group-hover:text-blue-700 transition">
                    {t.train_number}
                  </span>
                  <span className="font-bold text-slate-900 text-base">
                    {t.train_name}
                  </span>
                  <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                    {t.type}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-400">
                    Runs: {Array.isArray(t.runs_on) ? t.runs_on.join(', ') : 'Daily'}
                  </span>
                </div>
              </div>

              {/* Schedule Timing Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                {/* Departure */}
                <div className="space-y-0.5">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                    Departure
                  </span>
                  <p className="text-xl font-mono font-extrabold text-slate-900">
                    {t.departure_time}
                  </p>
                  <p className="text-xs text-slate-600 font-medium truncate">
                    {t.source_station_name} ({t.source_station_code})
                  </p>
                </div>

                {/* Duration & Track Line */}
                <div className="text-center space-y-1">
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full inline-block">
                    ⏱ {t.duration}
                  </span>
                  <div className="w-full flex items-center gap-1 text-slate-300">
                    <div className="h-0.5 bg-slate-200 flex-1"></div>
                    <span className="text-xs text-slate-400 font-bold">🚆</span>
                    <div className="h-0.5 bg-slate-200 flex-1"></div>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {t.total_distance_km} km
                  </span>
                </div>

                {/* Arrival */}
                <div className="text-left sm:text-right space-y-0.5">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                    Arrival
                  </span>
                  <p className="text-xl font-mono font-extrabold text-slate-900">
                    {t.arrival_time}
                  </p>
                  <p className="text-xs text-slate-600 font-medium truncate">
                    {t.destination_station_name} ({t.destination_station_code})
                  </p>
                </div>
              </div>

              {/* Card Footer CTA */}
              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="text-emerald-700 font-bold flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Telemetry Available
                </span>

                <button
                  type="button"
                  className="px-4 py-2 bg-blue-600 group-hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 transition flex items-center gap-1.5"
                >
                  <span>Track Live ETA</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

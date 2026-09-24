import React, { useState, useMemo } from 'react';
import { Filter, Clock, MapPin, ChevronDown, ChevronUp, CheckCircle2, Navigation, AlertTriangle, Sparkles, Edit3, HelpCircle, Info, Train as TrainIcon, ShieldAlert } from 'lucide-react';
import { StationStop } from '../../types';
import { formatPassengerTime } from '../../utils/timeFormat';

interface RailRadarTimelineProps {
  trainNumber: string;
  trainName: string;
  sourceStationName: string;
  destinationStationName: string;
  totalDistanceKm: number;
  scheduledDuration?: string;
  runningDays?: string[];
  stations: StationStop[];
  currentDelay: number;
  currentStationCode?: string;
  selectedStation?: StationStop | null;
  onSelectStation?: (station: StationStop) => void;
  coachPosition?: string;
  journeyDate?: string;
}

export default function RailRadarTimeline({
  trainNumber,
  trainName,
  sourceStationName,
  destinationStationName,
  totalDistanceKm,
  scheduledDuration = '37 hours 0 minutes',
  runningDays = ['Daily'],
  stations = [],
  currentDelay,
  currentStationCode,
  selectedStation,
  onSelectStation,
  coachPosition = 'ENG, LPR, GEN, GEN, HA1, A2, A1, B5, B4, B3, B2, B1, PC, S7, S6, S5, S4, S3, S2, S1, GEN, GEN, SLRD',
  journeyDate
}: RailRadarTimelineProps) {
  const [showHaltsOnly, setShowHaltsOnly] = useState(false);
  const [showCoachModal, setShowCoachModal] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  // Default to 12-hour AM/PM format for maximum passenger readability
  const [use24HourTime, setUse24HourTime] = useState(false);

  // Dynamic Day Header Date Labels
  const day1DateLabel = useMemo(() => {
    if (!journeyDate) return 'DAY 1';
    try {
      const [y, m, d] = journeyDate.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      return `DAY 1 • ${d.toString().padStart(2, '0')} ${months[dt.getMonth()]}`;
    } catch {
      return 'DAY 1';
    }
  }, [journeyDate]);

  const day2DateLabel = useMemo(() => {
    if (!journeyDate) return 'DAY 2';
    try {
      const [y, m, d] = journeyDate.split('-').map(Number);
      const dt = new Date(y, m - 1, d + 1);
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      return `DAY 2 • ${dt.getDate().toString().padStart(2, '0')} ${months[dt.getMonth()]}`;
    } catch {
      return 'DAY 2';
    }
  }, [journeyDate]);

  // Filter stations based on halts toggle
  const visibleStations = showHaltsOnly ? stations.filter(s => s.isHalt !== false) : stations;

  const defaultFaqs = [
    {
      q: `What time does ${trainNumber} (${trainName}) start from ${sourceStationName}?`,
      a: `It departs from ${sourceStationName} (${stations[0]?.stationCode || 'ORG'}) at ${formatPassengerTime(stations[0]?.scheduledDeparture, use24HourTime).formatted} and reaches ${destinationStationName} (${stations[stations.length - 1]?.stationCode || 'DEST'}) at ${formatPassengerTime(stations[stations.length - 1]?.scheduledArrival, use24HourTime).formatted}.`
    },
    {
      q: `What is the last station for ${trainNumber}?`,
      a: `The final station of ${trainNumber} is ${destinationStationName} (${stations[stations.length - 1]?.stationCode || 'DEST'}), arriving at ${formatPassengerTime(stations[stations.length - 1]?.scheduledArrival, use24HourTime).formatted}. You can see the full schedule and route map above.`
    },
    {
      q: `Where is train number ${trainNumber} right now?`,
      a: `You can check the live location of ${trainNumber} (${trainName}) on the interactive map above. We update the train's position continuously using GPS telemetry & signal interlock reports.`
    },
    {
      q: `How accurate is the running status for train ${trainNumber}?`,
      a: `The running status is highly accurate because it uses real-time GPS locations and RailVue AI XGBoost predictions. This is much faster and more accurate than traditional ntes station arrival reports.`
    },
    {
      q: `Why is train ${trainNumber} showing offline or not updating?`,
      a: `If a train is showing offline, it means telemetry data is temporarily re-synchronizing. The position will auto-refresh as soon as the next sectional beacon updates.`
    },
    {
      q: `What is the coach position of ${trainNumber} ${trainName}?`,
      a: `The coach order of ${trainNumber} from the engine end is: ${coachPosition}. Coach composition can change at short notice, so confirm on the coach indicator board at the station.`
    },
    {
      q: `Which platform does ${trainNumber} arrive at?`,
      a: `The platform for ${trainNumber} differs at each station along its route from ${sourceStationName} to ${destinationStationName}. Scheduled platform numbers are shown in the PF column of the schedule above; check the live station board for real-time changes.`
    },
    {
      q: `What is the total travel distance of ${trainNumber}?`,
      a: `It covers a total distance of ${totalDistanceKm} km from ${sourceStationName} to ${destinationStationName} in about ${scheduledDuration}.`
    },
    {
      q: `On which days does ${trainNumber} run?`,
      a: `This train runs on: ${Array.isArray(runningDays) ? runningDays.join(', ') : 'Daily'}. Please verify the running status before leaving for the station.`
    }
  ];

  return (
    <div className="bg-[#0b101b] text-slate-100 rounded-3xl border border-slate-800 shadow-2xl p-4 sm:p-6 space-y-6">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-black text-white font-heading tracking-tight">
              {trainNumber} — {trainName}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Full station schedule with Scheduled, Actual, and ML Predicted arrival & departure timings
          </p>
        </div>

        {/* Action Buttons: 12h/24h Time Format Toggle, Coach Order, Halts Filter */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Time Format Toggle */}
          <button
            onClick={() => setUse24HourTime(!use24HourTime)}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 border text-xs ${
              use24HourTime
                ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
            }`}
            title="Switch between 12-hour (AM/PM) and 24-hour railway time"
          >
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>{use24HourTime ? '24-Hour (Railway)' : '12-Hour (AM/PM)'}</span>
          </button>

          <button
            onClick={() => setShowCoachModal(!showCoachModal)}
            className="px-3 py-1.5 rounded-xl font-bold bg-slate-800 text-blue-400 hover:bg-slate-700 border border-slate-700 transition flex items-center gap-1.5"
          >
            <TrainIcon className="w-3.5 h-3.5 text-blue-400" />
            <span>Coach Order</span>
          </button>

          <button
            onClick={() => setShowHaltsOnly(!showHaltsOnly)}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
              showHaltsOnly
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{showHaltsOnly ? 'Halts Only' : 'All Stops'}</span>
          </button>
        </div>
      </div>

      {/* Coach Order Modal Overlay */}
      {showCoachModal && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 text-xs space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-extrabold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              🚆 Coach Composition ({trainNumber})
            </span>
            <button onClick={() => setShowCoachModal(false)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
          </div>
          <p className="font-mono text-slate-200 text-xs leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
            Engine → {coachPosition}
          </p>
          <p className="text-[11px] text-slate-400 italic">
            Note: Coach sequence is subject to operational updates at station platforms.
          </p>
        </div>
      )}

      {/* 3-COLUMN TABLE HEADER */}
      <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-400 px-3 py-2 bg-slate-900/60 rounded-xl border border-slate-800/80">
        <span className="w-[30%] sm:w-[35%] text-left">ARRIVAL</span>
        <span className="flex-1 text-center bg-slate-800 px-3 py-0.5 rounded-full text-slate-200 text-[11px] font-mono mx-2">
          {day1DateLabel}
        </span>
        <span className="w-[30%] sm:w-[35%] text-right">DEPARTURE</span>
      </div>

      {/* RAILWAY TRACK TIMELINE CONTAINER */}
      <div className="space-y-0.5 relative">
        {visibleStations.map((st, idx) => {
          const isCompleted = st.status === 'DEPARTED' || st.status === 'PASSED' || st.status === 'completed';
          const isCurrent = st.status === 'AT_STATION' || st.status === 'current' || st.stationCode === currentStationCode;
          const isApproaching = st.status === 'APPROACHING';
          const isOrigin = idx === 0;
          const isDestination = idx === visibleStations.length - 1;

          const delayMins = st.delayMinutes ?? currentDelay;
          const isDelayed = delayMins > 5;
          const isSelected = selectedStation?.stationCode === st.stationCode;

          // Parse and format passenger-friendly times
          const rawSchedArr = st.scheduledArrival && st.scheduledArrival !== '--' ? st.scheduledArrival : (st.scheduledDeparture || '--');
          const rawActArr = st.actualArrival || st.predictedArrival || st.scheduledArrival;
          const schedArrInfo = formatPassengerTime(rawSchedArr, use24HourTime, journeyDate);
          const actArrInfo = formatPassengerTime(rawActArr, use24HourTime, journeyDate);

          const rawSchedDep = st.scheduledDeparture && st.scheduledDeparture !== '--' ? st.scheduledDeparture : (st.scheduledArrival || '--');
          const rawActDep = st.actualDeparture || st.predictedDeparture || st.scheduledDeparture;
          const schedDepInfo = formatPassengerTime(rawSchedDep, use24HourTime, journeyDate);
          const actDepInfo = formatPassengerTime(rawActDep, use24HourTime, journeyDate);

          // Day divider insertion if distance exceeds 600km
          const showDay2Header = idx > 0 && (st.distanceFromOrigin || st.distanceKm || 0) >= 600 && (visibleStations[idx - 1].distanceFromOrigin || visibleStations[idx - 1].distanceKm || 0) < 600;

          return (
            <React.Fragment key={`st-row-${st.stationCode}-${idx}`}>
              {showDay2Header && (
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-400 px-3 py-2 bg-slate-900/60 rounded-xl border border-slate-800/80 my-4">
                  <span className="w-[30%] sm:w-[35%] text-left">ARRIVAL</span>
                  <span className="flex-1 text-center bg-slate-800 px-3 py-0.5 rounded-full text-slate-200 text-[11px] font-mono mx-2">
                    {day2DateLabel}
                  </span>
                  <span className="w-[30%] sm:w-[35%] text-right">DEPARTURE</span>
                </div>
              )}

              <div
                onClick={() => onSelectStation && onSelectStation(st)}
                className={`group relative flex items-center py-3 px-2 rounded-2xl transition cursor-pointer z-10 border ${
                  isSelected
                    ? 'bg-blue-900/40 border-blue-500 shadow-md'
                    : isCurrent
                    ? 'bg-blue-950/60 border-blue-600/80 shadow-lg'
                    : 'hover:bg-slate-900/60 border-transparent'
                }`}
              >
                {/* 1. LEFT COLUMN: ARRIVAL TIME */}
                <div className="w-[30%] sm:w-[35%] text-left pr-2 space-y-0.5 font-mono">
                  {isOrigin ? (
                    <div className="text-xs text-slate-500 font-mono italic">Source</div>
                  ) : (
                    <>
                      {/* Scheduled Time (Muted) */}
                      <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-400 font-mono">
                        <span className="text-[10px] text-slate-500 font-sans uppercase font-bold tracking-wider">Sch</span>
                        <span className={isDelayed && actArrInfo.formatted !== '--' ? 'line-through text-slate-500' : 'text-slate-300 font-medium'}>
                          {schedArrInfo.formatted}
                        </span>
                      </div>

                      {/* Actual / Expected Time (Highlighted) */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-xs sm:text-sm font-black font-mono tracking-tight ${
                          isDelayed ? 'text-rose-400' : 'text-emerald-400'
                        }`}>
                          {actArrInfo.formatted !== '--' ? actArrInfo.formatted : schedArrInfo.formatted}
                        </span>
                        {actArrInfo.dayDiffLabel && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-md">
                            {actArrInfo.dayDiffLabel}
                          </span>
                        )}
                        {isDelayed && delayMins > 0 && (
                          <span className="text-[10px] font-bold text-rose-400/90 font-mono">
                            +{Math.round(delayMins)}m
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* 2. CENTER COLUMN: RAILWAY TRACK & STATION INFO */}
                <div className="flex-1 flex items-center gap-3 sm:gap-4 z-20">
                  {/* Track Node Column with continuous track connector */}
                  <div className="relative flex flex-col items-center justify-center shrink-0 w-6 h-12">
                    {/* Upper track segment connecting from previous stop */}
                    {idx > 0 && (
                      <div className={`absolute top-0 bottom-1/2 w-0.5 z-0 ${isCompleted || isCurrent ? 'bg-amber-400' : 'bg-slate-700'}`} />
                    )}
                    {/* Lower track segment connecting to next stop */}
                    {idx < visibleStations.length - 1 && (
                      <div className={`absolute top-1/2 bottom-0 w-0.5 z-0 ${isCompleted ? 'bg-amber-400' : 'bg-slate-700'}`} />
                    )}

                    {/* Node Circle on Track */}
                    <div className={`relative z-10 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 transition-transform ${
                      isCurrent
                        ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-400/30 scale-125 shadow-lg animate-pulse'
                        : isCompleted
                        ? 'bg-amber-400 text-slate-950 shadow-sm'
                        : 'bg-amber-400/80 text-slate-950'
                    }`}>
                      {isCurrent ? '🚆' : (isCompleted ? '✓' : '●')}
                    </div>
                  </div>

                  {/* Station Name & Badges */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-white text-xs sm:text-sm font-heading truncate">
                        {st.stationName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 flex-wrap">
                      <span className="font-mono font-bold text-slate-300">{st.stationCode}</span>
                      <span>•</span>
                      <span>{(st.distanceFromOrigin || st.distanceKm || (idx * 25)).toFixed(1)} km</span>

                      {st.platform && (
                        <span className="text-[10px] font-bold text-blue-400 bg-blue-950/80 border border-blue-800/80 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                          {st.platform} <Edit3 className="w-2.5 h-2.5 opacity-60" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. RIGHT COLUMN: DEPARTURE TIME */}
                <div className="w-[30%] sm:w-[35%] text-right pl-2 space-y-0.5 font-mono">
                  {isDestination ? (
                    <div className="text-xs text-slate-500 font-mono italic">Terminus</div>
                  ) : (
                    <>
                      {/* Scheduled Departure (Muted) */}
                      <div className="flex items-center justify-end gap-1 text-[11px] sm:text-xs text-slate-400 font-mono">
                        <span className="text-[10px] text-slate-500 font-sans uppercase font-bold tracking-wider">Sch</span>
                        <span className={isDelayed && actDepInfo.formatted !== '--' ? 'line-through text-slate-500' : 'text-slate-300 font-medium'}>
                          {schedDepInfo.formatted}
                        </span>
                      </div>

                      {/* Actual / Expected Departure (Highlighted) */}
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {isDelayed && delayMins > 0 && (
                          <span className="text-[10px] font-bold text-rose-400/90 font-mono">
                            +{Math.round(delayMins)}m
                          </span>
                        )}
                        {actDepInfo.dayDiffLabel && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-md">
                            {actDepInfo.dayDiffLabel}
                          </span>
                        )}
                        <span className={`text-xs sm:text-sm font-black font-mono tracking-tight ${
                          isDelayed ? 'text-rose-400' : 'text-emerald-400'
                        }`}>
                          {actDepInfo.formatted !== '--' ? actDepInfo.formatted : schedDepInfo.formatted}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* FREQUENTLY ASKED QUESTIONS SECTION (Matching RailRadar Specs) */}
      {/* ========================================================================= */}
      <div className="pt-8 border-t border-slate-800 space-y-4">
        <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-300 font-heading flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-blue-400" />
          <span>FREQUENTLY ASKED QUESTIONS — {trainNumber} {trainName}</span>
        </h4>

        <div className="space-y-3">
          {defaultFaqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs transition"
            >
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                className="w-full flex items-center justify-between text-left font-bold text-slate-100 hover:text-blue-400 transition"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openFaqIndex === idx ? 'rotate-180 text-blue-400' : ''}`} />
              </button>

              {(openFaqIndex === idx || idx < 3) && (
                <p className="text-slate-300 text-xs leading-relaxed border-t border-slate-800/80 pt-2 font-sans">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

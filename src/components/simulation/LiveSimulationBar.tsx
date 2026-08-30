import React, { useState } from 'react';
import { SimulationState } from '../../types';
import { CloudRain, TrafficCone, AlertTriangle, Zap, RotateCcw, Activity, ChevronUp, ChevronDown, Sliders } from 'lucide-react';

interface LiveSimulationBarProps {
  simulationState: SimulationState;
  onToggleEvent: (eventKey: 'rain' | 'congestion' | 'signal' | 'recovery') => void;
  onReset: () => void;
  toastMessage: string | null;
}

export default function LiveSimulationBar({
  simulationState,
  onToggleEvent,
  onReset,
  toastMessage
}: LiveSimulationBarProps) {
  const [isCollapsedMobile, setIsCollapsedMobile] = useState(true);

  const activeCount = [
    simulationState.rain,
    simulationState.congestion,
    simulationState.signal,
    simulationState.recovery
  ].filter(Boolean).length;

  return (
    <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 z-40 flex flex-col items-end gap-2 select-none max-w-full pointer-events-none">
      {/* Toast Notification Alert Banner */}
      {toastMessage && (
        <div className="pointer-events-auto bg-slate-900 border border-cyan-400/40 text-cyan-300 px-3.5 py-2 rounded-xl shadow-2xl backdrop-blur-md text-xs font-bold font-mono animate-in fade-in slide-in-from-bottom-2 duration-200 flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-[11px] sm:text-xs">{toastMessage}</span>
        </div>
      )}

      {/* Mobile Minimized Pill Button */}
      <div className="sm:hidden pointer-events-auto w-full flex justify-end">
        <button
          onClick={() => setIsCollapsedMobile(prev => !prev)}
          className="bg-slate-900/95 border border-cyan-400/40 px-3.5 py-2 rounded-xl text-cyan-300 text-xs font-bold font-heading flex items-center gap-2 shadow-2xl backdrop-blur-md"
        >
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span>Simulation Controls {activeCount > 0 && `(${activeCount})`}</span>
          {isCollapsedMobile ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
        </button>
      </div>

      {/* Simulation Engine Panel */}
      <div
        className={`pointer-events-auto bg-slate-900/95 border border-slate-800 p-3 sm:p-3.5 rounded-2xl shadow-2xl backdrop-blur-md flex-col sm:flex-row items-center gap-2.5 sm:gap-3 text-white text-xs w-full sm:w-auto ${
          isCollapsedMobile ? 'hidden sm:flex' : 'flex'
        }`}
      >
        <div className="text-left border-b sm:border-b-0 sm:border-r border-slate-800 pb-2 sm:pb-0 sm:pr-4 w-full sm:w-auto flex items-center justify-between sm:block">
          <div>
            <div className="text-xs font-black text-white font-heading flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Test Live Conditions</span>
            </div>
            <div className="text-[10px] text-slate-400">See how AI ETA adapts to events</div>
          </div>
          <button
            onClick={() => setIsCollapsedMobile(true)}
            className="sm:hidden text-slate-400 hover:text-white p-1"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap w-full sm:w-auto justify-start sm:justify-start">
          {/* 🌧 Rain */}
          <button
            onClick={() => onToggleEvent('rain')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 sm:gap-1.5 border text-[11px] sm:text-xs ${
              simulationState.rain
                ? 'bg-blue-600/30 border-blue-400 text-cyan-300 shadow-md shadow-blue-500/20'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span>🌧 Rain</span>
          </button>

          {/* 🚦 Congestion */}
          <button
            onClick={() => onToggleEvent('congestion')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 sm:gap-1.5 border text-[11px] sm:text-xs ${
              simulationState.congestion
                ? 'bg-amber-600/30 border-amber-400 text-amber-300 shadow-md shadow-amber-500/20'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <TrafficCone className="w-3.5 h-3.5" />
            <span>🚦 Congestion</span>
          </button>

          {/* 🚨 Signal Delay */}
          <button
            onClick={() => onToggleEvent('signal')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 sm:gap-1.5 border text-[11px] sm:text-xs ${
              simulationState.signal
                ? 'bg-rose-600/30 border-rose-400 text-rose-300 shadow-md shadow-rose-500/20'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>🚨 Signal</span>
          </button>

          {/* ⚡ Speed Recovery */}
          <button
            onClick={() => onToggleEvent('recovery')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 sm:gap-1.5 border text-[11px] sm:text-xs ${
              simulationState.recovery
                ? 'bg-emerald-600/30 border-emerald-400 text-emerald-300 shadow-md shadow-emerald-500/20'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>⚡ Recovery</span>
          </button>

          {/* Reset */}
          <button
            onClick={onReset}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 text-[11px] sm:text-xs"
            title="Reset Simulation Baseline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
}

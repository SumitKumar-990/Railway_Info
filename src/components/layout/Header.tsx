import React, { useState } from 'react';
import { Search, Bell, Clock, Cpu, ChevronDown } from 'lucide-react';
import { Train, NavPage } from '../../types';

interface HeaderProps {
  activePage: NavPage;
  trains: Train[];
  selectedTrain: Train;
  onSelectTrain: (trainId: string) => void;
  onNavigateToDetails: () => void;
  lastUpdated: string;
}

export default function Header({
  activePage,
  trains,
  selectedTrain,
  onSelectTrain,
  onNavigateToDetails,
  lastUpdated
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const filteredSearch = searchQuery.trim()
    ? trains.filter(
        t =>
          t.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.currentLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.destination.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <header className="bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-20 px-8 py-4 shadow-xl flex items-center justify-between">
      {/* Brand & Subtitle Header */}
      <div className="flex items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white tracking-tight font-heading flex items-center gap-1.5">
              RailVue <span className="text-cyan-400">AI</span>
            </h1>
            <span className="text-xs text-slate-500 font-bold">•</span>
            <span className="text-xs font-semibold text-slate-400 capitalize">
              {activePage === 'details' ? 'Train Details' : activePage}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Smarter ETA. Better Journeys.
          </p>
        </div>
      </div>

      {/* Right Controls: Train Selector Dropdown + LIVE Badge */}
      <div className="flex items-center gap-4">
        {/* Global Train Search Dropdown */}
        <div className="relative w-64">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search train # or station..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-400 focus:bg-slate-900 text-xs font-medium text-slate-200 pl-9 pr-4 py-2 rounded-xl outline-none transition"
            />
          </div>

          {/* Search Dropdown Results */}
          {isSearchFocused && filteredSearch.length > 0 && (
            <div className="absolute top-full left-0 w-full mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-800/60 max-h-72 overflow-y-auto">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase bg-slate-950">
                Matching Monitored Trains ({filteredSearch.length})
              </div>
              {filteredSearch.map(train => (
                <button
                  key={train.id}
                  onClick={() => {
                    onSelectTrain(train.id);
                    onNavigateToDetails();
                    setSearchQuery('');
                  }}
                  className="w-full px-3.5 py-2.5 text-left hover:bg-slate-800/80 flex items-center justify-between transition group"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-400 transition">
                      {train.number} {train.name}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {train.origin} → {train.destination}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                      train.delayMinutes === 0
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {train.delayMinutes === 0 ? 'On Time' : `+${train.delayMinutes}m`}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Primary Train Selector Dropdown */}
        <div className="relative">
          <select
            value={selectedTrain.id}
            onChange={e => onSelectTrain(e.target.value)}
            className="appearance-none bg-slate-900 border border-slate-800 text-slate-100 font-bold text-xs px-4 py-2 pr-9 rounded-xl outline-none cursor-pointer hover:border-slate-700 transition"
          >
            {trains.map(t => (
              <option key={t.id} value={t.id}>
                Train {t.number} - {t.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Live Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold font-mono uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse" />
          <span>LIVE</span>
        </div>
      </div>
    </header>
  );
}

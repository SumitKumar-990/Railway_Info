import React, { useState, useEffect, useRef } from 'react';
import { Search, Train as TrainIcon, ArrowRightLeft, Clock, MapPin, Sparkles, AlertCircle, ArrowRight, Ticket, Zap } from 'lucide-react';
import { StationItem } from '../../types';
import { mockTrainService } from '../../services/mockTrainService';
import { EXPANDED_TRAINS, VANDE_BHARAT_TRAINS, SHATABDI_TRAINS, RAJDHANI_TRAINS, searchExpandedTrains, QuickTrain } from '../../data/expandedTrains';
import SeatBookingModal from './SeatBookingModal';

interface PassengerHomeProps {
  onSelectTrain: (trainId: string) => void;
  onSearchBetween: (fromCode: string, toCode: string) => void;
}

export default function PassengerHome({ onSelectTrain, onSearchBetween }: PassengerHomeProps) {
  const [activeTab, setActiveTab] = useState<'track' | 'find' | 'book'>('track');
  const [bookingTrain, setBookingTrain] = useState<QuickTrain | null>(null);
  const [catalogFilter, setCatalogFilter] = useState<'all' | 'Vande Bharat' | 'Shatabdi' | 'Rajdhani'>('all');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [trainQuery, setTrainQuery] = useState('');
  const [trainSuggestions, setTrainSuggestions] = useState<any[]>([]);
  const [isSearchingTrain, setIsSearchingTrain] = useState(false);

  // Between stations state
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [fromCode, setFromCode] = useState('');
  const [toCode, setToCode] = useState('');
  const [fromSuggestions, setFromSuggestions] = useState<StationItem[]>([]);
  const [toSuggestions, setToSuggestions] = useState<StationItem[]>([]);
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const fromRef = useRef<HTMLDivElement>(null);
  const toRef = useRef<HTMLDivElement>(null);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setTrainSuggestions([]);
      }
      if (fromRef.current && !fromRef.current.contains(e.target as Node)) {
        setShowFromDropdown(false);
      }
      if (toRef.current && !toRef.current.contains(e.target as Node)) {
        setShowToDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Quick Trains (Kept strictly as convenient shortcuts)
  const popularTrains = [
    { number: '10103', name: 'Mandovi Express', route: 'CSMT → MAO', badge: 'Live Konkan Tracker' },
    { number: '12019', name: 'Howrah - Ranchi Shatabdi', route: 'HWH → RNC', badge: 'Active Live' },
    { number: '12301', name: 'Howrah Rajdhani Express', route: 'HWH → NDLS', badge: 'High-Speed' },
    { number: '22436', name: 'Vande Bharat Express', route: 'NDLS → BSB', badge: 'Semi-High Speed' },
    { number: '12951', name: 'Mumbai Rajdhani Express', route: 'MMCT → NDLS', badge: 'Trunk Route' }
  ];

  // Filtered catalog for booking tab
  const catalogTrains = React.useMemo(() => {
    let trains = catalogFilter === 'all' ? EXPANDED_TRAINS
      : catalogFilter === 'Vande Bharat' ? VANDE_BHARAT_TRAINS
      : catalogFilter === 'Shatabdi' ? SHATABDI_TRAINS
      : RAJDHANI_TRAINS;
    if (catalogSearch.trim()) {
      return searchExpandedTrains(catalogSearch, 60).filter(t =>
        catalogFilter === 'all' ? true : t.type === catalogFilter
      );
    }
    return trains;
  }, [catalogFilter, catalogSearch]);

  // Debounced Universal Train Search (Connected to GET /api/trains/search?q={query}&limit=15)
  useEffect(() => {
    const trimmed = trainQuery.trim();
    if (trimmed.length < 2 && !/^\d{2,}$/.test(trimmed)) {
      setTrainSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingTrain(true);
      try {
        const res = await mockTrainService.searchTrains(trimmed, 15);
        setTrainSuggestions(res);
      } catch (err) {
        setTrainSuggestions([]);
      } finally {
        setIsSearchingTrain(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [trainQuery]);

  // Debounced From Station Search
  useEffect(() => {
    if (!fromQuery.trim()) {
      setFromSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await mockTrainService.searchStations(fromQuery);
      setFromSuggestions(res);
    }, 200);
    return () => clearTimeout(timer);
  }, [fromQuery]);

  // Debounced To Station Search
  useEffect(() => {
    if (!toQuery.trim()) {
      setToSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await mockTrainService.searchStations(toQuery);
      setToSuggestions(res);
    }, 200);
    return () => clearTimeout(timer);
  }, [toQuery]);

  const resolveInputCode = (text: string, currentCode: string): string => {
    if (currentCode && currentCode.length <= 5) return currentCode.toUpperCase();
    const trimmed = text.trim();
    if (!trimmed) return '';
    const m = trimmed.match(/\(([A-Za-z0-9]+)\)/);
    if (m) return m[1].toUpperCase();
    if (trimmed.length <= 5 && /^[A-Za-z0-9]+$/.test(trimmed)) {
      return trimmed.toUpperCase();
    }
    const upper = trimmed.toUpperCase();
    if (upper.includes('HOWRAH')) return 'HWH';
    if (upper.includes('RANCHI')) return 'RNC';
    if (upper.includes('DELHI')) return 'NDLS';
    if (upper.includes('KANPUR')) return 'CNB';
    if (upper.includes('MUMBAI') || upper.includes('BOMBAY')) return 'MMCT';
    if (upper.includes('VARANASI') || upper.includes('BANARAS')) return 'BSB';
    if (upper.includes('PRAYAGRAJ') || upper.includes('ALLAHABAD')) return 'PRYJ';
    if (upper.includes('GOA') || upper.includes('MADGAON')) return 'MAO';
    if (upper.includes('DURGAPUR')) return 'DGR';
    if (upper.includes('DHANBAD')) return 'DHN';
    if (upper.includes('BHOPAL')) return 'RKMP';
    if (upper.includes('AGRA')) return 'AGC';
    if (upper.includes('SEALDAH')) return 'SDAH';
    return trimmed.substring(0, 4).toUpperCase();
  };

  const handleSelectFrom = (st: StationItem) => {
    setFromQuery(`${st.name} (${st.code})`);
    setFromCode(st.code);
    setShowFromDropdown(false);
  };

  const handleSelectTo = (st: StationItem) => {
    setToQuery(`${st.name} (${st.code})`);
    setToCode(st.code);
    setShowToDropdown(false);
  };

  const resolveStationCode = (query: string, explicitCode: string, fallback: string): string => {
    if (explicitCode && explicitCode.trim()) return explicitCode.trim().toUpperCase();
    const paren = query.match(/\(([A-Za-z0-9]+)\)/);
    if (paren) return paren[1].toUpperCase().trim();
    const clean = query.trim().toUpperCase();
    if (clean.length >= 2 && clean.length <= 5 && /^[A-Z0-9]+$/.test(clean)) return clean;
    const lower = query.toLowerCase();
    if (lower.includes('kanpur')) return 'CNB';
    if (lower.includes('howrah') || lower.includes('kolkata')) return 'HWH';
    if (lower.includes('delhi')) return 'NDLS';
    if (lower.includes('prayagraj') || lower.includes('allahabad')) return 'PRYJ';
    if (lower.includes('varanasi') || lower.includes('banaras')) return 'BSB';
    if (lower.includes('ranchi')) return 'RNC';
    if (lower.includes('mumbai') || lower.includes('bombay')) return 'MMCT';
    if (lower.includes('goa') || lower.includes('madgaon')) return 'MAO';
    if (lower.includes('patna')) return 'PNBE';
    if (lower.includes('bhopal')) return 'BPL';
    if (lower.includes('lucknow')) return 'LKO';
    if (lower.includes('gorakhpur')) return 'GKP';
    if (lower.includes('agra')) return 'AGC';
    if (lower.includes('gwalior')) return 'GWL';
    if (lower.includes('jhansi')) return 'VGLJ';
    if (lower.includes('gaya')) return 'GAYA';
    if (lower.includes('dhanbad')) return 'DHN';
    return clean.substring(0, 4) || fallback;
  };

  const handleFindSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const src = resolveStationCode(fromQuery, fromCode, 'CNB');
    const dst = resolveStationCode(toQuery, toCode, 'HWH');
    onSearchBetween(src, dst);
  };

  const handleSwapStations = () => {
    const tempQ = fromQuery;
    const tempC = fromCode;
    setFromQuery(toQuery);
    setFromCode(toCode);
    setToQuery(tempQ);
    setToCode(tempC);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Hero Welcome Banner */}
      <div className="text-center space-y-3">
        <div className="flex justify-center mb-1">
          <img
            src="/railvue-logo.png"
            alt="RailVue AI Logo"
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl shadow-xl shadow-blue-500/10 border border-slate-200/80 bg-white p-1.5 object-contain"
          />
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>RailVue AI — Real-Time Railway Telemetry & Dynamic ETA Intelligence</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-heading">
          Where is your train right now?
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
          Track live Indian Railways positions, accurate station arrival times, and AI-predicted ETAs across 1,500+ curated trains.
        </p>
      </div>

      {/* Main Tabbed Search Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6 relative">
        {/* Tab Controls */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('track')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition duration-150 ${
              activeTab === 'track'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <TrainIcon className="w-4 h-4" />
            <span>Track</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('find')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition duration-150 ${
              activeTab === 'find'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Find</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('book')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition duration-150 ${
              activeTab === 'book'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>Book Seat</span>
          </button>
        </div>

        {/* 1. TRACK MY TRAIN TAB (Connected to GET /api/trains/search) */}
        {activeTab === 'track' && (
          <div className="space-y-4">
            <div ref={searchRef} className="relative">
              <div className="relative flex items-center">
                <Search className="w-6 h-6 text-slate-400 absolute left-4 pointer-events-none" />
                <input
                  type="text"
                  value={trainQuery}
                  onChange={(e) => setTrainQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setTrainSuggestions([]);
                  }}
                  placeholder="Enter train number or train name (e.g. 12019, Rajdhani, Mandovi, 12301)..."
                  className="w-full pl-13 pr-4 py-4.5 bg-slate-50 border border-slate-200 rounded-2xl text-base text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>

              {/* Universal Train Suggestions Dropdown */}
              {trainSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 divide-y divide-slate-100 max-h-96 overflow-y-auto">
                  <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-10">
                    <span>Train Search Results ({trainSuggestions.length})</span>
                    <span>Click to Track Live</span>
                  </div>
                  {trainSuggestions.map((t: any) => {
                    const tNum = t.train_number || t.number || t.train_id;
                    const tName = t.train_name || t.name;
                    const src = t.source_station_name || t.origin || '';
                    const dst = t.destination_station_name || t.destination || '';
                    return (
                      <button
                        key={tNum}
                        onClick={() => {
                          onSelectTrain(tNum);
                          setTrainQuery('');
                          setTrainSuggestions([]);
                        }}
                        className="w-full text-left p-4 hover:bg-blue-50/70 transition flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                            🚆
                          </div>
                          <div>
                            {/* Prominent Train Number on Top */}
                            <span className="font-mono font-extrabold text-base text-blue-600 group-hover:text-blue-700 transition block">
                              {tNum}
                            </span>
                            {/* Train Name Underneath */}
                            <p className="text-sm font-bold text-slate-900 group-hover:text-blue-900 transition">
                              {tName}
                            </p>
                            {src && dst && (
                              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                                {src} → {dst}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition shrink-0">
                          Track Live →
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick search hints */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-1">
              <span className="font-semibold text-slate-600">Quick searches:</span>
              <button
                type="button"
                onClick={() => onSelectTrain('12019')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition"
              >
                12019 (Howrah - Ranchi Shatabdi)
              </button>
              <button
                type="button"
                onClick={() => onSelectTrain('12301')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition"
              >
                12301 (Howrah Rajdhani)
              </button>
              <button
                type="button"
                onClick={() => onSelectTrain('10104')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition"
              >
                10104 (Mandovi Express)
              </button>
              <button
                type="button"
                onClick={() => onSelectTrain('22436')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition"
              >
                22436 (Vande Bharat)
              </button>
            </div>
          </div>
        )}

        {/* 2. FIND TRAINS BETWEEN STATIONS TAB */}
        {activeTab === 'find' && (
          <form onSubmit={handleFindSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] gap-3 items-center">
              {/* FROM STATION */}
              <div ref={fromRef} className="relative">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  From Station
                </label>
                <div className="relative">
                  <MapPin className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={fromQuery}
                    onFocus={() => setShowFromDropdown(true)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFromQuery(val);
                      setShowFromDropdown(true);
                      const m = val.match(/\(([A-Za-z0-9]+)\)/);
                      if (m) {
                        setFromCode(m[1].toUpperCase());
                      } else if (val.trim().length <= 5 && /^[A-Za-z0-9]+$/.test(val.trim())) {
                        setFromCode(val.trim().toUpperCase());
                      } else {
                        setFromCode('');
                      }
                    }}
                    placeholder="Enter source station (e.g. HWH, Howrah)"
                    className="w-full pl-11 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>

                {showFromDropdown && fromSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-100">
                    {fromSuggestions.map((st) => (
                      <button
                        type="button"
                        key={st.code}
                        onClick={() => handleSelectFrom(st)}
                        className="w-full text-left p-3 hover:bg-blue-50 text-xs flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-slate-900">{st.name}</span>
                          <span className="text-slate-400 ml-1">({st.city})</span>
                        </div>
                        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {st.code}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* SWAP BUTTON */}
              <div className="flex justify-center sm:pt-6">
                <button
                  type="button"
                  onClick={handleSwapStations}
                  className="p-2.5 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 border border-slate-200 transition shadow-sm"
                  title="Swap stations"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </button>
              </div>

              {/* TO STATION */}
              <div ref={toRef} className="relative">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  To Station
                </label>
                <div className="relative">
                  <MapPin className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={toQuery}
                    onFocus={() => setShowToDropdown(true)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setToQuery(val);
                      setShowToDropdown(true);
                      const m = val.match(/\(([A-Za-z0-9]+)\)/);
                      if (m) {
                        setToCode(m[1].toUpperCase());
                      } else if (val.trim().length <= 5 && /^[A-Za-z0-9]+$/.test(val.trim())) {
                        setToCode(val.trim().toUpperCase());
                      } else {
                        setToCode('');
                      }
                    }}
                    placeholder="Enter destination station (e.g. RNC, Ranchi)"
                    className="w-full pl-11 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>

                {showToDropdown && toSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-100">
                    {toSuggestions.map((st) => (
                      <button
                        type="button"
                        key={st.code}
                        onClick={() => handleSelectTo(st)}
                        className="w-full text-left p-3 hover:bg-blue-50 text-xs flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-slate-900">{st.name}</span>
                          <span className="text-slate-400 ml-1">({st.city})</span>
                        </div>
                        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {st.code}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition duration-150 flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>Find Trains on Route</span>
            </button>

            {/* Popular Route Shortcuts */}
            <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
              <span className="font-semibold text-slate-500">Popular Routes:</span>
              {[
                { label: 'Howrah ⇄ Ranchi', fromName: 'Howrah Junction (HWH)', fromCode: 'HWH', toName: 'Ranchi Junction (RNC)', toCode: 'RNC' },
                { label: 'New Delhi ⇄ Kanpur', fromName: 'New Delhi (NDLS)', fromCode: 'NDLS', toName: 'Kanpur Central (CNB)', toCode: 'CNB' },
                { label: 'Mumbai ⇄ New Delhi', fromName: 'Mumbai Central (MMCT)', fromCode: 'MMCT', toName: 'New Delhi (NDLS)', toCode: 'NDLS' },
                { label: 'New Delhi ⇄ Varanasi', fromName: 'New Delhi (NDLS)', fromCode: 'NDLS', toName: 'Varanasi Junction (BSB)', toCode: 'BSB' },
                { label: 'Mumbai ⇄ Goa (MAO)', fromName: 'Mumbai CSMT (CSMT)', fromCode: 'CSMT', toName: 'Madgaon Goa (MAO)', toCode: 'MAO' }
              ].map((route) => (
                <button
                  key={route.label}
                  type="button"
                  onClick={() => {
                    setFromQuery(route.fromName);
                    setFromCode(route.fromCode);
                    setToQuery(route.toName);
                    setToCode(route.toCode);
                    onSearchBetween(route.fromCode, route.toCode);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium transition border border-blue-200/60"
                >
                  {route.label}
                </button>
              ))}
            </div>
          </form>
        )}
      </div>

      {/* Popular Trains Grid (Quick Shortcuts Only) */}
      {activeTab !== 'book' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              POPULAR TRAINS
            </h3>
            <span className="text-[11px] font-medium text-slate-400">
              Quick shortcuts • Search any train across India above
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {popularTrains.map((pt) => (
              <div
                key={pt.number}
                className="bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-5 hover:shadow-md transition cursor-pointer flex items-center justify-between group"
              >
                <div
                  className="space-y-1 flex-1"
                  onClick={() => onSelectTrain(pt.number)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-blue-600 text-base">
                      {pt.number}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">•</span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      {pt.badge}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition">
                    {pt.name}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">{pt.route}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      const match = EXPANDED_TRAINS.find(t => t.number === pt.number);
                      if (match) setBookingTrain(match);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 text-xs font-bold border border-indigo-200 transition"
                  >
                    Book
                  </button>
                  <span
                    onClick={() => onSelectTrain(pt.number)}
                    className="w-9 h-9 rounded-xl bg-slate-50 group-hover:bg-blue-600 group-hover:text-white text-slate-400 flex items-center justify-center font-bold text-sm transition"
                  >
                    →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BOOK SEAT TAB — Full Train Catalog */}
      {activeTab === 'book' && (
        <div className="space-y-5">
          {/* Category filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {(['all', 'Vande Bharat', 'Shatabdi', 'Rajdhani'] as const).map(f => (
              <button
                key={f}
                onClick={() => setCatalogFilter(f)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition ${
                  catalogFilter === f
                    ? f === 'Vande Bharat' ? 'bg-purple-600 text-white shadow-md'
                    : f === 'Shatabdi' ? 'bg-blue-600 text-white shadow-md'
                    : f === 'Rajdhani' ? 'bg-cyan-700 text-white shadow-md'
                    : 'bg-slate-800 text-white shadow-md'
                    : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                {f === 'all' ? '🚂 All Trains' : f === 'Vande Bharat' ? '🚄 Vande Bharat' : f === 'Shatabdi' ? '⚡ Shatabdi' : '🔵 Rajdhani'}
                <span className="ml-1.5 opacity-70 font-mono text-[10px]">
                  ({f === 'all' ? EXPANDED_TRAINS.length : f === 'Vande Bharat' ? VANDE_BHARAT_TRAINS.length : f === 'Shatabdi' ? SHATABDI_TRAINS.length : RAJDHANI_TRAINS.length})
                </span>
              </button>
            ))}
          </div>

          {/* Search within catalog */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={catalogSearch}
              onChange={e => setCatalogSearch(e.target.value)}
              placeholder="Search by train number, name, or station..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          {/* Train list */}
          <div className="grid gap-3">
            {catalogTrains.map(train => {
              const typeColor = train.type === 'Vande Bharat' ? 'bg-purple-100 text-purple-700 border-purple-200'
                : train.type === 'Shatabdi' ? 'bg-blue-100 text-blue-700 border-blue-200'
                : train.type === 'Rajdhani' ? 'bg-cyan-100 text-cyan-700 border-cyan-200'
                : train.type === 'Duronto' ? 'bg-violet-100 text-violet-700 border-violet-200'
                : 'bg-slate-100 text-slate-700 border-slate-200';
              return (
                <div key={train.number} className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-sm transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono font-black text-blue-600 text-base">{train.number}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${typeColor}`}>{train.type}</span>
                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{train.zone}</span>
                        {train.maxSpeed >= 160 && <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">⚡ {train.maxSpeed} km/h</span>}
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm leading-tight truncate">{train.name}</h4>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                        <span className="font-bold text-slate-700">{train.fromCode}</span>
                        <ArrowRight className="w-3 h-3" />
                        <span className="font-bold text-slate-700">{train.toCode}</span>
                        <span className="text-slate-300">•</span>
                        <span>{train.distanceKm} km</span>
                        <span className="text-slate-300">•</span>
                        <span>{train.departureTime} → {train.arrivalTime}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {train.classes.map(cls => (
                          <span key={cls} className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{cls}</span>
                        ))}
                        <span className="text-[10px] text-slate-400">{train.runsOn.length === 7 ? 'Daily' : train.runsOn.join(', ')}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={() => setBookingTrain(train)}
                        className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition shadow-sm flex items-center gap-1.5"
                      >
                        <Ticket className="w-3.5 h-3.5" />
                        Book
                      </button>
                      <button
                        onClick={() => onSelectTrain(train.number)}
                        className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition"
                      >
                        Track
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {catalogTrains.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <div className="text-4xl mb-3">🔍</div>
              <p className="font-semibold">No trains found for your search</p>
            </div>
          )}
        </div>
      )}

      {/* Seat Booking Modal */}
      {bookingTrain && (
        <SeatBookingModal
          train={bookingTrain}
          isOpen={!!bookingTrain}
          onClose={() => setBookingTrain(null)}
        />
      )}
    </div>
  );
}

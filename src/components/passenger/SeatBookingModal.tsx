import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Train as TrainIcon,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Star,
  ArrowRight,
  Info,
  Shield,
  CreditCard,
  Ticket,
  RefreshCw
} from 'lucide-react';
import { QuickTrain, ClassAvailability } from '../../data/expandedTrains';

interface SeatBookingModalProps {
  train: QuickTrain;
  isOpen: boolean;
  onClose: () => void;
}

type BookingStep = 'class' | 'seats' | 'passengers' | 'payment' | 'confirmation';

interface Seat {
  number: string;
  type: 'window' | 'middle' | 'aisle' | 'lower' | 'middle-berth' | 'upper' | 'side-lower' | 'side-upper';
  available: boolean;
  selected: boolean;
}

interface Passenger {
  id: number;
  name: string;
  age: string;
  gender: 'M' | 'F' | 'O';
  berth: 'LB' | 'MB' | 'UB' | 'SL' | 'SU' | 'W' | 'A' | 'Auto';
}

const CLASS_COLORS: Record<string, string> = {
  '1A': 'from-amber-600 to-amber-500',
  '2A': 'from-cyan-600 to-cyan-500',
  '3A': 'from-emerald-600 to-emerald-500',
  'SL': 'from-yellow-600 to-yellow-500',
  'CC': 'from-blue-600 to-blue-500',
  'EC': 'from-purple-600 to-purple-500',
  '2S': 'from-slate-600 to-slate-500',
  'GN': 'from-gray-600 to-gray-500',
};

const CLASS_DESCRIPTIONS: Record<string, string> = {
  '1A': '4-berth coupe with privacy curtains, bedroll included',
  '2A': '2-tier berths with curtains, bedroll included',
  '3A': '3-tier AC berths, most popular class',
  'SL': 'Non-AC sleeper, 8 berths per compartment',
  'CC': 'Airline-style AC reclining seats',
  'EC': 'Premium reclining seats with more legroom',
  '2S': 'Bench seating, short journeys',
  'GN': 'General unreserved coach',
};

function generateSeatMap(classConfig: ClassAvailability, coachNum: number): Seat[] {
  const seats: Seat[] = [];
  const isChairCar = classConfig.code === 'CC' || classConfig.code === 'EC' || classConfig.code === '2S';
  const isSleeper = classConfig.code === 'SL' || classConfig.code === '3A' || classConfig.code === '2A' || classConfig.code === '1A';

  const totalSeats = isChairCar ? 78 : (classConfig.code === '1A' ? 24 : classConfig.code === '2A' ? 52 : 72);

  for (let i = 1; i <= totalSeats; i++) {
    let type: Seat['type'];
    let available = Math.random() > 0.35; // ~65% seats available

    if (isChairCar) {
      const posInRow = ((i - 1) % 6);
      if (posInRow === 0 || posInRow === 5) type = 'window';
      else if (posInRow === 1 || posInRow === 4) type = 'middle';
      else type = 'aisle';
    } else if (isSleeper) {
      const posInBay = ((i - 1) % 8);
      if (classConfig.code === '1A') {
        type = posInBay % 2 === 0 ? 'lower' : 'upper';
      } else if (classConfig.code === '2A') {
        const pos4 = ((i - 1) % 4);
        type = ['lower', 'upper', 'side-lower', 'side-upper'][pos4] as Seat['type'];
      } else {
        type = (['lower', 'middle-berth', 'upper', 'lower', 'middle-berth', 'upper', 'side-lower', 'side-upper'] as Seat['type'][])[posInBay];
      }
    } else {
      type = 'aisle';
    }

    seats.push({
      number: `${coachNum}-${String(i).padStart(2, '0')}`,
      type,
      available,
      selected: false,
    });
  }
  return seats;
}

const BERTH_OPTIONS_MAP: Record<string, { code: string; label: string }[]> = {
  '3A': [{ code: 'LB', label: 'Lower Berth' }, { code: 'MB', label: 'Middle Berth' }, { code: 'UB', label: 'Upper Berth' }, { code: 'SL', label: 'Side Lower' }, { code: 'SU', label: 'Side Upper' }, { code: 'Auto', label: 'Auto' }],
  '2A': [{ code: 'LB', label: 'Lower Berth' }, { code: 'UB', label: 'Upper Berth' }, { code: 'SL', label: 'Side Lower' }, { code: 'SU', label: 'Side Upper' }, { code: 'Auto', label: 'Auto' }],
  '1A': [{ code: 'LB', label: 'Lower Berth' }, { code: 'UB', label: 'Upper Berth' }, { code: 'Auto', label: 'Auto' }],
  'SL': [{ code: 'LB', label: 'Lower Berth' }, { code: 'MB', label: 'Middle Berth' }, { code: 'UB', label: 'Upper Berth' }, { code: 'SL', label: 'Side Lower' }, { code: 'SU', label: 'Side Upper' }, { code: 'Auto', label: 'Auto' }],
  'CC': [{ code: 'W', label: 'Window' }, { code: 'A', label: 'Aisle' }, { code: 'Auto', label: 'Auto' }],
  'EC': [{ code: 'W', label: 'Window' }, { code: 'A', label: 'Aisle' }, { code: 'Auto', label: 'Auto' }],
};

function getSeatBg(seat: Seat): string {
  if (seat.selected) return 'bg-blue-600 border-blue-700 text-white scale-105 shadow-lg shadow-blue-500/30';
  if (!seat.available) return 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed';
  return 'bg-white border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700 cursor-pointer transition-all';
}

function getSeatIcon(type: Seat['type']): string {
  if (type === 'window') return '🪟';
  if (type === 'upper' || type === 'side-upper') return '🔼';
  if (type === 'lower' || type === 'side-lower') return '🔽';
  if (type === 'middle-berth' || type === 'middle') return '↔';
  if (type === 'aisle') return '🚶';
  return '💺';
}

export default function SeatBookingModal({ train, isOpen, onClose }: SeatBookingModalProps) {
  const [step, setStep] = useState<BookingStep>('class');
  const [selectedClass, setSelectedClass] = useState<ClassAvailability | null>(null);
  const [selectedCoach, setSelectedCoach] = useState<number>(1);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [numPassengers, setNumPassengers] = useState(1);
  const [passengers, setPassengers] = useState<Passenger[]>([
    { id: 1, name: '', age: '', gender: 'M', berth: 'Auto' }
  ]);
  const [journeyDate, setJourneyDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pnr, setPnr] = useState('');
  const [quota, setQuota] = useState<'GN' | 'TQ' | 'LD' | 'HP'>('GN');

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setStep('class');
      setSelectedClass(null);
      setSelectedSeats([]);
      setPassengers([{ id: 1, name: '', age: '', gender: 'M', berth: 'Auto' }]);
      setNumPassengers(1);
    }
  }, [isOpen]);

  // Generate seat map when class/coach changes
  useEffect(() => {
    if (selectedClass) {
      setSeats(generateSeatMap(selectedClass, selectedCoach));
      setSelectedSeats([]);
    }
  }, [selectedClass, selectedCoach]);

  const handleSelectSeat = (seatNum: string) => {
    setSeats(prev => prev.map(s => {
      if (s.number !== seatNum) return s;
      if (!s.available) return s;
      if (s.selected) {
        setSelectedSeats(ss => ss.filter(n => n !== seatNum));
        return { ...s, selected: false };
      }
      if (selectedSeats.length >= numPassengers) return s;
      setSelectedSeats(ss => [...ss, seatNum]);
      return { ...s, selected: true };
    }));
  };

  const handleNumPassengerChange = (n: number) => {
    setNumPassengers(n);
    setPassengers(prev => {
      if (n > prev.length) {
        return [...prev, ...Array.from({ length: n - prev.length }, (_, i) => ({
          id: prev.length + i + 1,
          name: '',
          age: '',
          gender: 'M' as 'M',
          berth: 'Auto' as 'Auto'
        }))];
      }
      return prev.slice(0, n);
    });
    setSelectedSeats([]);
    setSeats(prev => prev.map(s => ({ ...s, selected: false })));
  };

  const updatePassenger = (id: number, field: keyof Passenger, value: string) => {
    setPassengers(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const totalFare = selectedClass ? Math.round(selectedClass.farePerKm * train.distanceKm * numPassengers) : 0;
  const baseFare = selectedClass ? Math.round(selectedClass.farePerKm * train.distanceKm) : 0;

  const handleConfirm = async () => {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 2200));
    setPnr(`PNR${Math.floor(Math.random() * 9000000000 + 1000000000)}`);
    setIsProcessing(false);
    setStep('confirmation');
  };

  const isChairCar = selectedClass?.code === 'CC' || selectedClass?.code === 'EC';
  const berthOptions = selectedClass ? (BERTH_OPTIONS_MAP[selectedClass.code] || [{ code: 'Auto', label: 'Auto' }]) : [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white px-6 py-5 flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full">{train.type}</span>
              <span className="text-xs text-blue-200 font-mono font-bold">{train.number}</span>
            </div>
            <h2 className="text-lg font-extrabold leading-tight">{train.name.replace(/^\d+ - /, '')}</h2>
            <p className="text-blue-200 text-sm font-medium mt-0.5 flex items-center gap-1.5">
              <span className="font-bold text-white">{train.fromCode}</span>
              <ArrowRight className="w-3.5 h-3.5" />
              <span className="font-bold text-white">{train.toCode}</span>
              <span className="text-blue-300 ml-1">• {train.distanceKm} km</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress */}
        {step !== 'confirmation' && (
          <div className="flex border-b border-slate-100 bg-slate-50 shrink-0">
            {(['class', 'seats', 'passengers', 'payment'] as BookingStep[]).map((s, i) => {
              const labels = ['Class', 'Seats', 'Passengers', 'Payment'];
              const stepOrder: BookingStep[] = ['class', 'seats', 'passengers', 'payment'];
              const currentIdx = stepOrder.indexOf(step);
              const thisIdx = stepOrder.indexOf(s);
              const isDone = thisIdx < currentIdx;
              const isActive = s === step;
              return (
                <div key={s} className="flex-1 flex items-center justify-center py-2.5 relative gap-1.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition ${
                    isDone ? 'bg-emerald-500 text-white' : isActive ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {isDone ? '✓' : i + 1}
                  </span>
                  <span className={`text-[11px] font-bold ${isActive ? 'text-blue-700' : isDone ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {labels[i]}
                  </span>
                  {i < 3 && (
                    <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-px h-5 ${isDone ? 'bg-emerald-200' : 'bg-slate-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* ====== STEP 1: CLASS SELECTION ====== */}
          {step === 'class' && (
            <div className="space-y-4">
              {/* Date + Quota */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Journey Date</label>
                  <input
                    type="date"
                    value={journeyDate}
                    onChange={e => setJourneyDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Booking Quota</label>
                  <select
                    value={quota}
                    onChange={e => setQuota(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  >
                    <option value="GN">General (GN)</option>
                    <option value="TQ">Tatkal (TQ)</option>
                    <option value="LD">Ladies (LD)</option>
                    <option value="HP">Handicapped (HP)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Number of Passengers</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <button
                      key={n}
                      onClick={() => handleNumPassengerChange(n)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-black transition ${
                        numPassengers === n
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">Select Travel Class</h3>
                <div className="grid gap-3">
                  {train.coachConfig.classes.map(cls => {
                    const availableSeats = Math.floor(cls.seatsPerCoach * cls.coaches * 0.65);
                    const fare = Math.round(cls.farePerKm * train.distanceKm);
                    return (
                      <button
                        key={cls.code}
                        onClick={() => setSelectedClass(cls)}
                        className={`w-full text-left rounded-2xl border-2 p-4 transition-all duration-150 ${
                          selectedClass?.code === cls.code
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${CLASS_COLORS[cls.code] || 'from-slate-600 to-slate-500'} text-white flex items-center justify-center font-black text-sm shrink-0`}>
                              {cls.code}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-sm">{cls.name}</div>
                              <div className="text-xs text-slate-500 mt-0.5">{CLASS_DESCRIPTIONS[cls.code]}</div>
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className={`text-xs font-bold ${availableSeats > 50 ? 'text-emerald-600' : availableSeats > 10 ? 'text-amber-600' : 'text-rose-600'}`}>
                                  {availableSeats > 0 ? `${availableSeats} seats available` : 'Waitlist'}
                                </span>
                                <span className="text-xs text-slate-400">• {cls.coaches} coaches</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-lg font-black text-slate-900">₹{fare.toLocaleString()}</div>
                            <div className="text-[10px] text-slate-400 font-medium">per person</div>
                            {numPassengers > 1 && (
                              <div className="text-xs font-bold text-blue-600 mt-0.5">₹{(fare * numPassengers).toLocaleString()} total</div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3.5 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 font-medium">
                  Fares shown are base fares. Tatkal charges, service fees and GST will be added at checkout. This is a demo simulation — no real booking is made.
                </p>
              </div>
            </div>
          )}

          {/* ====== STEP 2: SEAT SELECTION ====== */}
          {step === 'seats' && selectedClass && (
            <div className="space-y-4">
              {/* Coach selector */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Select Coach</label>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {Array.from({ length: selectedClass.coaches }, (_, i) => i + 1).map(n => (
                    <button
                      key={n}
                      onClick={() => setSelectedCoach(n)}
                      className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-black transition ${
                        selectedCoach === n
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {selectedClass.code}{n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-white border-2 border-slate-200" /><span className="text-slate-600">Available</span></div>
                <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-blue-600" /><span className="text-slate-600">Selected</span></div>
                <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-slate-200" /><span className="text-slate-600">Booked</span></div>
                <span className="ml-auto text-blue-600 font-bold">{selectedSeats.length}/{numPassengers} selected</span>
              </div>

              {/* Seat Map */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                {/* Train direction indicator */}
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase mb-3">
                  <span>🚂 Engine</span>
                  <span className="font-mono">{train.fromCode} → {train.toCode}</span>
                  <span>Guard 🛑</span>
                </div>

                {isChairCar ? (
                  /* Chair Car Layout (3+3 or 2+2) */
                  <div className="space-y-2">
                    {Array.from({ length: Math.ceil(seats.length / 6) }, (_, rowIdx) => {
                      const rowSeats = seats.slice(rowIdx * 6, (rowIdx + 1) * 6);
                      return (
                        <div key={rowIdx} className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400 font-mono w-5 text-right shrink-0">{rowIdx + 1}</span>
                          <div className="flex gap-1 flex-1">
                            {rowSeats.slice(0, 3).map(seat => (
                              <button
                                key={seat.number}
                                onClick={() => handleSelectSeat(seat.number)}
                                disabled={!seat.available}
                                className={`flex-1 h-9 rounded-lg border-2 text-[9px] font-black transition-all ${getSeatBg(seat)}`}
                                title={`${seat.number} - ${seat.type} - ${seat.available ? 'Available' : 'Booked'}`}
                              >
                                {seat.number.split('-')[1]}
                              </button>
                            ))}
                          </div>
                          {/* Aisle gap */}
                          <div className="w-4 shrink-0 flex items-center justify-center">
                            <div className="w-0.5 h-6 bg-slate-200 rounded" />
                          </div>
                          <div className="flex gap-1 flex-1">
                            {rowSeats.slice(3).map(seat => (
                              <button
                                key={seat.number}
                                onClick={() => handleSelectSeat(seat.number)}
                                disabled={!seat.available}
                                className={`flex-1 h-9 rounded-lg border-2 text-[9px] font-black transition-all ${getSeatBg(seat)}`}
                                title={`${seat.number} - ${seat.type} - ${seat.available ? 'Available' : 'Booked'}`}
                              >
                                {seat.number.split('-')[1]}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Berth Layout (3-tier or 2-tier) */
                  <div className="space-y-1.5">
                    {Array.from({ length: Math.ceil(seats.length / (selectedClass.code === '1A' ? 4 : selectedClass.code === '2A' ? 4 : 8)) }, (_, bayIdx) => {
                      const baySize = selectedClass.code === '1A' ? 4 : selectedClass.code === '2A' ? 4 : 8;
                      const baySeats = seats.slice(bayIdx * baySize, (bayIdx + 1) * baySize);
                      return (
                        <div key={bayIdx} className="bg-white rounded-xl border border-slate-100 p-2.5">
                          <div className="text-[9px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1">
                            <span>Bay {bayIdx + 1}</span>
                          </div>
                          <div className="grid grid-cols-4 gap-1.5">
                            {baySeats.map(seat => (
                              <button
                                key={seat.number}
                                onClick={() => handleSelectSeat(seat.number)}
                                disabled={!seat.available}
                                className={`rounded-lg border-2 p-1.5 text-center transition-all ${getSeatBg(seat)}`}
                                title={`${seat.number} - ${seat.type}`}
                              >
                                <div className="text-[9px] font-black">{seat.number.split('-')[1]}</div>
                                <div className="text-[8px] mt-0.5 opacity-70">{getSeatIcon(seat.type)}</div>
                                <div className="text-[7px] mt-0.5 capitalize opacity-60 leading-tight">{seat.type.replace('-', ' ')}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedSeats.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <p className="text-xs text-emerald-700 font-semibold flex-1">
                    Selected: <span className="font-black">{selectedSeats.join(', ')}</span>
                  </p>
                </div>
              )}

              {selectedSeats.length < numPassengers && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-700 font-semibold">
                    Please select {numPassengers - selectedSeats.length} more seat{numPassengers - selectedSeats.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ====== STEP 3: PASSENGER DETAILS ====== */}
          {step === 'passengers' && (
            <div className="space-y-4">
              {passengers.map((p, idx) => (
                <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center">
                        {idx + 1}
                      </div>
                      <span className="text-sm font-bold text-slate-900">Passenger {idx + 1}</span>
                    </div>
                    {selectedSeats[idx] && (
                      <span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                        Seat {selectedSeats[idx]}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={p.name}
                        onChange={e => updatePassenger(p.id, 'name', e.target.value)}
                        placeholder="As per ID proof"
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Age</label>
                      <input
                        type="number"
                        value={p.age}
                        onChange={e => updatePassenger(p.id, 'age', e.target.value)}
                        placeholder="Age"
                        min="1"
                        max="120"
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Gender</label>
                      <select
                        value={p.gender}
                        onChange={e => updatePassenger(p.id, 'gender', e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition"
                      >
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                        <option value="O">Other</option>
                      </select>
                    </div>
                    {berthOptions.length > 0 && (
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Berth Preference</label>
                        <div className="flex flex-wrap gap-2">
                          {berthOptions.map(opt => (
                            <button
                              key={opt.code}
                              onClick={() => updatePassenger(p.id, 'berth', opt.code)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                p.berth === opt.code
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ====== STEP 4: PAYMENT SUMMARY ====== */}
          {step === 'payment' && selectedClass && (
            <div className="space-y-4">
              {/* Fare Breakdown */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-100 px-4 py-3">
                  <h3 className="text-sm font-extrabold text-slate-800">Fare Breakdown</h3>
                </div>
                <div className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Base Fare ({numPassengers}x ₹{baseFare.toLocaleString()})</span>
                    <span className="font-bold text-slate-900">₹{(baseFare * numPassengers).toLocaleString()}</span>
                  </div>
                  {quota === 'TQ' && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Tatkal Charges</span>
                      <span className="font-bold text-amber-700">₹{Math.round(baseFare * 0.3 * numPassengers).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Reservation Charges</span>
                    <span className="font-bold text-slate-900">₹{60 * numPassengers}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">GST (5%)</span>
                    <span className="font-bold text-slate-900">₹{Math.round(totalFare * 0.05).toLocaleString()}</span>
                  </div>
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="font-extrabold text-slate-900">Total Amount</span>
                    <span className="text-xl font-black text-blue-700">
                      ₹{(totalFare + (quota === 'TQ' ? Math.round(baseFare * 0.3 * numPassengers) : 0) + (60 * numPassengers) + Math.round(totalFare * 0.05)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Journey Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-extrabold uppercase text-blue-700 tracking-wider">Journey Summary</h3>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div><span className="text-slate-500 block">Train</span><span className="font-bold text-slate-900">{train.number}</span></div>
                  <div><span className="text-slate-500 block">Date</span><span className="font-bold text-slate-900">{new Date(journeyDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
                  <div><span className="text-slate-500 block">From</span><span className="font-bold text-slate-900">{train.from} ({train.fromCode})</span></div>
                  <div><span className="text-slate-500 block">To</span><span className="font-bold text-slate-900">{train.to} ({train.toCode})</span></div>
                  <div><span className="text-slate-500 block">Class</span><span className="font-bold text-slate-900">{selectedClass.name}</span></div>
                  <div><span className="text-slate-500 block">Quota</span><span className="font-bold text-slate-900">{quota === 'GN' ? 'General' : quota === 'TQ' ? 'Tatkal' : quota === 'LD' ? 'Ladies' : 'Handicapped'}</span></div>
                  <div><span className="text-slate-500 block">Departure</span><span className="font-bold text-slate-900">{train.departureTime}</span></div>
                  <div><span className="text-slate-500 block">Seats</span><span className="font-bold text-slate-900 font-mono">{selectedSeats.join(', ') || 'System Allotted'}</span></div>
                </div>
              </div>

              {/* Passengers summary */}
              <div className="space-y-2">
                {passengers.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-black text-xs flex items-center justify-center">{i+1}</div>
                    <div className="flex-1">
                      <div className="font-bold text-slate-900 text-sm">{p.name || `Passenger ${i+1}`}</div>
                      <div className="text-xs text-slate-500">Age: {p.age || '-'} • {p.gender === 'M' ? 'Male' : p.gender === 'F' ? 'Female' : 'Other'} • {p.berth}</div>
                    </div>
                    {selectedSeats[i] && <span className="font-mono text-xs text-blue-600 font-black">{selectedSeats[i]}</span>}
                  </div>
                ))}
              </div>

              {/* Payment options (demo) */}
              <div>
                <h3 className="text-xs font-black uppercase text-slate-500 mb-2.5">Payment Method (Demo)</h3>
                <div className="grid grid-cols-3 gap-2">
                  {['UPI', 'Debit Card', 'Net Banking'].map(method => (
                    <div key={method} className="bg-white border-2 border-blue-200 rounded-xl p-3 text-center cursor-pointer hover:border-blue-500 transition">
                      <div className="text-lg mb-1">{method === 'UPI' ? '📱' : method === 'Debit Card' ? '💳' : '🏦'}</div>
                      <div className="text-[10px] font-bold text-slate-700">{method}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-500 font-medium">
                  This is a <strong>demonstration only</strong>. No real payment will be processed and no actual ticket will be issued. For real bookings, visit <strong>irctc.co.in</strong>.
                </p>
              </div>
            </div>
          )}

          {/* ====== CONFIRMATION ====== */}
          {step === 'confirmation' && (
            <div className="space-y-5 text-center py-4">
              <div className="w-20 h-20 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-4xl shadow-lg shadow-emerald-500/20">
                🎉
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900">Booking Confirmed!</h3>
                <p className="text-slate-500 text-sm mt-1">Your simulated ticket has been generated</p>
              </div>

              {/* PNR card */}
              <div className="bg-gradient-to-br from-blue-700 to-indigo-700 text-white rounded-3xl p-6 text-left relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-12 translate-x-12" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <Ticket className="w-5 h-5 text-blue-200" />
                    <span className="text-blue-200 text-xs font-bold uppercase tracking-wider">PNR Number</span>
                  </div>
                  <div className="text-3xl font-black font-mono tracking-widest text-white mb-4">{pnr}</div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-blue-300 block">Train</span>
                      <span className="font-bold">{train.number} — {train.name.split(' ').slice(0, 3).join(' ')}</span>
                    </div>
                    <div>
                      <span className="text-blue-300 block">Date</span>
                      <span className="font-bold">{new Date(journeyDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div>
                      <span className="text-blue-300 block">From → To</span>
                      <span className="font-bold">{train.fromCode} → {train.toCode}</span>
                    </div>
                    <div>
                      <span className="text-blue-300 block">Class & Seats</span>
                      <span className="font-bold">{selectedClass?.code} — {selectedSeats.join(', ') || 'System Allotted'}</span>
                    </div>
                    <div>
                      <span className="text-blue-300 block">Passengers</span>
                      <span className="font-bold">{numPassengers} Passenger{numPassengers > 1 ? 's' : ''}</span>
                    </div>
                    <div>
                      <span className="text-blue-300 block">Status</span>
                      <span className="font-black text-emerald-300">✅ CNF</span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-400 font-medium">
                ⚠️ Demo mode — this is not a real ticket. Book actual tickets at{' '}
                <a href="https://irctc.co.in" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold underline">irctc.co.in</a>
              </p>

              <button
                onClick={onClose}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition shadow-lg shadow-blue-500/25"
              >
                Done — Back to RailVue
              </button>
            </div>
          )}
        </div>

        {/* Footer Nav */}
        {step !== 'confirmation' && (
          <div className="border-t border-slate-100 bg-white px-5 py-4 flex gap-3 shrink-0">
            {step !== 'class' && (
              <button
                onClick={() => {
                  const steps: BookingStep[] = ['class', 'seats', 'passengers', 'payment'];
                  const idx = steps.indexOf(step);
                  setStep(steps[idx - 1]);
                }}
                className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition"
              >
                ← Back
              </button>
            )}
            <button
              disabled={
                (step === 'class' && !selectedClass) ||
                (step === 'seats' && selectedSeats.length < numPassengers) ||
                (step === 'passengers' && passengers.some(p => !p.name || !p.age)) ||
                isProcessing
              }
              onClick={() => {
                if (step === 'payment') {
                  handleConfirm();
                } else {
                  const steps: BookingStep[] = ['class', 'seats', 'passengers', 'payment'];
                  const idx = steps.indexOf(step);
                  setStep(steps[idx + 1]);
                }
              }}
              className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-extrabold text-sm rounded-2xl transition shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Processing...</>
              ) : step === 'payment' ? (
                <><CreditCard className="w-4 h-4" /> Confirm & Pay Demo</>
              ) : (
                <>Continue <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

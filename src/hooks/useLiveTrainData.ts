import { useState, useEffect, useCallback, useMemo } from 'react';
import { Train, SimulationState, DelayFactor, StationStop } from '../types';
import { INITIAL_TRAINS } from '../data/mockData';
import { mockTrainService } from '../services/mockTrainService';

// Helper to add minutes to HH:MM format string
function addMinutesToTime(timeStr: string, minutes: number): string {
  if (!timeStr || !timeStr.includes(':')) return timeStr;
  const [hStr, mStr] = timeStr.split(':');
  const totalMins = (parseInt(hStr, 10) * 60 + parseInt(mStr, 10) + minutes) % (24 * 60);
  const positiveMins = (totalMins + 24 * 60) % (24 * 60);
  const newH = Math.floor(positiveMins / 60);
  const newM = positiveMins % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

// Client-side dynamic simulation updater
function computeDynamicTrainState(train: Train, sim: SimulationState): Train {
  const rainDelta = sim.rain ? 8 : 0;
  const congDelta = sim.congestion ? 12 : 0;
  const sigDelta = sim.signal ? 15 : 0;
  const recDelta = sim.recovery ? -10 : 0;
  const netDelta = rainDelta + congDelta + sigDelta + recDelta;

  const isCompleted = train.status === 'completed' ||
    train.currentLocation === train.destination ||
    (train.distanceCovered > 0 && train.totalDistance > 0 && train.distanceCovered >= train.totalDistance);

  const isNotStarted = train.status === 'not_started' ||
    (train.distanceCovered === 0 && train.currentLocation === train.origin && train.currentSpeed === 0);

  if (isCompleted) {
    const updatedTimeline: StationStop[] = (train.timeline || []).map(stop => ({
      ...stop,
      status: 'completed'
    }));

    return {
      ...train,
      status: 'completed',
      currentSpeed: 0,
      aiPredictedEta: 'Arrived',
      delayMinutes: 0,
      timeline: updatedTimeline,
      delayFactors: [
        {
          id: 'f-arrived',
          name: 'Journey Completed & Terminated',
          category: 'recovery',
          impactMinutes: 0,
          type: 'gain',
          icon: '🏁',
          description: `Train arrived at final destination platform (${train.destination})`
        }
      ],
      lastUpdated: 'Arrived at Destination'
    } as any;
  }

  if (isNotStarted) {
    return {
      ...train,
      status: 'not_started',
      currentSpeed: 0,
      aiPredictedEta: train.scheduledEta,
      delayMinutes: 0,
      lastUpdated: 'Scheduled Departure'
    } as any;
  }

  const baseDelay = (train as any)._baseDelay ?? train.delayMinutes;
  const baseSpeed = (train as any)._baseSpeed ?? train.currentSpeed;
  const newDelay = Math.max(0, baseDelay + netDelta);

  const speedDelta = (sim.rain ? -12 : 0) + (sim.congestion ? -20 : 0) + (sim.signal ? -35 : 0) + (sim.recovery ? 16 : 0);
  const newSpeed = Math.max(25, Math.min(train.maxSpeed, baseSpeed + speedDelta));

  const newStatus: TrainStatus = newDelay === 0 ? 'on_time' : newDelay > 25 ? 'critical' : 'delayed';
  const newAiEta = addMinutesToTime(train.scheduledEta, newDelay);

  // Dynamic SHAP / factor breakdown
  const factors: DelayFactor[] = [];
  if (sim.congestion) {
    factors.push({
      id: 'f-cong',
      name: 'Downstream Track Congestion',
      category: 'congestion',
      impactMinutes: 12,
      type: 'delay',
      icon: '🚦',
      description: 'Sector 4 junction headway saturation'
    });
  }
  if (sim.signal) {
    factors.push({
      id: 'f-sig',
      name: 'Signal Clearance Interlock',
      category: 'signal',
      impactMinutes: 15,
      type: 'delay',
      icon: '🚨',
      description: 'Block clearance waiting for express crossover'
    });
  }
  if (sim.rain) {
    factors.push({
      id: 'f-wea',
      name: 'Torrential Weather & Fog Regulation',
      category: 'weather',
      impactMinutes: 8,
      type: 'delay',
      icon: '🌧',
      description: 'Wet rail caution order & visibility limits'
    });
  }
  if (sim.recovery) {
    factors.push({
      id: 'f-rec',
      name: 'Green Corridor Priority Dispatch',
      category: 'recovery',
      impactMinutes: -10,
      type: 'gain',
      icon: '⚡',
      description: 'Unrestricted signal aspect & driver schedule catch-up'
    });
  }
  if (factors.length === 0) {
    factors.push({
      id: 'f-normal',
      name: 'Standard Operational Baseline',
      category: 'recovery',
      impactMinutes: 0,
      type: 'gain',
      icon: '🟢',
      description: 'Optimal track block clearances'
    });
  }

  // Update upcoming station timeline arrivals
  const updatedTimeline: StationStop[] = (train.timeline || []).map(stop => {
    if (stop.status === 'completed') {
      return stop;
    }
    const stopBaseDelay = (stop as any)._baseDelay ?? stop.delayMinutes;
    const stopNewDelay = Math.max(0, stopBaseDelay + netDelta);
    return {
      ...stop,
      _baseDelay: stopBaseDelay,
      delayMinutes: stopNewDelay,
      predictedArrival: addMinutesToTime(stop.scheduledArrival, stopNewDelay),
      predictedDeparture: addMinutesToTime(stop.scheduledDeparture, stopNewDelay)
    } as any;
  });

  return {
    ...train,
    _baseDelay: baseDelay,
    _baseSpeed: baseSpeed,
    delayMinutes: newDelay,
    currentSpeed: newSpeed,
    status: newStatus,
    aiPredictedEta: newAiEta,
    delayFactors: factors,
    timeline: updatedTimeline,
    confidenceScore: Math.max(82, Math.min(98, 96 - (sim.rain ? 4 : 0) - (sim.congestion ? 5 : 0))),
    lastUpdated: 'Just now'
  } as any;
}

export function useLiveTrainData() {
  const [trains, setTrains] = useState<Train[]>(() => {
    return INITIAL_TRAINS.map(t => ({
      ...t,
      _baseDelay: t.delayMinutes,
      _baseSpeed: t.currentSpeed
    })) as any;
  });
  const [selectedTrainId, setSelectedTrainId] = useState<string>('12301');
  const [simulationState, setSimulationState] = useState<SimulationState>({
    rain: false,
    congestion: false,
    signal: false,
    recovery: false,
    simulationSpeed: 1,
    lastTickTimestamp: new Date().toLocaleTimeString()
  });
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  const selectedTrain = useMemo(() => {
    return trains.find(t => t.id === selectedTrainId) || trains[0];
  }, [trains, selectedTrainId]);

  // Recalculate trains dynamically whenever simulationState changes
  useEffect(() => {
    setTrains(prevTrains => {
      return prevTrains.map(t => computeDynamicTrainState(t, simulationState));
    });
  }, [simulationState.rain, simulationState.congestion, simulationState.signal, simulationState.recovery]);

  // Handle Event Toggles with backend FastAPI synchronization + local state reactivity
  const toggleEvent = useCallback((eventKey: 'rain' | 'congestion' | 'signal' | 'recovery') => {
    setSimulationState(prev => {
      const nextValue = !prev[eventKey];
      let msg = '';
      if (eventKey === 'rain') {
        msg = nextValue ? '🌧 Torrential Rain Simulation Enabled (+8m ETA impact)' : 'Rain condition cleared';
      } else if (eventKey === 'congestion') {
        msg = nextValue ? '🚦 Junction Congestion Injected (+12m ETA impact)' : 'Congestion cleared';
      } else if (eventKey === 'signal') {
        msg = nextValue ? '🚨 Signal Clearance Interlock Triggered (+15m ETA impact)' : 'Signal cleared';
      } else if (eventKey === 'recovery') {
        msg = nextValue ? '⚡ Green Corridor Priority Activated (-10m ETA recovery)' : 'Priority override disabled';
      }
      setToastNotification(msg);

      // Async trigger to backend FastAPI if available
      mockTrainService.triggerSimulationEvent(selectedTrainId, eventKey, nextValue);

      return {
        ...prev,
        [eventKey]: nextValue,
        lastTickTimestamp: new Date().toLocaleTimeString()
      };
    });
  }, [selectedTrainId]);

  const resetSimulation = useCallback(() => {
    const freshState: SimulationState = {
      rain: false,
      congestion: false,
      signal: false,
      recovery: false,
      simulationSpeed: 1,
      lastTickTimestamp: new Date().toLocaleTimeString()
    };
    setSimulationState(freshState);
    mockTrainService.triggerSimulationEvent(selectedTrainId, 'reset', true);
    setTrains(INITIAL_TRAINS.map(t => computeDynamicTrainState(t, freshState)));
    setToastNotification('Live telemetry reset to standard XGBoost AI baseline model.');
  }, [selectedTrainId]);

  useEffect(() => {
    if (toastNotification) {
      const timer = setTimeout(() => setToastNotification(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastNotification]);

  // Periodic heartbeat ticker (updates time and checks for live API telemetry)
  useEffect(() => {
    const fetchLatestEta = async () => {
      try {
        const etaRes = await mockTrainService.getTrainETA(selectedTrainId);
        if (etaRes && etaRes.aiPredictedEta) {
          setTrains(prevTrains => {
            return prevTrains.map(t => {
              if (t.id === selectedTrainId) {
                return {
                  ...t,
                  aiPredictedEta: etaRes.aiPredictedEta,
                  delayMinutes: etaRes.delayMinutes,
                  confidenceScore: etaRes.confidenceScore,
                  lastUpdated: 'Just now'
                };
              }
              return t;
            });
          });
        }
      } catch (e) {
        // Handled gracefully
      }
    };

    fetchLatestEta();
    const interval = setInterval(() => {
      fetchLatestEta();
      setSimulationState(prev => ({
        ...prev,
        lastTickTimestamp: new Date().toLocaleTimeString()
      }));
    }, 4000);

    return () => clearInterval(interval);
  }, [selectedTrainId]);

  return {
    trains,
    selectedTrain,
    selectedTrainId,
    setSelectedTrainId,
    simulationState,
    toggleEvent,
    resetSimulation,
    toastNotification
  };
}

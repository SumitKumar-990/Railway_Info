import {
  Train,
  NetworkHotspot,
  OperationalAlert,
  StationItem,
  BetweenTrainResult,
  PassengerDelayExplanation,
  CorridorDetail,
  NetworkCongestionResponse,
  AffectedTrain,
  ModelPredictions
} from '../types';
import { INITIAL_TRAINS, NETWORK_HOTSPOTS, OPERATIONAL_ALERTS } from '../data/mockData';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api';

export class MockTrainService {
  private trains: Train[] = [...INITIAL_TRAINS];
  private hotspots: NetworkHotspot[] = [...NETWORK_HOTSPOTS];
  private alerts: OperationalAlert[] = [...OPERATIONAL_ALERTS];

  // Helper rounding
  private round(val: number): number {
    return Math.round(val * 10) / 10;
  }

  // =========================================================================
  // 1. ALL ACTIVE FLEET TRAINS
  // =========================================================================
  async getTrains(): Promise<Train[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/trains`);
      if (res.ok) {
        const data = await res.json();
        const activeList = data.trains || [];
        
        if (activeList.length > 0) {
          // Perform batch ETA predictions across the entire fleet
          let batchPredictionsMap: Record<string, any> = {};
          try {
            const batchRes = await fetch(`${API_BASE_URL}/trains/batch-eta`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({})
            });
            if (batchRes.ok) {
              const batchData = await batchRes.json();
              for (const item of (batchData.predictions || [])) {
                batchPredictionsMap[item.train_id] = item;
              }
            }
          } catch (err) {
            console.error('[RailRadar API] batch-eta fetch failed:', err);
          }

          // Map backend dynamic registry objects to frontend Train model
          const mappedTrains: Train[] = activeList.map((t: any) => {
            const pred = batchPredictionsMap[t.train_id] || {};
            const existing = this.trains.find(existingT => existingT.id === t.train_id);
            const modelPreds: ModelPredictions = pred.model_predictions || {
              schedule_baseline_minutes: this.round(t.current_delay_minutes * 0.7 + 120),
              random_forest_minutes: this.round(t.current_delay_minutes * 0.85 + 112),
              xgboost_minutes: this.round(t.current_delay_minutes * 0.75 + 105)
            };

            return {
              id: t.train_id,
              number: t.train_number || t.train_id,
              name: t.train_name,
              type: t.type || 'Express',
              zone: t.zone || 'NR',
              origin: t.origin,
              originCode: t.origin_code || 'ORG',
              destination: t.destination,
              destinationCode: t.destination_code || 'DEST',
              currentLocation: t.current_station,
              currentLocationCode: t.current_station ? t.current_station.substring(0, 4).toUpperCase() : 'CURR',
              nextStation: t.next_station,
              currentSpeed: Math.round(t.speed || 85),
              maxSpeed: 130,
              distanceCovered: Math.round(t.distance_covered_km || 0),
              totalDistance: Math.round(t.total_distance_km || 0),
              scheduledEta: existing ? existing.scheduledEta : '18:30',
              traditionalEta: existing ? existing.traditionalEta : '18:30',
              aiPredictedEta: pred.predicted_eta_formatted || (existing ? existing.aiPredictedEta : '18:48'),
              remainingTravelTimeMinutes: Math.round(pred.remaining_travel_time_minutes || 105),
              delayMinutes: Math.round(t.current_delay_minutes || 0),
              status: t.status || (t.current_delay_minutes <= 5 ? 'on_time' : t.current_delay_minutes > 40 ? 'critical' : 'delayed'),
              confidenceScore: Math.round((pred.data_reliability_score || 0.94) * 100),
              dataReliabilityScore: pred.data_reliability_score || 0.94,
              dataQuality: pred.data_quality || { score: 0.94, estimated_telemetry: t.is_estimated, weather_available: true },
              dataSourceTransparency: pred.data_source_transparency || {
                is_live_gps: !t.is_estimated,
                is_estimated: t.is_estimated,
                is_simulated: t.is_simulated || false,
                model_type: "XGBoost Regressor (eta_xgboost.json) + Random Forest (eta_random_forest.pkl)"
              },
              modelPredictions: modelPreds,
              weatherScore: t.weather_score,
              rainfallMm: t.rainfall_mm,
              congestionScore: t.congestion_score,
              speedRestrictionScore: t.speed_restriction_score,
              signalDelayScore: t.signal_delay_score,
              lat: t.latitude || 26.4499,
              lng: t.longitude || 80.3319,
              timeline: existing ? existing.timeline : [
                { id: 's1', stationName: t.origin, stationCode: t.origin_code || 'ORG', scheduledArrival: '16:00', scheduledDeparture: '16:00', predictedArrival: '16:00', predictedDeparture: '16:00', delayMinutes: 0, distanceFromOrigin: 0, status: 'completed' },
                { id: 's2', stationName: t.current_station, stationCode: 'CURR', scheduledArrival: '19:00', scheduledDeparture: '19:05', predictedArrival: '19:10', predictedDeparture: '19:15', delayMinutes: t.current_delay_minutes, distanceFromOrigin: t.distance_covered_km, status: 'current' },
                { id: 's3', stationName: t.destination, stationCode: t.destination_code || 'DEST', scheduledArrival: '23:30', scheduledDeparture: '23:30', predictedArrival: pred.predicted_eta_formatted || '23:45', predictedDeparture: '23:45', delayMinutes: t.current_delay_minutes, distanceFromOrigin: t.total_distance_km, status: 'upcoming' }
              ],
              delayFactors: pred.prediction_factors ? pred.prediction_factors.map((f: any, idx: number) => ({
                id: `df-${idx}`,
                name: f.factor,
                category: f.category,
                impactMinutes: f.impact_minutes,
                type: f.impact_minutes > 0 ? 'delay' : 'gain',
                icon: f.impact_minutes > 0 ? (f.impact_minutes > 10 ? '🔴' : '🟠') : '🟢',
                source: f.source || 'LIVE / HISTORICAL TELEMETRY',
                description: f.category === 'congestion'
                  ? 'Track occupancy density on forward route segment'
                  : (f.category === 'weather' ? 'Atmospheric condition coefficient on braking curve' : 'Standard scheduled baseline')
              })) : (existing ? existing.delayFactors : []),
              lastUpdated: new Date().toLocaleTimeString()
            };
          });

          this.trains = mappedTrains;
          return mappedTrains;
        }
      }
    } catch (e) {
      console.error('[RailRadar API] fetch failed:', e);
    }
    return this.trains;
  }

  // =========================================================================
  // 2. PASSENGER TRAIN SEARCH
  // =========================================================================
  async searchTrains(query: string, limit: number = 15): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/trains/search?q=${encodeURIComponent(query)}&limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        return data.trains || [];
      }
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    } catch (e) {
      console.error('[RailRadar API] fetch failed:', e);
    }
    const q = query.toLowerCase().trim();
    return this.trains.filter(t => t.number.includes(q) || t.name.toLowerCase().includes(q)).slice(0, limit);
  }

  // =========================================================================
  // 3. PASSENGER STATION SEARCH
  // =========================================================================
  async searchStations(query: string): Promise<StationItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/stations/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        return data.stations || [];
      }
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    } catch (e) {
      console.error('[RailRadar API] fetch failed:', e);
    }
    const q = query.toLowerCase().trim();
    const defaults: StationItem[] = [
      { code: 'HWH', name: 'Howrah Junction', city: 'Kolkata' },
      { code: 'RNC', name: 'Ranchi Junction', city: 'Ranchi' },
      { code: 'NDLS', name: 'New Delhi', city: 'New Delhi' },
      { code: 'CNB', name: 'Kanpur Central', city: 'Kanpur' },
      { code: 'PRYJ', name: 'Prayagraj Junction', city: 'Prayagraj' },
      { code: 'MMCT', name: 'Mumbai Central', city: 'Mumbai' },
      { code: 'CSMT', name: 'Chhatrapati Shivaji Maharaj Terminus', city: 'Mumbai' },
      { code: 'MAO', name: 'Madgaon Junction (Goa)', city: 'Goa' },
      { code: 'BSB', name: 'Varanasi Junction', city: 'Varanasi' },
      { code: 'RKMP', name: 'Rani Kamlapati', city: 'Bhopal' },
      { code: 'AGC', name: 'Agra Cantt', city: 'Agra' },
      { code: 'DDU', name: 'Pt. Deen Dayal Upadhyaya', city: 'Mughalsarai' },
      { code: 'GAYA', name: 'Gaya Junction', city: 'Gaya' },
      { code: 'SDAH', name: 'Sealdah', city: 'Kolkata' },
      { code: 'DGR', name: 'Durgapur', city: 'Durgapur' },
      { code: 'DHN', name: 'Dhanbad Junction', city: 'Dhanbad' },
      { code: 'ST', name: 'Surat', city: 'Surat' },
      { code: 'BRC', name: 'Vadodara Junction', city: 'Vadodara' },
      { code: 'KOTA', name: 'Kota Junction', city: 'Kota' }
    ];
    return defaults.filter(s => s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || (s.city && s.city.toLowerCase().includes(q)));
  }

  // =========================================================================
  // 4. FIND TRAINS BETWEEN STATIONS
  // =========================================================================
  async getTrainsBetween(fromStation: string, toStation: string): Promise<BetweenTrainResult[]> {
    const normalize = (s: string) => {
      if (!s) return '';
      const m = s.match(/\(([A-Za-z0-9]+)\)/);
      if (m) return m[1].toUpperCase();
      const clean = s.replace(/(junction|jn\.?|central|centr\.?|cantt\.?|terminus|terminal|term\.?|city)/gi, '').trim().toUpperCase();
      const ALIASES: Record<string, string> = {
        'MMCT': 'MMCT', 'BCT': 'MMCT', 'MUMBAI CENTRAL': 'MMCT', 'MUMBAI': 'CSMT',
        'CSTM': 'CSMT', 'CSMT': 'CSMT',
        'PRYJ': 'PRYJ', 'ALD': 'PRYJ', 'ALLAHABAD': 'PRYJ',
        'DDU': 'DDU', 'MGS': 'DDU', 'MUGHALSARAI': 'DDU',
        'RKMP': 'RKMP', 'HBJ': 'RKMP',
        'DELHI': 'NDLS', 'NEW DELHI': 'NDLS',
        'HOWRAH': 'HWH', 'RANCHI': 'RNC', 'KANPUR': 'CNB',
        'VARANASI': 'BSB', 'BANARAS': 'BSB', 'GOA': 'MAO', 'MADGAON': 'MAO'
      };
      return ALIASES[clean] || ALIASES[s.toUpperCase()] || clean;
    };

    const fromKey = normalize(fromStation);
    const toKey = normalize(toStation);

    // 1. Try Backend API first
    try {
      const res = await fetch(`${API_BASE_URL}/trains/between?from=${encodeURIComponent(fromStation)}&to=${encodeURIComponent(toStation)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.trains && data.trains.length > 0) {
          return data.trains;
        }
      }
    } catch (e) {
      console.warn('[RailRadar API] fetch failed, using client database:', e);
    }

    // 2. Check active fleet trains in this.trains
    const fleetMatches: BetweenTrainResult[] = [];
    for (const t of this.trains) {
      const stops = t.timeline || [];
      const fromIdx = stops.findIndex(st => normalize(st.stationCode) === fromKey || normalize(st.stationName).includes(fromKey));
      const toIdx = stops.findIndex(st => normalize(st.stationCode) === toKey || normalize(st.stationName).includes(toKey));

      if (fromIdx !== -1 && toIdx !== -1 && fromIdx < toIdx) {
        const stFrom = stops[fromIdx];
        const stTo = stops[toIdx];
        const dist = (stTo.distanceFromOrigin || t.totalDistance) - (stFrom.distanceFromOrigin || 0);
        fleetMatches.push({
          train_number: t.number,
          train_name: t.name,
          type: t.type,
          zone: t.zone,
          source_station_code: stFrom.stationCode,
          source_station_name: stFrom.stationName,
          destination_station_code: stTo.stationCode,
          destination_station_name: stTo.stationName,
          departure_time: stFrom.scheduledDeparture || stFrom.scheduledArrival || '08:00',
          arrival_time: stTo.scheduledArrival || '16:00',
          duration: `${Math.max(1, Math.round(dist / 65))}h 30m`,
          total_distance_km: dist > 0 ? dist : t.totalDistance,
          runs_on: ['Daily']
        });
      }
    }

    if (fleetMatches.length > 0) {
      return fleetMatches;
    }

    // 3. Check Curated Route Database
    const ROUTE_DATABASE: Record<string, BetweenTrainResult[]> = {
      'HWH-RNC': [
        {
          train_number: '12019',
          train_name: 'Howrah - Ranchi Shatabdi Express',
          type: 'Shatabdi',
          zone: 'ER',
          source_station_code: 'HWH',
          source_station_name: 'Howrah Jn.',
          destination_station_code: 'RNC',
          destination_station_name: 'Ranchi',
          departure_time: '06:05',
          arrival_time: '13:15',
          duration: '7h 10m',
          total_distance_km: 436,
          runs_on: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        },
        {
          train_number: '18615',
          train_name: 'Howrah - Hatia Kriya Yoga Express',
          type: 'Express',
          zone: 'SER',
          source_station_code: 'HWH',
          source_station_name: 'Howrah Jn.',
          destination_station_code: 'RNC',
          destination_station_name: 'Ranchi',
          departure_time: '21:30',
          arrival_time: '06:20',
          duration: '8h 50m',
          total_distance_km: 436,
          runs_on: ['Daily']
        },
        {
          train_number: '20898',
          train_name: 'Ranchi - Howrah Vande Bharat Express',
          type: 'Vande Bharat',
          zone: 'SER',
          source_station_code: 'HWH',
          source_station_name: 'Howrah Jn.',
          destination_station_code: 'RNC',
          destination_station_name: 'Ranchi',
          departure_time: '15:45',
          arrival_time: '22:50',
          duration: '7h 05m',
          total_distance_km: 436,
          runs_on: ['Daily except Tue']
        }
      ],
      'RNC-HWH': [
        {
          train_number: '12020',
          train_name: 'Ranchi - Howrah Shatabdi Express',
          type: 'Shatabdi',
          zone: 'ER',
          source_station_code: 'RNC',
          source_station_name: 'Ranchi',
          destination_station_code: 'HWH',
          destination_station_name: 'Howrah Jn.',
          departure_time: '13:45',
          arrival_time: '21:30',
          duration: '7h 45m',
          total_distance_km: 436,
          runs_on: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        },
        {
          train_number: '20897',
          train_name: 'Ranchi - Howrah Vande Bharat Express',
          type: 'Vande Bharat',
          zone: 'SER',
          source_station_code: 'RNC',
          source_station_name: 'Ranchi',
          destination_station_code: 'HWH',
          destination_station_name: 'Howrah Jn.',
          departure_time: '05:15',
          arrival_time: '12:20',
          duration: '7h 05m',
          total_distance_km: 436,
          runs_on: ['Daily except Tue']
        }
      ],
      'NDLS-CNB': [
        {
          train_number: '12004',
          train_name: 'Lucknow Shatabdi Express',
          type: 'Shatabdi',
          zone: 'NR',
          source_station_code: 'NDLS',
          source_station_name: 'New Delhi',
          destination_station_code: 'CNB',
          destination_station_name: 'Kanpur Central',
          departure_time: '06:10',
          arrival_time: '11:20',
          duration: '5h 10m',
          total_distance_km: 440,
          runs_on: ['Daily']
        },
        {
          train_number: '22436',
          train_name: 'Vande Bharat Express',
          type: 'Vande Bharat',
          zone: 'NR',
          source_station_code: 'NDLS',
          source_station_name: 'New Delhi',
          destination_station_code: 'CNB',
          destination_station_name: 'Kanpur Central',
          departure_time: '06:00',
          arrival_time: '10:08',
          duration: '4h 08m',
          total_distance_km: 440,
          runs_on: ['Daily except Mon, Thu']
        },
        {
          train_number: '12302',
          train_name: 'Howrah Rajdhani Express',
          type: 'Rajdhani',
          zone: 'ER',
          source_station_code: 'NDLS',
          source_station_name: 'New Delhi',
          destination_station_code: 'CNB',
          destination_station_name: 'Kanpur Central',
          departure_time: '16:55',
          arrival_time: '21:30',
          duration: '4h 35m',
          total_distance_km: 440,
          runs_on: ['Daily']
        },
        {
          train_number: '12418',
          train_name: 'Prayagraj Express',
          type: 'Superfast',
          zone: 'NCR',
          source_station_code: 'NDLS',
          source_station_name: 'New Delhi',
          destination_station_code: 'CNB',
          destination_station_name: 'Kanpur Central',
          departure_time: '22:10',
          arrival_time: '03:50',
          duration: '5h 40m',
          total_distance_km: 440,
          runs_on: ['Daily']
        }
      ],
      'CNB-NDLS': [
        {
          train_number: '12003',
          train_name: 'New Delhi Shatabdi Express',
          type: 'Shatabdi',
          zone: 'NR',
          source_station_code: 'CNB',
          source_station_name: 'Kanpur Central',
          destination_station_code: 'NDLS',
          destination_station_name: 'New Delhi',
          departure_time: '16:50',
          arrival_time: '22:25',
          duration: '5h 35m',
          total_distance_km: 440,
          runs_on: ['Daily']
        },
        {
          train_number: '12301',
          train_name: 'Howrah - New Delhi Rajdhani',
          type: 'Rajdhani',
          zone: 'ER',
          source_station_code: 'CNB',
          source_station_name: 'Kanpur Central',
          destination_station_code: 'NDLS',
          destination_station_name: 'New Delhi',
          departure_time: '04:50',
          arrival_time: '10:05',
          duration: '5h 15m',
          total_distance_km: 440,
          runs_on: ['Daily']
        }
      ],
      'MMCT-NDLS': [
        {
          train_number: '12951',
          train_name: 'Mumbai Rajdhani Express',
          type: 'Rajdhani',
          zone: 'WR',
          source_station_code: 'MMCT',
          source_station_name: 'Mumbai Central',
          destination_station_code: 'NDLS',
          destination_station_name: 'New Delhi',
          departure_time: '17:00',
          arrival_time: '08:32',
          duration: '15h 32m',
          total_distance_km: 1386,
          runs_on: ['Daily']
        },
        {
          train_number: '12953',
          train_name: 'August Kranti Tejas Rajdhani',
          type: 'Rajdhani',
          zone: 'WR',
          source_station_code: 'MMCT',
          source_station_name: 'Mumbai Central',
          destination_station_code: 'NDLS',
          destination_station_name: 'New Delhi',
          departure_time: '17:10',
          arrival_time: '09:43',
          duration: '16h 33m',
          total_distance_km: 1378,
          runs_on: ['Daily']
        }
      ],
      'NDLS-BSB': [
        {
          train_number: '22436',
          train_name: 'Vande Bharat Express',
          type: 'Vande Bharat',
          zone: 'NR',
          source_station_code: 'NDLS',
          source_station_name: 'New Delhi',
          destination_station_code: 'BSB',
          destination_station_name: 'Varanasi Junction',
          departure_time: '06:00',
          arrival_time: '14:00',
          duration: '8h 00m',
          total_distance_km: 759,
          runs_on: ['Daily except Mon, Thu']
        },
        {
          train_number: '12560',
          train_name: 'Shiv Ganga Express',
          type: 'Superfast',
          zone: 'NER',
          source_station_code: 'NDLS',
          source_station_name: 'New Delhi',
          destination_station_code: 'BSB',
          destination_station_name: 'Varanasi Junction',
          departure_time: '20:05',
          arrival_time: '06:10',
          duration: '10h 05m',
          total_distance_km: 757,
          runs_on: ['Daily']
        }
      ],
      'CSMT-MAO': [
        {
          train_number: '10103',
          train_name: 'Mandovi Express',
          type: 'Express',
          zone: 'KR',
          source_station_code: 'CSMT',
          source_station_name: 'Mumbai CSMT',
          destination_station_code: 'MAO',
          destination_station_name: 'Madgaon Junction',
          departure_time: '07:10',
          arrival_time: '19:10',
          duration: '12h 00m',
          total_distance_km: 580,
          runs_on: ['Daily']
        },
        {
          train_number: '22229',
          train_name: 'Mumbai Goa Vande Bharat',
          type: 'Vande Bharat',
          zone: 'CR',
          source_station_code: 'CSMT',
          source_station_name: 'Mumbai CSMT',
          destination_station_code: 'MAO',
          destination_station_name: 'Madgaon Junction',
          departure_time: '05:25',
          arrival_time: '13:10',
          duration: '7h 45m',
          total_distance_km: 580,
          runs_on: ['Daily except Fri']
        }
      ],
      'HWH-NDLS': [
        {
          train_number: '12301',
          train_name: 'Howrah Rajdhani Express',
          type: 'Rajdhani',
          zone: 'ER',
          source_station_code: 'HWH',
          source_station_name: 'Howrah Jn.',
          destination_station_code: 'NDLS',
          destination_station_name: 'New Delhi',
          departure_time: '16:55',
          arrival_time: '10:05',
          duration: '17h 10m',
          total_distance_km: 1447,
          runs_on: ['Daily']
        },
        {
          train_number: '12305',
          train_name: 'Poorva Express',
          type: 'Superfast',
          zone: 'ER',
          source_station_code: 'HWH',
          source_station_name: 'Howrah Jn.',
          destination_station_code: 'NDLS',
          destination_station_name: 'New Delhi',
          departure_time: '08:00',
          arrival_time: '06:05',
          duration: '22h 05m',
          total_distance_km: 1530,
          runs_on: ['Sun', 'Wed', 'Thu']
        }
      ]
    };

    const routeKey = `${fromKey}-${toKey}`;
    if (ROUTE_DATABASE[routeKey]) {
      return ROUTE_DATABASE[routeKey];
    }

    // Also check reverse if applicable
    const revKey = `${toKey}-${fromKey}`;
    if (ROUTE_DATABASE[revKey]) {
      return ROUTE_DATABASE[revKey].map(t => ({
        ...t,
        train_number: String(Number(t.train_number) + 1),
        train_name: `${t.destination_station_name} - ${t.source_station_name} Express`,
        source_station_code: t.destination_station_code,
        source_station_name: t.destination_station_name,
        destination_station_code: t.source_station_code,
        destination_station_name: t.source_station_name,
      }));
    }

    // 4. Fallback: Synthesize connected express trains between selected stations
    return [
      {
        train_number: '12401',
        train_name: `${fromKey} - ${toKey} Superfast Express`,
        type: 'Superfast Express',
        zone: 'IR',
        source_station_code: fromKey || 'SRC',
        source_station_name: fromStation || 'Origin Station',
        destination_station_code: toKey || 'DST',
        destination_station_name: toStation || 'Destination Station',
        departure_time: '06:30',
        arrival_time: '14:45',
        duration: '8h 15m',
        total_distance_km: 480,
        runs_on: ['Daily']
      },
      {
        train_number: '20815',
        train_name: `${fromKey} - ${toKey} Vande Bharat Express`,
        type: 'Vande Bharat',
        zone: 'IR',
        source_station_code: fromKey || 'SRC',
        source_station_name: fromStation || 'Origin Station',
        destination_station_code: toKey || 'DST',
        destination_station_name: toStation || 'Destination Station',
        departure_time: '14:20',
        arrival_time: '21:05',
        duration: '6h 45m',
        total_distance_km: 480,
        runs_on: ['Daily except Wed']
      }
    ];
  }

  // =========================================================================
  // 5. GET FULL TRAIN DETAILS FOR ANY TRAIN IN THE DIRECTORY
  // =========================================================================
  async getTrainDetails(trainNumber: string): Promise<Train | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/trains/${trainNumber}`);
      if (res.ok) {
        const data = await res.json();
        const existing = this.trains.find(t => t.number === trainNumber || t.id === trainNumber);
        if (existing) {
          return existing;
        }

        const totalDist = data.total_distance_km || 0;
        const newTrain: Train = {
          id: data.train_number || trainNumber,
          number: data.train_number || trainNumber,
          name: data.train_name || `Train ${trainNumber}`,
          type: data.train_type || (data.train_name?.includes('Shatabdi') ? 'Shatabdi' : data.train_name?.includes('Rajdhani') ? 'Rajdhani' : data.train_name?.includes('Vande') ? 'Vande Bharat' : 'Superfast Express'),
          zone: data.zone || 'NR',
          origin: data.source_station_name || 'Origin',
          originCode: data.source_station_code || 'ORG',
          destination: data.destination_station_name || 'Destination',
          destinationCode: data.destination_station_code || 'DEST',
          currentLocation: `At ${data.destination_station_name || 'Destination'}`,
          currentLocationCode: data.destination_station_code || 'DEST',
          nextStation: `${data.destination_station_name || 'Destination'} [Terminus]`,
          nextStationCode: data.destination_station_code || 'DEST',
          scheduledEta: data.arrival_time || '--:--',
          traditionalEta: data.arrival_time || '--:--',
          aiPredictedEta: data.arrival_time ? `${data.arrival_time} (Arrived)` : '--:--',
          delayMinutes: 0,
          status: 'on_time',
          currentSpeed: 0,
          maxSpeed: 130,
          totalDistance: totalDist,
          distanceCovered: totalDist,
          confidenceScore: 98,
          dataReliabilityScore: 0.98,
          congestionScore: 0.1,
          weatherScore: 0.1,
          rainfallMm: 0,
          speedRestrictionScore: 0,
          signalDelayScore: 0,
          lat: 23.3441,
          lng: 85.3096,
          timeline: data.stations && data.stations.length > 0 ? data.stations.map((s: any, idx: number) => ({
            id: `st-${s.station_code || s.stationCode}-${idx}`,
            sequence: s.sequence || idx + 1,
            stationName: s.station_name || s.stationName,
            stationCode: s.station_code || s.stationCode,
            scheduledArrival: s.scheduled_arrival || s.scheduledArrival || '--',
            scheduledDeparture: s.scheduled_departure || s.scheduledDeparture || '--',
            actualArrival: s.scheduled_arrival || s.scheduledArrival || '--',
            actualDeparture: s.scheduled_departure || s.scheduledDeparture || '--',
            predictedArrival: s.scheduled_arrival || s.scheduledArrival || '--',
            predictedDeparture: s.scheduled_departure || s.scheduledDeparture || '--',
            delayMinutes: 0,
            distanceFromOrigin: s.distance_km ?? s.distanceKm ?? idx * 40,
            status: idx === (data.stations.length - 1) ? 'completed' : 'completed',
            platform: s.platform || `PF ${(idx % 3) + 1}`,
            isHalt: s.isHalt !== false
          })) : [],
          delayFactors: [
            { id: 'df-1', name: 'Schedule Adherence', category: 'normal', impactMinutes: 0, type: 'gain', icon: '🟢', source: 'INDIAN RAILWAYS DIRECTORY', description: 'Train details loaded from directory' }
          ],
          lastUpdated: new Date().toLocaleTimeString()
        };

        // Cache into this.trains
        this.trains.push(newTrain);
        return newTrain;
      }
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    } catch (e) {
      console.error('[RailRadar API] fetch failed:', e);
    }

    const found = this.trains.find(t => t.number === trainNumber || t.id === trainNumber);
    if (found) return found;

    return null;
  }

  // =========================================================================
  // =========================================================================
  // 6. LIVE STATUS FOR SPECIFIC TRAIN
  // =========================================================================
  async getLiveTrainStatus(trainNumber: string, journeyDate?: string): Promise<any> {
    try {
      const url = journeyDate
        ? `${API_BASE_URL}/trains/${trainNumber}/live?date=${encodeURIComponent(journeyDate)}`
        : `${API_BASE_URL}/trains/${trainNumber}/live`;
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    } catch (e) {
      console.error('[RailRadar API] fetch failed:', e);
      return null;
    }
  }

  // =========================================================================
  // 6. TRAIN SCHEDULE TIMELINE
  // =========================================================================
  async getTrainSchedule(trainNumber: string, journeyDate?: string): Promise<any> {
    try {
      const url = journeyDate
        ? `${API_BASE_URL}/trains/${trainNumber}/schedule?date=${encodeURIComponent(journeyDate)}`
        : `${API_BASE_URL}/trains/${trainNumber}/schedule`;
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    } catch (e) {
      console.error('[RailRadar API] fetch failed:', e);
      return null;
    }
  }

  // =========================================================================
  // 7. TRAIN ROUTE GEOMETRY
  // =========================================================================
  async getTrainRoute(trainNumber: string, journeyDate?: string): Promise<any> {
    try {
      const url = journeyDate
        ? `${API_BASE_URL}/trains/${trainNumber}/route?date=${encodeURIComponent(journeyDate)}`
        : `${API_BASE_URL}/trains/${trainNumber}/route`;
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    } catch (e) {
      console.error('[RailRadar API] fetch failed:', e);
      return null;
    }
  }

  // =========================================================================
  // 8. AI ETA PREDICTION
  // =========================================================================
  async getTrainEta(trainNumber: string, journeyDate?: string): Promise<any> {
    try {
      const url = journeyDate
        ? `${API_BASE_URL}/trains/${trainNumber}/eta?date=${encodeURIComponent(journeyDate)}`
        : `${API_BASE_URL}/trains/${trainNumber}/eta`;
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    } catch (e) {
      console.error('[RailRadar API] fetch failed:', e);
      return null;
    }
  }

  // =========================================================================
  // 7. PASSENGER HUMAN-READABLE DELAY EXPLANATION
  // =========================================================================
  async getPassengerEtaExplanation(trainNumber: string, journeyDate?: string): Promise<PassengerDelayExplanation | null> {
    try {
      const url = journeyDate
        ? `${API_BASE_URL}/trains/${trainNumber}/eta/explanation?date=${encodeURIComponent(journeyDate)}`
        : `${API_BASE_URL}/trains/${trainNumber}/eta/explanation`;
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    } catch (e) {
      console.error('[RailRadar API] fetch failed:', e);
      return null;
    }
  }

  // =========================================================================
  // 8. OFFICER NETWORK CONGESTION INTELLIGENCE
  // =========================================================================
  async getNetworkCongestion(): Promise<NetworkCongestionResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/network/congestion`);
      if (res.ok) {
        return await res.json();
      }
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    } catch (e) {
      console.error('[RailRadar API] fetch failed:', e);
    }
    return {
      timestamp: new Date().toISOString(),
      network_health_score: 82,
      overall_status: 'Moderate Congestion',
      critical_corridors_count: 1,
      high_corridors_count: 2,
      corridors: [
        {
          corridor_id: 'corridor-cnb-pryj',
          corridor_name: 'Kanpur Central → Prayagraj Junction',
          from_station_code: 'CNB',
          to_station_code: 'PRYJ',
          zone: 'NCR',
          length_km: 195.0,
          congestion_score: 84.0,
          congestion_level: 'CRITICAL',
          congestion_color: 'red',
          active_trains_count: 28,
          average_delay_minutes: 16.0,
          trend: 'Increasing',
          ai_assessment: 'Severe track occupancy ahead. ETA disruption and signal holds likely.',
          affected_trains: [
            { train_number: '12301', train_name: 'Howrah Rajdhani Express', current_delay_minutes: 18.0, predicted_eta_impact_minutes: 22, risk_level: 'High' },
            { train_number: '12309', train_name: 'Patna Tejas Rajdhani', current_delay_minutes: 32.0, predicted_eta_impact_minutes: 28, risk_level: 'High' },
            { train_number: '22436', train_name: 'Vande Bharat Express', current_delay_minutes: 4.0, predicted_eta_impact_minutes: 8, risk_level: 'Low' }
          ]
        },
        {
          corridor_id: 'corridor-mtj-agc',
          corridor_name: 'Mathura Junction → Agra Cantt',
          from_station_code: 'MTJ',
          to_station_code: 'AGC',
          zone: 'NCR',
          length_km: 54.0,
          congestion_score: 65.0,
          congestion_level: 'HIGH',
          congestion_color: 'orange',
          active_trains_count: 19,
          average_delay_minutes: 12.0,
          trend: 'Stable',
          ai_assessment: 'Heavy rail traffic detected. Sectional speed reduced; moderate delay propagation.',
          affected_trains: [
            { train_number: '12002', train_name: 'Bhopal Shatabdi Express', current_delay_minutes: 2.0, predicted_eta_impact_minutes: 6, risk_level: 'Low' }
          ]
        },
        {
          corridor_id: 'corridor-bwn-dgr',
          corridor_name: 'Barddhaman → Durgapur / Asansol',
          from_station_code: 'BWN',
          to_station_code: 'ASN',
          zone: 'ER',
          length_km: 105.0,
          congestion_score: 55.0,
          congestion_level: 'MODERATE',
          congestion_color: 'yellow',
          active_trains_count: 14,
          average_delay_minutes: 8.0,
          trend: 'Stable',
          ai_assessment: 'Steady traffic flow with minor junction queueing.',
          affected_trains: [
            { train_number: '12019', train_name: 'Howrah - Ranchi Shatabdi Express', current_delay_minutes: 8.0, predicted_eta_impact_minutes: 7, risk_level: 'Medium' }
          ]
        },
        {
          corridor_id: 'corridor-st-brc',
          corridor_name: 'Surat → Vadodara Junction',
          from_station_code: 'ST',
          to_station_code: 'BRC',
          zone: 'WR',
          length_km: 130.0,
          congestion_score: 22.0,
          congestion_level: 'LOW',
          congestion_color: 'emerald',
          active_trains_count: 11,
          average_delay_minutes: 3.0,
          trend: 'Decreasing',
          ai_assessment: 'Optimal throughput. Clear line with minimal delay propagation.',
          affected_trains: []
        }
      ]
    };
  }

  // =========================================================================
  // 9. OFFICER AFFECTED TRAINS LIST
  // =========================================================================
  async getAffectedTrains(): Promise<AffectedTrain[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/network/affected-trains`);
      if (res.ok) {
        const data = await res.json();
        return data.affected_trains || [];
      }
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    } catch (e) {
      console.error('[RailRadar API] fetch failed:', e);
    }
    return [
      { train_number: '12309', train_name: 'Patna Tejas Rajdhani', current_delay_minutes: 32.0, predicted_eta_impact_minutes: 28, risk_level: 'High', congestion_score: 84 },
      { train_number: '12301', train_name: 'Howrah Rajdhani Express', current_delay_minutes: 18.0, predicted_eta_impact_minutes: 22, risk_level: 'High', congestion_score: 84 },
      { train_number: '12259', train_name: 'Sealdah Duronto Express', current_delay_minutes: 15.0, predicted_eta_impact_minutes: 14, risk_level: 'Medium', congestion_score: 55 },
      { train_number: '12019', train_name: 'Howrah Ranchi Shatabdi', current_delay_minutes: 8.0, predicted_eta_impact_minutes: 7, risk_level: 'Medium', congestion_score: 55 }
    ];
  }

  // =========================================================================
  // 10. LARGE-SCALE LIVE TRAIN MAP SNAPSHOT FOR OFFICERS
  // =========================================================================
  async getNetworkLiveSnapshot(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/network/live`);
      if (res.ok) {
        const data = await res.json();
        return data.trains || [];
      }
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    } catch (e) {
      console.error('[RailRadar API] fetch failed:', e);
    }
    return this.trains;
  }

  // =========================================================================
  // 10. SIMULATION TRIGGER
  // =========================================================================
  async triggerSimulationEvent(trainId: string, eventType: string, active: boolean) {
    try {
      const res = await fetch(`${API_BASE_URL}/simulation/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          train_id: trainId,
          event_type: eventType,
          active: active
        })
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
    } catch (e) {
      console.error('[RailRadar API] fetch failed:', e);
    }
  }

  getHotspots(): NetworkHotspot[] {
    return this.hotspots;
  }

  getAlerts(): OperationalAlert[] {
    return this.alerts;
  }
}

export const mockTrainService = new MockTrainService();

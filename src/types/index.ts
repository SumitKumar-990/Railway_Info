export type NavPage =
  | 'overview'
  | 'monitor'
  | 'predictions'
  | 'network'
  | 'analytics'
  | 'details'
  | 'alerts'
  | 'api';

export type TrainStatus = 'on_time' | 'delayed' | 'critical' | 'completed' | 'not_started';


export interface StationStop {
  id: string;
  stationName: string;
  stationCode: string;
  scheduledArrival: string;
  scheduledDeparture: string;
  predictedArrival: string;
  predictedDeparture: string;
  delayMinutes: number;
  distanceFromOrigin: number; // km
  status: 'completed' | 'current' | 'upcoming';
  platform?: string;
}

export interface DelayFactor {
  id: string;
  name: string;
  category: 'congestion' | 'signal' | 'weather' | 'speed_restriction' | 'recovery' | 'maintenance';
  impactMinutes: number; // positive for delay, negative for recovery
  type: 'delay' | 'gain';
  icon: string;
  description: string;
}

export interface Train {
  id: string;
  number: string;
  name: string;
  type: 'Rajdhani' | 'Shatabdi' | 'Vande Bharat' | 'Duronto' | 'Superfast Express';
  zone: 'NR' | 'ER' | 'WR' | 'NCR' | 'ECR' | 'CR' | 'SER' | 'WCR';
  origin: string;
  originCode: string;
  destination: string;
  destinationCode: string;
  currentLocation: string;
  currentLocationCode: string;
  nextStation: string;
  nextStationCode: string;
  currentSpeed: number; // km/h
  maxSpeed: number; // km/h
  distanceCovered: number; // km
  totalDistance: number; // km
  scheduledEta: string; // HH:MM
  traditionalEta: string; // HH:MM
  aiPredictedEta: string; // HH:MM
  delayMinutes: number;
  status: TrainStatus;
  confidenceScore: number; // percentage (e.g. 96)
  lat: number; // For map SVG position (0-100 scale or geographic)
  lng: number;
  timeline: StationStop[];
  delayFactors: DelayFactor[];
  lastUpdated: string;
}

export interface NetworkHotspot {
  id: string;
  sectionName: string;
  corridor: string;
  zone: string;
  congestionLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  avgDelayMinutes: number;
  affectedTrainsCount: number;
  primaryCause: string;
}

export interface OperationalAlert {
  id: string;
  title: string;
  category: 'critical' | 'operational' | 'weather' | 'congestion';
  severity: 'critical' | 'warning' | 'info';
  location: string;
  zone: string;
  affectedRoute: string;
  affectedTrainsCount: number;
  expectedImpact: string;
  timestamp: string;
  description: string;
}

export interface ApiEndpoint {
  id: string;
  name: string;
  method: 'GET' | 'POST';
  path: string;
  description: string;
  queryParams?: { key: string; label: string; default: string; required: boolean }[];
  sampleResponseBody: object;
}

export interface SimulationState {
  rain: boolean;
  congestion: boolean;
  signal: boolean;
  recovery: boolean;
  simulationSpeed: number;
  lastTickTimestamp: string;
}

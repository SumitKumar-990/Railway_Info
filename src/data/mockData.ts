import { Train, NetworkHotspot, OperationalAlert } from '../types';

export const INITIAL_TRAINS: Train[] = [
  {
    id: '12301',
    number: '12301',
    name: 'Howrah Rajdhani Express',
    type: 'Rajdhani',
    zone: 'ER',
    origin: 'Howrah Junction',
    originCode: 'HWH',
    destination: 'New Delhi',
    destinationCode: 'NDLS',
    currentLocation: 'Kanpur Central',
    currentLocationCode: 'CNB',
    nextStation: 'Prayagraj Junction',
    nextStationCode: 'PRYJ',
    currentSpeed: 92,
    maxSpeed: 130,
    distanceCovered: 440,
    totalDistance: 1447,
    scheduledEta: '18:30',
    traditionalEta: '18:30',
    aiPredictedEta: '18:48',
    delayMinutes: 18,
    status: 'delayed',
    confidenceScore: 96,
    lat: 38,
    lng: 48,
    lastUpdated: 'Just now',
    timeline: [
      {
        id: 'stop-1',
        stationName: 'New Delhi',
        stationCode: 'NDLS',
        scheduledArrival: '16:55',
        scheduledDeparture: '16:55',
        predictedArrival: '16:55',
        predictedDeparture: '16:55',
        delayMinutes: 0,
        distanceFromOrigin: 0,
        status: 'completed',
        platform: 'PF 16'
      },
      {
        id: 'stop-2',
        stationName: 'Kanpur Central',
        stationCode: 'CNB',
        scheduledArrival: '21:30',
        scheduledDeparture: '21:35',
        predictedArrival: '21:42',
        predictedDeparture: '21:47',
        delayMinutes: 12,
        status: 'current',
        platform: 'PF 4'
      },
      {
        id: 'stop-3',
        stationName: 'Prayagraj Junction',
        stationCode: 'PRYJ',
        scheduledArrival: '23:40',
        scheduledDeparture: '23:42',
        predictedArrival: '23:58',
        predictedDeparture: '00:00',
        delayMinutes: 18,
        distanceFromOrigin: 635,
        status: 'upcoming',
        platform: 'PF 5'
      },
      {
        id: 'stop-4',
        stationName: 'Gaya Junction',
        stationCode: 'GAYA',
        scheduledArrival: '05:35',
        scheduledDeparture: '05:38',
        predictedArrival: '05:51',
        predictedDeparture: '05:54',
        delayMinutes: 16,
        distanceFromOrigin: 994,
        status: 'upcoming',
        platform: 'PF 2'
      },
      {
        id: 'stop-5',
        stationName: 'Dhanbad Junction',
        stationCode: 'DHN',
        scheduledArrival: '08:40',
        scheduledDeparture: '08:45',
        predictedArrival: '08:55',
        predictedDeparture: '09:00',
        delayMinutes: 15,
        distanceFromOrigin: 1195,
        status: 'upcoming',
        platform: 'PF 3'
      },
      {
        id: 'stop-6',
        stationName: 'Howrah Junction',
        stationCode: 'HWH',
        scheduledArrival: '12:15',
        scheduledDeparture: '12:15',
        predictedArrival: '12:33',
        predictedDeparture: '12:33',
        delayMinutes: 18,
        distanceFromOrigin: 1447,
        status: 'upcoming',
        platform: 'PF 9'
      }
    ],
    delayFactors: [
      {
        id: 'df-1',
        name: 'Downstream Junction Congestion',
        category: 'congestion',
        impactMinutes: 8,
        type: 'delay',
        icon: '🔴',
        description: 'Heavy freight train movement on CNB-PRYJ quad track segment'
      },
      {
        id: 'df-2',
        name: 'Temporary Speed Restriction (TSR)',
        category: 'speed_restriction',
        impactMinutes: 5,
        type: 'delay',
        icon: '🟠',
        description: 'Track renewal caution order (40 km/h speed cap over 3.2 km)'
      },
      {
        id: 'df-3',
        name: 'Dense Fog & Low Visibility',
        category: 'weather',
        impactMinutes: 7,
        type: 'delay',
        icon: '🟠',
        description: 'Foggy weather reported in Prayagraj division'
      },
      {
        id: 'df-4',
        name: 'Historical Schedule Padding Recovery',
        category: 'recovery',
        impactMinutes: -2,
        type: 'gain',
        icon: '🟢',
        description: 'AI model factors in 15 min buffer between DHN & HWH'
      }
    ]
  },
  {
    id: '12019',
    number: '12019',
    name: 'Howrah - Ranchi Shatabdi Express',
    type: 'Shatabdi',
    zone: 'ER',
    origin: 'Howrah Jn.',
    originCode: 'HWH',
    destination: 'Ranchi',
    destinationCode: 'RNC',
    currentLocation: 'Arrived at Ranchi (RNC)',
    currentLocationCode: 'RNC',
    nextStation: 'Ranchi [Terminus]',
    nextStationCode: 'RNC',
    currentSpeed: 0,
    maxSpeed: 130,
    distanceCovered: 436,
    totalDistance: 436,
    scheduledEta: '13:15',
    traditionalEta: '13:15',
    aiPredictedEta: '13:15 (Arrived)',
    delayMinutes: 0,
    status: 'on_time',
    confidenceScore: 98,
    lat: 23.3441,
    lng: 85.3096,
    lastUpdated: 'Just now',
    timeline: [
      { id: 'st-hwh', sequence: 1, stationName: 'Howrah Jn.', stationCode: 'HWH', scheduledArrival: '06:05', scheduledDeparture: '06:05', predictedArrival: '06:05', predictedDeparture: '06:05', delayMinutes: 0, distanceFromOrigin: 0, status: 'completed', platform: 'PF 10' },
      { id: 'st-dgr', sequence: 2, stationName: 'Durgapur', stationCode: 'DGR', scheduledArrival: '07:48', scheduledDeparture: '07:50', predictedArrival: '07:48', predictedDeparture: '07:50', delayMinutes: 0, distanceFromOrigin: 157, status: 'completed', platform: 'PF 3' },
      { id: 'st-rng', sequence: 3, stationName: 'Rani Ganj', stationCode: 'RNG', scheduledArrival: '08:05', scheduledDeparture: '08:06', predictedArrival: '08:05', predictedDeparture: '08:06', delayMinutes: 0, distanceFromOrigin: 181, status: 'completed', platform: 'PF 2' },
      { id: 'st-asn', sequence: 4, stationName: 'Asansol Main', stationCode: 'ASN', scheduledArrival: '08:22', scheduledDeparture: '08:24', predictedArrival: '08:22', predictedDeparture: '08:24', delayMinutes: 0, distanceFromOrigin: 199, status: 'completed', platform: 'PF 4' },
      { id: 'st-dhn', sequence: 5, stationName: 'Dhanbad Jn.', stationCode: 'DHN', scheduledArrival: '09:20', scheduledDeparture: '09:25', predictedArrival: '09:20', predictedDeparture: '09:25', delayMinutes: 0, distanceFromOrigin: 258, status: 'completed', platform: 'PF 1' },
      { id: 'st-gmo', sequence: 6, stationName: 'NSC Bose J Gomoh', stationCode: 'GMO', scheduledArrival: '09:52', scheduledDeparture: '10:12', predictedArrival: '09:52', predictedDeparture: '10:12', delayMinutes: 0, distanceFromOrigin: 287, status: 'completed', platform: 'PF 3' },
      { id: 'st-crp', sequence: 7, stationName: 'Chandrapura', stationCode: 'CRP', scheduledArrival: '10:34', scheduledDeparture: '10:36', predictedArrival: '10:34', predictedDeparture: '10:36', delayMinutes: 0, distanceFromOrigin: 304, status: 'completed', platform: 'PF 1' },
      { id: 'st-bksc', sequence: 8, stationName: 'Bokaro Steel City', stationCode: 'BKSC', scheduledArrival: '11:05', scheduledDeparture: '11:07', predictedArrival: '11:05', predictedDeparture: '11:07', delayMinutes: 0, distanceFromOrigin: 319, status: 'completed', platform: 'PF 2' },
      { id: 'st-muri', sequence: 9, stationName: 'Muri', stationCode: 'MURI', scheduledArrival: '11:56', scheduledDeparture: '11:58', predictedArrival: '11:56', predictedDeparture: '11:58', delayMinutes: 0, distanceFromOrigin: 371, status: 'completed', platform: 'PF 1' },
      { id: 'st-rnc', sequence: 10, stationName: 'Ranchi', stationCode: 'RNC', scheduledArrival: '13:15', scheduledDeparture: '13:15', predictedArrival: '13:15', predictedDeparture: '13:15', delayMinutes: 0, distanceFromOrigin: 436, status: 'completed', platform: 'PF 1' }
    ],
    delayFactors: [
      {
        id: 'df-12019-1',
        name: 'Schedule Adherence',
        category: 'normal',
        impactMinutes: 0,
        type: 'gain',
        icon: '🟢',
        description: 'Successfully reached destination terminal Ranchi on scheduled time'
      }
    ]
  },
  {
    id: '12951',
    number: '12951',
    name: 'Mumbai Rajdhani Express',
    type: 'Rajdhani',
    zone: 'WR',
    origin: 'Mumbai Central',
    originCode: 'MMCT',
    destination: 'New Delhi',
    destinationCode: 'NDLS',
    currentLocation: 'Kota Junction',
    currentLocationCode: 'KOTA',
    nextStation: 'Sawai Madhopur',
    nextStationCode: 'SWM',
    currentSpeed: 112,
    maxSpeed: 130,
    distanceCovered: 910,
    totalDistance: 1386,
    scheduledEta: '08:32',
    traditionalEta: '08:32',
    aiPredictedEta: '08:34',
    delayMinutes: 2,
    status: 'on_time',
    confidenceScore: 98,
    lat: 44,
    lng: 28,
    lastUpdated: 'Just now',
    timeline: [
      {
        id: 'm1',
        stationName: 'Mumbai Central',
        stationCode: 'MMCT',
        scheduledArrival: '17:00',
        scheduledDeparture: '17:00',
        predictedArrival: '17:00',
        predictedDeparture: '17:00',
        delayMinutes: 0,
        distanceFromOrigin: 0,
        status: 'completed',
        platform: 'PF 1'
      },
      {
        id: 'm2',
        stationName: 'Surat',
        stationCode: 'ST',
        scheduledArrival: '19:43',
        scheduledDeparture: '19:48',
        predictedArrival: '19:45',
        predictedDeparture: '19:50',
        delayMinutes: 2,
        distanceFromOrigin: 263,
        status: 'completed',
        platform: 'PF 1'
      },
      {
        id: 'm3',
        stationName: 'Vadodara Junction',
        stationCode: 'BRC',
        scheduledArrival: '21:16',
        scheduledDeparture: '21:26',
        predictedArrival: '21:18',
        predictedDeparture: '21:28',
        delayMinutes: 2,
        distanceFromOrigin: 393,
        status: 'completed',
        platform: 'PF 2'
      },
      {
        id: 'm4',
        stationName: 'Kota Junction',
        stationCode: 'KOTA',
        scheduledArrival: '03:15',
        scheduledDeparture: '03:25',
        predictedArrival: '03:17',
        predictedDeparture: '03:27',
        delayMinutes: 2,
        distanceFromOrigin: 910,
        status: 'current',
        platform: 'PF 1'
      },
      {
        id: 'm5',
        stationName: 'New Delhi',
        stationCode: 'NDLS',
        scheduledArrival: '08:32',
        scheduledDeparture: '08:32',
        predictedArrival: '08:34',
        predictedDeparture: '08:34',
        delayMinutes: 2,
        distanceFromOrigin: 1386,
        status: 'upcoming',
        platform: 'PF 3'
      }
    ],
    delayFactors: [
      {
        id: 'm-df1',
        name: 'Optimal Track Clearance',
        category: 'recovery',
        impactMinutes: -3,
        type: 'gain',
        icon: '🟢',
        description: 'Green corridor allocated by Western Railway Control'
      },
      {
        id: 'm-df2',
        name: 'Platform Availability Hold',
        category: 'congestion',
        impactMinutes: 5,
        type: 'delay',
        icon: '🟠',
        description: 'Short wait for platform allocation at Kota'
      }
    ]
  },
  {
    id: '12002',
    number: '12002',
    name: 'Bhopal Shatabdi Express',
    type: 'Shatabdi',
    zone: 'NCR',
    origin: 'New Delhi',
    originCode: 'NDLS',
    destination: 'Rani Kamlapati (Bhopal)',
    destinationCode: 'RKMP',
    currentLocation: 'Agra Cantt',
    currentLocationCode: 'AGC',
    nextStation: 'Gwalior Junction',
    nextStationCode: 'GWL',
    currentSpeed: 130,
    maxSpeed: 150,
    distanceCovered: 195,
    totalDistance: 706,
    scheduledEta: '14:40',
    traditionalEta: '14:40',
    aiPredictedEta: '14:40',
    delayMinutes: 0,
    status: 'on_time',
    confidenceScore: 99,
    lat: 36,
    lng: 39,
    lastUpdated: 'Just now',
    timeline: [
      {
        id: 'b1',
        stationName: 'New Delhi',
        stationCode: 'NDLS',
        scheduledArrival: '06:00',
        scheduledDeparture: '06:00',
        predictedArrival: '06:00',
        predictedDeparture: '06:00',
        delayMinutes: 0,
        distanceFromOrigin: 0,
        status: 'completed',
        platform: 'PF 1'
      },
      {
        id: 'b2',
        stationName: 'Agra Cantt',
        stationCode: 'AGC',
        scheduledArrival: '07:50',
        scheduledDeparture: '07:55',
        predictedArrival: '07:50',
        predictedDeparture: '07:55',
        delayMinutes: 0,
        distanceFromOrigin: 195,
        status: 'current',
        platform: 'PF 1'
      },
      {
        id: 'b3',
        stationName: 'Gwalior Junction',
        stationCode: 'GWL',
        scheduledArrival: '09:23',
        scheduledDeparture: '09:28',
        predictedArrival: '09:23',
        predictedDeparture: '09:28',
        delayMinutes: 0,
        distanceFromOrigin: 313,
        status: 'upcoming',
        platform: 'PF 1'
      },
      {
        id: 'b4',
        stationName: 'Rani Kamlapati',
        stationCode: 'RKMP',
        scheduledArrival: '14:40',
        scheduledDeparture: '14:40',
        predictedArrival: '14:40',
        predictedDeparture: '14:40',
        delayMinutes: 0,
        distanceFromOrigin: 706,
        status: 'upcoming',
        platform: 'PF 5'
      }
    ],
    delayFactors: [
      {
        id: 'b-df1',
        name: 'Vande Bharat Track Priority',
        category: 'recovery',
        impactMinutes: 0,
        type: 'gain',
        icon: '🟢',
        description: 'Maximum permitted speed 130 km/h maintained on WCR division'
      }
    ]
  },
  {
    id: '12309',
    number: '12309',
    name: 'Patna Tejas Rajdhani Express',
    type: 'Rajdhani',
    zone: 'ECR',
    origin: 'Rajendra Nagar (Patna)',
    originCode: 'RJPB',
    destination: 'New Delhi',
    destinationCode: 'NDLS',
    currentLocation: 'Mirzapur',
    currentLocationCode: 'MZP',
    nextStation: 'Prayagraj Junction',
    nextStationCode: 'PRYJ',
    currentSpeed: 45,
    maxSpeed: 130,
    distanceCovered: 530,
    totalDistance: 1002,
    scheduledEta: '07:40',
    traditionalEta: '08:15',
    aiPredictedEta: '08:32',
    delayMinutes: 52,
    status: 'critical',
    confidenceScore: 93,
    lat: 41,
    lng: 52,
    lastUpdated: 'Just now',
    timeline: [
      {
        id: 'p1',
        stationName: 'Rajendra Nagar',
        stationCode: 'RJPB',
        scheduledArrival: '19:10',
        scheduledDeparture: '19:10',
        predictedArrival: '19:10',
        predictedDeparture: '19:10',
        delayMinutes: 0,
        distanceFromOrigin: 0,
        status: 'completed',
        platform: 'PF 2'
      },
      {
        id: 'p2',
        stationName: 'Pt DD Upadhyaya',
        stationCode: 'DDU',
        scheduledArrival: '22:12',
        scheduledDeparture: '22:22',
        predictedArrival: '22:45',
        predictedDeparture: '22:55',
        delayMinutes: 33,
        distanceFromOrigin: 211,
        status: 'completed',
        platform: 'PF 4'
      },
      {
        id: 'p3',
        stationName: 'Mirzapur',
        stationCode: 'MZP',
        scheduledArrival: '23:55',
        scheduledDeparture: '23:57',
        predictedArrival: '00:43',
        predictedDeparture: '00:45',
        delayMinutes: 48,
        distanceFromOrigin: 274,
        status: 'current',
        platform: 'PF 3'
      },
      {
        id: 'p4',
        stationName: 'New Delhi',
        stationCode: 'NDLS',
        scheduledArrival: '07:40',
        scheduledDeparture: '07:40',
        predictedArrival: '08:32',
        predictedDeparture: '08:32',
        delayMinutes: 52,
        distanceFromOrigin: 1002,
        status: 'upcoming',
        platform: 'PF 12'
      }
    ],
    delayFactors: [
      {
        id: 'p-df1',
        name: 'Severe Signal Interlock Failure',
        category: 'signal',
        impactMinutes: 28,
        type: 'delay',
        icon: '🔴',
        description: 'Automated relay interlocking issue near Pt. Deen Dayal Upadhyaya JN'
      },
      {
        id: 'p-df2',
        name: 'Heavy Freight Blockade',
        category: 'congestion',
        impactMinutes: 18,
        type: 'delay',
        icon: '🔴',
        description: 'Overdue coal rake clearing third line corridor'
      },
      {
        id: 'p-df3',
        name: 'Overhead Equipment (OHE) Caution',
        category: 'maintenance',
        impactMinutes: 6,
        type: 'delay',
        icon: '🟠',
        description: 'OHE voltage maintenance near Naini bridge'
      }
    ]
  },
  {
    id: '22436',
    number: '22436',
    name: 'Vande Bharat Express',
    type: 'Vande Bharat',
    zone: 'NR',
    origin: 'New Delhi',
    originCode: 'NDLS',
    destination: 'Varanasi Junction',
    destinationCode: 'BSB',
    currentLocation: 'Kanpur Central',
    currentLocationCode: 'CNB',
    nextStation: 'Prayagraj Junction',
    nextStationCode: 'PRYJ',
    currentSpeed: 128,
    maxSpeed: 160,
    distanceCovered: 440,
    totalDistance: 759,
    scheduledEta: '14:00',
    traditionalEta: '14:00',
    aiPredictedEta: '14:03',
    delayMinutes: 3,
    status: 'on_time',
    confidenceScore: 97,
    lat: 38,
    lng: 47,
    lastUpdated: 'Just now',
    timeline: [
      {
        id: 'v1',
        stationName: 'New Delhi',
        stationCode: 'NDLS',
        scheduledArrival: '06:00',
        scheduledDeparture: '06:00',
        predictedArrival: '06:00',
        predictedDeparture: '06:00',
        delayMinutes: 0,
        distanceFromOrigin: 0,
        status: 'completed',
        platform: 'PF 16'
      },
      {
        id: 'v2',
        stationName: 'Kanpur Central',
        stationCode: 'CNB',
        scheduledArrival: '10:08',
        scheduledDeparture: '10:10',
        predictedArrival: '10:10',
        predictedDeparture: '10:12',
        delayMinutes: 2,
        distanceFromOrigin: 440,
        status: 'current',
        platform: 'PF 5'
      },
      {
        id: 'v3',
        stationName: 'Varanasi Junction',
        stationCode: 'BSB',
        scheduledArrival: '14:00',
        scheduledDeparture: '14:00',
        predictedArrival: '14:03',
        predictedDeparture: '14:03',
        delayMinutes: 3,
        distanceFromOrigin: 759,
        status: 'upcoming',
        platform: 'PF 1'
      }
    ],
    delayFactors: [
      {
        id: 'v-df1',
        name: 'High Speed Track Priority',
        category: 'recovery',
        impactMinutes: -5,
        type: 'gain',
        icon: '🟢',
        description: 'Vande Bharat priority signaling granted by NCR controller'
      }
    ]
  },
  {
    id: '12259',
    number: '12259',
    name: 'Sealdah Duronto Express',
    type: 'Duronto',
    zone: 'ER',
    origin: 'Bikaner Junction',
    originCode: 'BKN',
    destination: 'Sealdah (Kolkata)',
    destinationCode: 'SDAH',
    currentLocation: 'Dhanbad Junction',
    currentLocationCode: 'DHN',
    nextStation: 'Asansol Junction',
    nextStationCode: 'ASN',
    currentSpeed: 88,
    maxSpeed: 130,
    distanceCovered: 1690,
    totalDistance: 1918,
    scheduledEta: '12:45',
    traditionalEta: '13:00',
    aiPredictedEta: '13:09',
    delayMinutes: 24,
    status: 'delayed',
    confidenceScore: 94,
    lat: 48,
    lng: 68,
    lastUpdated: 'Just now',
    timeline: [
      {
        id: 'd1',
        stationName: 'New Delhi',
        stationCode: 'NDLS',
        scheduledArrival: '19:40',
        scheduledDeparture: '20:00',
        predictedArrival: '19:40',
        predictedDeparture: '20:00',
        delayMinutes: 0,
        distanceFromOrigin: 448,
        status: 'completed'
      },
      {
        id: 'd2',
        stationName: 'Dhanbad Junction',
        stationCode: 'DHN',
        scheduledArrival: '09:10',
        scheduledDeparture: '09:15',
        predictedArrival: '09:30',
        predictedDeparture: '09:35',
        delayMinutes: 20,
        status: 'current'
      },
      {
        id: 'd3',
        stationName: 'Sealdah',
        stationCode: 'SDAH',
        scheduledArrival: '12:45',
        scheduledDeparture: '12:45',
        predictedArrival: '13:09',
        predictedDeparture: '13:09',
        delayMinutes: 24,
        status: 'upcoming'
      }
    ],
    delayFactors: [
      {
        id: 'd-df1',
        name: 'Asansol Coal Corridor Congestion',
        category: 'congestion',
        impactMinutes: 16,
        type: 'delay',
        icon: '🟠',
        description: 'Slow line headway due to industrial siding movement'
      },
      {
        id: 'd-df2',
        name: 'Rain Washout Warning',
        category: 'weather',
        impactMinutes: 8,
        type: 'delay',
        icon: '🟠',
        description: 'Precautionary speed cap near Barddhaman'
      }
    ]
  }
];

export const NETWORK_HOTSPOTS: NetworkHotspot[] = [
  {
    id: 'hotspot-1',
    sectionName: 'Kanpur Central → Prayagraj JN',
    corridor: 'Delhi - Howrah Trunk Route',
    zone: 'NCR',
    congestionLevel: 'Critical',
    avgDelayMinutes: 28,
    affectedTrainsCount: 38,
    primaryCause: 'Quad-track interlocking & heavy freight overlap'
  },
  {
    id: 'hotspot-2',
    sectionName: 'Mathura JN → Agra Cantt',
    corridor: 'Delhi - Mumbai / Chennai Route',
    zone: 'NCR',
    congestionLevel: 'High',
    avgDelayMinutes: 19,
    affectedTrainsCount: 26,
    primaryCause: 'Third line expansion work & yard speed restrictions'
  },
  {
    id: 'hotspot-3',
    sectionName: 'Pt DD Upadhyaya → Gaya JN',
    corridor: 'Grand Chord Route',
    zone: 'ECR',
    congestionLevel: 'High',
    avgDelayMinutes: 22,
    affectedTrainsCount: 31,
    primaryCause: 'Coal rake traffic & automatic signaling overhaul'
  },
  {
    id: 'hotspot-4',
    sectionName: 'Palwal → Faridabad',
    corridor: 'NCR Suburban Corridor',
    zone: 'NR',
    congestionLevel: 'Moderate',
    avgDelayMinutes: 12,
    affectedTrainsCount: 44,
    primaryCause: 'Morning commuter local train priority holds'
  },
  {
    id: 'hotspot-5',
    sectionName: 'Surat → Vadodara JN',
    corridor: 'Mumbai - Ahmedabad Mainline',
    zone: 'WR',
    congestionLevel: 'Moderate',
    avgDelayMinutes: 9,
    affectedTrainsCount: 22,
    primaryCause: 'High-speed Rail corridor bridge crossing work'
  },
  {
    id: 'hotspot-6',
    sectionName: 'Nagpur JN → Itarsi JN',
    corridor: 'North - South Main Corridor',
    zone: 'CR',
    congestionLevel: 'High',
    avgDelayMinutes: 17,
    affectedTrainsCount: 19,
    primaryCause: 'Ghat section speed restrictions & heavy gradient operations'
  }
];

export const OPERATIONAL_ALERTS: OperationalAlert[] = [
  {
    id: 'alert-101',
    title: 'Critical Downstream Congestion',
    category: 'congestion',
    severity: 'critical',
    location: 'Kanpur Central (CNB) Sector 4',
    zone: 'NCR',
    affectedRoute: 'Delhi → Prayagraj Route',
    affectedTrainsCount: 14,
    expectedImpact: '+25 to +35 minutes',
    timestamp: '10 mins ago',
    description: 'Automatic signaling backlog created by delayed inter-state freight freight movements.'
  },
  {
    id: 'alert-102',
    title: 'Temporary Speed Restriction (TSR)',
    category: 'operational',
    severity: 'warning',
    location: 'Dhanbad Division KM 284',
    zone: 'ECR',
    affectedRoute: 'Gaya → Asansol Trunk Line',
    affectedTrainsCount: 9,
    expectedImpact: '+10 to +15 minutes',
    timestamp: '25 mins ago',
    description: 'Track maintenance gang on-duty; 30 km/h caution order issued for down line.'
  },
  {
    id: 'alert-103',
    title: 'Torrential Weather Warning',
    category: 'weather',
    severity: 'warning',
    location: 'Eastern Railway Division (Barddhaman)',
    zone: 'ER',
    affectedRoute: 'Asansol → Howrah',
    affectedTrainsCount: 18,
    expectedImpact: '+15 to +20 minutes',
    timestamp: '42 mins ago',
    description: 'Monsoon downpour detected on sensors. Automatic wiper and speed regulation enforced.'
  },
  {
    id: 'alert-104',
    title: 'Signal Clearance Delay Resolving',
    category: 'operational',
    severity: 'info',
    location: 'Ghaziabad Junction (GZB)',
    zone: 'NR',
    affectedRoute: 'Delhi → Moradabad / Kanpur',
    affectedTrainsCount: 6,
    expectedImpact: '-5 minutes (Recovery)',
    timestamp: '1 hour ago',
    description: 'Interlock fault resolved by S&T team; green signal sequence restored.'
  }
];

export const DELAY_TRENDS_DATA = [
  { time: '00:00', avgDelay: 12, aiAccuracy: 95.2 },
  { time: '03:00', avgDelay: 9, aiAccuracy: 96.1 },
  { time: '06:00', avgDelay: 14, aiAccuracy: 94.5 },
  { time: '09:00', avgDelay: 22, aiAccuracy: 93.8 },
  { time: '12:00', avgDelay: 28, aiAccuracy: 94.2 },
  { time: '15:00', avgDelay: 24, aiAccuracy: 95.0 },
  { time: '18:00', avgDelay: 19, aiAccuracy: 95.8 },
  { time: '21:00', avgDelay: 15, aiAccuracy: 96.4 }
];

export const DELAY_DISTRIBUTION_DATA = [
  { range: '0–5 min', count: 1820, percent: '64%' },
  { range: '5–15 min', count: 610, percent: '21%' },
  { range: '15–30 min', count: 280, percent: '10%' },
  { range: '30–60 min', count: 119, percent: '4%' },
  { range: '60+ min', count: 18, percent: '1%' }
];

export const DELAY_CAUSES_DATA = [
  { cause: 'Junction Congestion', value: 38 },
  { cause: 'Signal Interlock Halt', value: 24 },
  { cause: 'Speed Restrictions (TSR)', value: 16 },
  { cause: 'Weather & Fog Visibility', value: 11 },
  { cause: 'Maintenance / Track Block', value: 7 },
  { cause: 'Unscheduled Platform Wait', value: 4 }
];

export const MODEL_ACCURACY_COMPARISON = [
  { name: 'Baseline Schedule', accuracy: 71.0, color: '#94a3b8' },
  { name: 'Traditional NTES Delay ETA', accuracy: 82.4, color: '#3b82f6' },
  { name: 'RailVue AI Prediction Engine', accuracy: 94.8, color: '#10b981' }
];

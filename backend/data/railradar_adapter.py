import os
import json
import time
import requests
import pandas as pd
from datetime import datetime

DEFAULT_RAILRADAR_API_KEY = "rg_1b3cfb97ce074697be75e92156bb6445"

def load_env_file():
    env_paths = [
        os.path.join(os.path.dirname(__file__), '..', '.env'),
        os.path.join(os.path.dirname(__file__), '.env'),
        '.env'
    ]
    for p in env_paths:
        if os.path.exists(p):
            with open(p, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        k, v = line.split('=', 1)
                        os.environ.setdefault(k.strip(), v.strip())

load_env_file()

class RailRadarAdapter:
    def __init__(self, api_key=None, base_url=None):
        self.api_key = api_key or os.getenv('RAILRADAR_API_KEY', DEFAULT_RAILRADAR_API_KEY)
        self.base_url = base_url or os.getenv('RAILRADAR_BASE_URL', 'https://api.railradar.in')
        self.cache_dir = os.path.join(os.path.dirname(__file__), 'cache', 'railradar')
        os.makedirs(self.cache_dir, exist_ok=True)
        self._memory_cache = {}

    def _get_headers(self):
        headers = {'Accept': 'application/json'}
        if self.api_key:
            headers['Authorization'] = f'Bearer {self.api_key}'
        return headers

    def get_static_schedule(self, train_number):
        cache_file = os.path.join(self.cache_dir, f'schedule_{train_number}.json')
        if os.path.exists(cache_file):
            try:
                with open(cache_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception:
                pass

        try:
            url = f'{self.base_url}/v1/trains/{train_number}'
            resp = requests.get(url, headers=self._get_headers(), timeout=8)
            if resp.status_code == 200:
                data = resp.json()
                with open(cache_file, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2)
                return data
        except Exception as e:
            print(f'[RailRadar] Error fetching schedule for {train_number}: {e}')

        return self._fallback_static_schedule(train_number)

    def get_live_train_status(self, train_number: str) -> dict:
        """
        Fetches live train running status, handling arrival completion,
        scheduled pre-departure, and active tracking with memory caching.
        """
        now = time.time()
        if train_number in self._memory_cache:
            entry, cached_at = self._memory_cache[train_number]
            if now - cached_at < 60: # 60-second in-memory TTL to conserve API quota
                return entry

        try:
            url = f'{self.base_url}/v1/trains/{train_number}/live'
            resp = requests.get(url, headers=self._get_headers(), timeout=8)
            if resp.status_code == 200:
                body = resp.json()
                d = body.get('data', {})
                raw_status = d.get('status', 'running')
                
                # Determine normalized lifecycle status
                if raw_status == 'completed':
                    status = 'completed'
                    is_completed = True
                    is_running = False
                elif raw_status in ['not-started', 'scheduled']:
                    status = 'not_started'
                    is_completed = False
                    is_running = False
                else:
                    status = 'running'
                    is_completed = False
                    is_running = True

                curr_loc = d.get('currentLocation') or {}
                curr_station = curr_loc.get('stationName') or curr_loc.get('stationCode') or 'In Transit'
                curr_delay = float(d.get('delayMinutes') or curr_loc.get('delayMinutes') or 0.0)
                dist_covered = float(curr_loc.get('distanceFromOriginKm', 0.0) or 0.0)
                
                # Check route endpoints
                route = d.get('route', [])
                total_dist = 1447.0
                dest_station = "Destination"
                if route:
                    last_stop = route[-1]
                    total_dist = float(last_stop.get('distance', 1447.0) or 1447.0)
                    dest_station = last_stop.get('stationName', 'Destination')
                    if last_stop.get('actualArrival') is not None or last_stop.get('status') == 'at-station' and status == 'completed':
                        status = 'completed'
                        is_completed = True
                        curr_station = dest_station

                parsed_result = {
                    'train_number': str(train_number),
                    'train_name': d.get('trainName', f'Express {train_number}'),
                    'status': status,
                    'is_completed': is_completed,
                    'is_running': is_running,
                    'current_station': curr_station,
                    'destination': dest_station,
                    'delay_minutes': curr_delay,
                    'distance_covered_km': dist_covered,
                    'total_distance_km': total_dist,
                    'last_updated_at': d.get('lastUpdatedAt', datetime.now().isoformat()),
                    'source': 'RailRadar Live Telemetry (rg_1b3cfb97ce074697be75e92156bb6445)'
                }
                
                self._memory_cache[train_number] = (parsed_result, now)
                return parsed_result
        except Exception as e:
            print(f'[RailRadar] Live fetch exception for {train_number}: {e}')

        return self._fallback_live_status(train_number)

    def get_live_snapshot(self, train_number, date_str=None):
        if date_str is None:
            date_str = datetime.now().strftime('%Y-%m-%d')

        try:
            url = f'{self.base_url}/v1/trains/{train_number}/live'
            resp = requests.get(url, headers=self._get_headers(), params={'date': date_str}, timeout=8)
            if resp.status_code == 200:
                payload = resp.json()
                route_stops = payload.get('route', [])
                completed_stops = []
                for stop in route_stops:
                    act_arr = stop.get('actualArrival')
                    act_dep = stop.get('actualDeparture')
                    if act_arr is not None or act_dep is not None:
                        completed_stops.append({
                            'train_number': str(train_number),
                            'date': date_str,
                            'station_code': stop.get('stationCode', 'UNKNOWN'),
                            'station_name': stop.get('stationName', 'Unknown'),
                            'scheduled_arrival': stop.get('scheduledArrival'),
                            'actual_arrival': act_arr,
                            'delay_arrival_minutes': float(stop.get('delayArrival', 0.0) or 0.0),
                            'scheduled_departure': stop.get('scheduledDeparture'),
                            'actual_departure': act_dep,
                            'delay_departure_minutes': float(stop.get('delayDeparture', 0.0) or 0.0),
                            'distance_km': float(stop.get('distance', 0.0) or 0.0),
                            'speed_kmph': float(stop.get('speedToNextStationKmph', 75.0) or 75.0),
                            'latitude': stop.get('lat'),
                            'longitude': stop.get('lng'),
                            'source': 'railradar_live'
                        })
                return completed_stops
        except Exception as e:
            print(f'[RailRadar] Network error for {train_number}: {e}')

        return self._fallback_live_snapshot(train_number, date_str)

    def _fallback_static_schedule(self, train_number):
        return {
            'trainNumber': str(train_number),
            'trainName': f'Express {train_number}',
            'distance': 1447.0,
            'duration': 1050.0,
            'avgSpeed': 82.0,
            'maxSpeed': 130.0,
            'source': 'offline_cached_fallback'
        }

    def _fallback_live_status(self, train_number):
        return {
            'train_number': str(train_number),
            'train_name': f'Express {train_number}',
            'status': 'running',
            'is_completed': False,
            'is_running': True,
            'current_station': 'Kanpur Central',
            'destination': 'Howrah Junction',
            'delay_minutes': 18.0,
            'distance_covered_km': 440.0,
            'total_distance_km': 1447.0,
            'last_updated_at': datetime.now().isoformat(),
            'source': 'offline_fallback'
        }

    def _fallback_live_snapshot(self, train_number, date_str):
        return [
            {
                'train_number': str(train_number),
                'date': date_str,
                'station_code': 'CNB',
                'station_name': 'Kanpur Central',
                'scheduled_arrival': '19:06',
                'actual_arrival': '19:24',
                'delay_arrival_minutes': 18.0,
                'scheduled_departure': '19:09',
                'actual_departure': '19:27',
                'delay_departure_minutes': 18.0,
                'distance_km': 440.0,
                'speed_kmph': 88.0,
                'latitude': 26.4499,
                'longitude': 80.3319,
                'source': 'offline_fallback'
            }
        ]

railradar_client = RailRadarAdapter()

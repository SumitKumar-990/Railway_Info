import math
from typing import Dict, List, Any, Optional, Tuple

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates Haversine distance between two lat/lng points in km."""
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

class LiveLocationEngine:
    """
    Dedicated Live Location & Segment Detection Engine for RailVue AI.
    Converts telemetry (lat/lng or station code or distance) into:
    - Previous station
    - Current segment (e.g. Thane -> Panvel)
    - Next station
    - Segment progress (0..100%)
    - Station state machine (DEPARTED, AT_STATION, APPROACHING, UPCOMING, PASSED, TERMINUS)
    - Interpolated lat/lng on polyline when needed.
    """

    @staticmethod
    def determine_station_status(
        seq: int,
        curr_seq: int,
        is_curr_at_station: bool,
        dist_from_origin: float,
        curr_dist_from_origin: float,
        next_halt_dist: float
    ) -> str:
        """Determines fine-grained status for a station in the route sequence."""
        if seq < curr_seq:
            return "DEPARTED"
        elif seq == curr_seq:
            return "AT_STATION" if is_curr_at_station else "DEPARTED"
        elif seq == curr_seq + 1:
            # Check proximity for APPROACHING
            dist_to_st = dist_from_origin - curr_dist_from_origin
            if dist_to_st <= 12.0: # Within 12 km
                return "APPROACHING"
            return "UPCOMING"
        else:
            return "UPCOMING"

    @staticmethod
    def match_segment_by_distance(
        stations: List[Dict[str, Any]],
        covered_km: float
    ) -> Tuple[Dict[str, Any], Dict[str, Any], float]:
        """
        Given total distance covered, finds:
        - Previous station
        - Next station
        - Segment progress (0.0 to 100.0)
        """
        if not stations:
            dummy = {"sequence": 1, "station_code": "ORG", "station_name": "Origin", "distance_km": 0.0}
            return dummy, dummy, 0.0

        if covered_km <= stations[0].get("distance_km", 0.0):
            return stations[0], (stations[1] if len(stations) > 1 else stations[0]), 0.0

        if covered_km >= stations[-1].get("distance_km", 0.0):
            return stations[-2] if len(stations) > 1 else stations[-1], stations[-1], 100.0

        for i in range(len(stations) - 1):
            st_prev = stations[i]
            st_next = stations[i + 1]
            d_prev = float(st_prev.get("distance_km", 0.0))
            d_next = float(st_next.get("distance_km", 0.0))

            if d_prev <= covered_km <= d_next:
                seg_len = max(0.1, d_next - d_prev)
                prog = max(0.0, min(100.0, ((covered_km - d_prev) / seg_len) * 100.0))
                return st_prev, st_next, round(prog, 1)

        return stations[-2], stations[-1], 100.0

    @staticmethod
    def interpolate_coordinates(
        prev_lat: float, prev_lng: float,
        next_lat: float, next_lng: float,
        progress_pct: float
    ) -> Tuple[float, float]:
        """Linearly interpolates lat/lng between two station coordinates based on progress percentage."""
        t = max(0.0, min(1.0, progress_pct / 100.0))
        lat = prev_lat + t * (next_lat - prev_lat)
        lng = prev_lng + t * (next_lng - prev_lng)
        return round(lat, 5), round(lng, 5)

    @staticmethod
    def calculate_bearing(lat1: float, lon1: float, lat2: float, lon2: float) -> str:
        """Calculates compass direction/bearing string from point 1 to point 2."""
        d_lon = math.radians(lon2 - lon1)
        lat1_r = math.radians(lat1)
        lat2_r = math.radians(lat2)

        y = math.sin(d_lon) * math.cos(lat2_r)
        x = math.cos(lat1_r) * math.sin(lat2_r) - math.sin(lat1_r) * math.cos(lat2_r) * math.cos(d_lon)
        brng = (math.degrees(math.atan2(y, x)) + 360) % 360

        dirs = ["North", "North-East", "East", "South-East", "South", "South-West", "West", "North-West"]
        idx = int((brng + 22.5) / 45) % 8
        return dirs[idx]

live_location_engine = LiveLocationEngine()

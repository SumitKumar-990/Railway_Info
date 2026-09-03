import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data") if '__file__' in globals() else "backend/data"


def generate_indian_railways_raw_data(num_samples: int = 1500) -> pd.DataFrame:
    """
    Generates domain-specific Indian Railways historical train journey dataset.
    Features include: train_id, train_number, train_name, station_id, station_code,
    scheduled_arrival, actual_arrival, arrival_delay_minutes, route_distance, distance_remaining,
    day_of_week, month, hour, historical_route_delay, historical_station_delay.
    """
    np.random.seed(42)
    
    train_catalog = [
        {"id": "12301", "number": "12301", "name": "Howrah Rajdhani Express", "route_dist": 1447},
        {"id": "12951", "number": "12951", "name": "Mumbai Rajdhani Express", "route_dist": 1386},
        {"id": "12002", "number": "12002", "name": "Bhopal Shatabdi Express", "route_dist": 706},
        {"id": "12309", "number": "12309", "name": "Patna Tejas Rajdhani", "route_dist": 1002},
        {"id": "22436", "number": "22436", "name": "Vande Bharat Express", "route_dist": 759},
        {"id": "12259", "number": "12259", "name": "Sealdah Duronto Express", "route_dist": 1918}
    ]

    stations = [
        {"id": "ST01", "code": "NDLS", "name": "New Delhi"},
        {"id": "ST02", "code": "CNB", "name": "Kanpur Central"},
        {"id": "ST03", "code": "PRYJ", "name": "Prayagraj Junction"},
        {"id": "ST04", "code": "DDU", "name": "Pt DD Upadhyaya"},
        {"id": "ST05", "code": "GAYA", "name": "Gaya Junction"},
        {"id": "ST06", "code": "DHN", "name": "Dhanbad Junction"},
        {"id": "ST07", "code": "HWH", "name": "Howrah Junction"}
    ]

    data = []
    base_time = datetime(2026, 8, 1, 6, 0, 0)

    for i in range(num_samples):
        train = np.random.choice(train_catalog)
        st = np.random.choice(stations)
        
        distance_remaining = np.random.uniform(50, train["route_dist"] - 50)
        distance_covered = train["route_dist"] - distance_remaining
        
        current_speed = np.random.uniform(45, 130)
        base_scheduled_remaining_minutes = (distance_remaining / 90.0) * 60.0
        
        # Synthetic delay factors
        historical_route_delay = np.random.exponential(scale=12.0)
        historical_station_delay = np.random.exponential(scale=8.0)
        current_delay = np.random.exponential(scale=15.0)
        
        weather_impact = np.random.choice([0, 5, 12, 20], p=[0.7, 0.15, 0.1, 0.05])
        congestion_impact = np.random.choice([0, 8, 18, 30], p=[0.6, 0.2, 0.15, 0.05])
        
        crew_and_ops_variance = np.random.normal(0, 9)
        unmodeled_disruption = np.random.choice([0, np.random.uniform(10, 45)], p=[0.85, 0.15])
        weather_delay_interaction = 0.15 * weather_impact * (current_delay > 20)

        remaining_travel_time = (
            base_scheduled_remaining_minutes + (current_delay * 0.6) + weather_impact
            + congestion_impact + (historical_route_delay * 0.3) + weather_delay_interaction
            + crew_and_ops_variance + unmodeled_disruption
        )
        remaining_travel_time = max(10, remaining_travel_time)
        
        time_offset = timedelta(minutes=int(np.random.uniform(0, 30 * 24 * 60)))
        ts = base_time + time_offset

        data.append({
            "sample_id": f"SMP_{i+1:05d}",
            "train_id": train["id"],
            "train_number": train["number"],
            "train_name": train["name"],
            "station_id": st["id"],
            "station_code": st["code"],
            "station_name": st["name"],
            "timestamp": ts.isoformat(),
            "scheduled_arrival": (ts + timedelta(minutes=base_scheduled_remaining_minutes)).strftime("%H:%M"),
            "actual_arrival": (ts + timedelta(minutes=remaining_travel_time)).strftime("%H:%M"),
            "current_delay_minutes": float(round(current_delay, 1)),
            "current_speed_kmph": float(round(current_speed, 1)),
            "route_distance_km": float(train["route_dist"]),
            "distance_remaining_km": float(round(distance_remaining, 1)),
            "scheduled_remaining_time_minutes": float(round(base_scheduled_remaining_minutes, 1)),
            "historical_route_delay": float(round(historical_route_delay, 1)),
            "historical_station_delay": float(round(historical_station_delay, 1)),
            "weather_score": float(weather_impact / 20.0),
            "rainfall_mm": float(weather_impact * 2.5),
            "congestion_score": float(congestion_impact / 30.0),
            "speed_restriction_score": float(np.random.choice([0.0, 0.3, 0.7, 1.0])),
            "signal_delay_score": float(np.random.choice([0.0, 0.2, 0.6])),
            "hour_of_day": ts.hour,
            "day_of_week": ts.weekday(),
            "month": ts.month,
            "remaining_travel_time_minutes": float(round(remaining_travel_time, 1))
        })

    df = pd.DataFrame(data)
    return df

if __name__ == "__main__":
    out_dir = "backend/data/raw/indian_railways"
    os.makedirs(out_dir, exist_ok=True)
    df = generate_indian_railways_raw_data(2000)
    out_file = os.path.join(out_dir, "historical_train_runs.csv")
    df.to_csv(out_file, index=False)
    print(f"Generated raw Indian Railways dataset: {out_file} ({len(df)} rows)")

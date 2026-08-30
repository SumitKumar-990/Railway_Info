import os
import re
import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

def load_timetable_and_stations():
    base_dir = os.path.dirname(__file__)
    tt_path = os.path.join(base_dir, 'raw', 'indian_railways_all_zones_timetable_2026.csv')
    st_path = os.path.join(base_dir, 'stations.json')
    
    station_coords = {}
    if os.path.exists(st_path):
        with open(st_path, 'r', encoding='utf-8') as f:
            station_coords = json.load(f)

    if os.path.exists(tt_path):
        df_tt = pd.read_csv(tt_path)
        return df_tt, station_coords
    return None, station_coords

def parse_time_to_minutes(time_str: str) -> int:
    if not isinstance(time_str, str) or ':' not in time_str:
        return 0
    match = re.search(r'(\d{1,2}):(\d{2})', time_str)
    if match:
        h, m = int(match.group(1)), int(match.group(2))
        return h * 60 + m
    return 0

def extract_station_code(station_str: str) -> tuple:
    if not isinstance(station_str, str):
        return 'UNKNOWN', 'Unknown Station'
    match = re.search(r'\((.*?)\)', station_str)
    code = match.group(1).strip() if match else station_str.strip()[:4].upper()
    name = re.sub(r'\(.*?\)', '', station_str).strip()
    return code, name

def generate_realistic_historical_dataset(start_date='2026-08-01', end_date='2026-08-25', random_seed=42) -> pd.DataFrame:
    """
    Generates a realistic, chronological Indian Railways historical journey dataset
    derived from real train timetables, multi-station journey progression, and non-linear
    stochastic delay propagation dynamics (congestion queuing, weather, TSR, buffer recovery).
    """
    np.random.seed(random_seed)
    df_tt, station_coords = load_timetable_and_stations()

    train_groups = []
    if df_tt is not None and not df_tt.empty:
        for train_num, group in df_tt.groupby('Train Number'):
            sorted_stops = group.sort_values('Stop Sequence').copy()
            if len(sorted_stops) >= 3:
                train_groups.append({
                    'train_number': str(train_num),
                    'train_name': sorted_stops.iloc[0]['Train Name'],
                    'zone': sorted_stops.iloc[0].get('Railway Zone', 'NR'),
                    'stops': sorted_stops
                })

    if not train_groups:
        default_stops = pd.DataFrame([
            {'Stop Sequence': 1, 'Station Name': 'New Delhi (NDLS)', 'Arrival Time': 'Source', 'Departure Time': '06:00'},
            {'Stop Sequence': 2, 'Station Name': 'Kanpur Central (CNB)', 'Arrival Time': '10:15', 'Departure Time': '10:20'},
            {'Stop Sequence': 3, 'Station Name': 'Prayagraj Junction (PRYJ)', 'Arrival Time': '12:45', 'Departure Time': '12:50'},
            {'Stop Sequence': 4, 'Station Name': 'Pt DD Upadhyaya (DDU)', 'Arrival Time': '14:50', 'Departure Time': '14:55'},
            {'Stop Sequence': 5, 'Station Name': 'Gaya Junction (GAYA)', 'Arrival Time': '17:10', 'Departure Time': '17:15'},
            {'Stop Sequence': 6, 'Station Name': 'Howrah Junction (HWH)', 'Arrival Time': '21:30', 'Departure Time': 'Destination'}
        ])
        train_groups = [{'train_number': '12301', 'train_name': 'Howrah Rajdhani Express', 'zone': 'ER', 'stops': default_stops}]

    date_list = pd.date_range(start=start_date, end=end_date, freq='1D')
    all_journey_rows = []

    for dt in date_list:
        for train_info in train_groups:
            train_num = train_info['train_number']
            train_name = train_info['train_name']
            zone = train_info['zone']
            stops_df = train_info['stops']

            num_stops = len(stops_df)
            date_str = dt.strftime('%Y%m%d')
            journey_id = f'JRN_{train_num}_{date_str}'

            stop_details = []
            cum_dist = 0.0
            
            for idx, (_, row) in enumerate(stops_df.iterrows()):
                code, name = extract_station_code(row['Station Name'])
                arr_m = parse_time_to_minutes(str(row['Arrival Time']))
                dep_m = parse_time_to_minutes(str(row['Departure Time']))
                
                step_dist = np.random.uniform(55, 125) if idx > 0 else 0.0
                cum_dist += step_dist

                coords = station_coords.get(code, {'latitude': 25.0 + (idx * 0.5), 'longitude': 80.0 + (idx * 0.8)})
                stop_details.append({
                    'seq': int(row['Stop Sequence']),
                    'code': code,
                    'name': name,
                    'arr_minutes': arr_m,
                    'dep_minutes': dep_m,
                    'cum_dist': cum_dist,
                    'lat': coords.get('latitude', 25.5),
                    'lng': coords.get('longitude', 81.0)
                })

            total_route_dist = stop_details[-1]['cum_dist']
            if total_route_dist <= 0:
                total_route_dist = 850.0

            current_delay = np.random.exponential(scale=6.0) if np.random.random() > 0.4 else 0.0
            prev_delay = 0.0

            day_rain = np.random.choice([0.0, 5.0, 18.0, 45.0], p=[0.65, 0.20, 0.10, 0.05])
            day_fog = np.random.choice([0.0, 0.4, 0.8], p=[0.80, 0.15, 0.05])
            weather_score = min(1.0, (day_rain / 50.0) + (day_fog * 0.5))

            leg_actual_durations = []
            leg_congestion_scores = []
            leg_tsr_scores = []
            leg_signal_scores = []

            for k in range(num_stops - 1):
                st_a = stop_details[k]
                st_b = stop_details[k+1]
                leg_dist = max(20.0, st_b['cum_dist'] - st_a['cum_dist'])
                
                sched_leg_time = (leg_dist / 82.0) * 60.0

                cong_score = float(np.random.beta(2, 5))
                tsr_score = float(np.random.choice([0.0, 0.25, 0.6], p=[0.75, 0.20, 0.05]))
                signal_score = float(np.random.choice([0.0, 0.3, 0.8], p=[0.70, 0.22, 0.08]))

                cong_delay = (cong_score ** 2.2) * 22.0
                tsr_delay = tsr_score * 12.0
                sig_delay = signal_score * 16.0
                wea_delay = (weather_score ** 1.5) * 14.0
                
                buffer_rec = min(6.0, sched_leg_time * 0.08) if (cong_score < 0.3 and weather_score < 0.2) else 0.0
                noise = float(np.random.normal(0, 3.0))

                actual_leg_time = max(sched_leg_time * 0.85, sched_leg_time + cong_delay + tsr_delay + sig_delay + wea_delay - buffer_rec + noise)
                leg_actual_durations.append(actual_leg_time)
                leg_congestion_scores.append(cong_score)
                leg_tsr_scores.append(tsr_score)
                leg_signal_scores.append(signal_score)

            for k in range(num_stops - 1):
                st_current = stop_details[k]
                st_next = stop_details[k+1]
                
                dist_rem = max(10.0, total_route_dist - st_current['cum_dist'])
                dist_to_next = max(10.0, st_next['cum_dist'] - st_current['cum_dist'])
                
                sched_rem_time = (dist_rem / 82.0) * 60.0
                actual_rem_time = sum(leg_actual_durations[k:])
                
                current_speed = float(np.clip(np.random.normal(85.0 - (leg_congestion_scores[k] * 35.0), 12.0), 30.0, 130.0))

                dep_m = st_current['dep_minutes'] if st_current['dep_minutes'] > 0 else (k * 75)
                sample_time = dt + timedelta(minutes=int(dep_m + current_delay))

                all_journey_rows.append({
                    'sample_id': f'{journey_id}_ST{k+1:02d}',
                    'journey_id': journey_id,
                    'timestamp': sample_time.strftime('%Y-%m-%dT%H:%M:%S'),
                    'train_id': train_num,
                    'train_number': train_num,
                    'train_name': train_name,
                    'zone': zone,
                    'current_station_code': st_current['code'],
                    'current_station_name': st_current['name'],
                    'next_station_code': st_next['code'],
                    'next_station_name': st_next['name'],
                    'latitude': float(st_current['lat']),
                    'longitude': float(st_current['lng']),
                    'current_delay_minutes': float(round(current_delay, 1)),
                    'previous_station_delay': float(round(prev_delay, 1)),
                    'current_speed_kmph': float(round(current_speed, 1)),
                    'distance_to_next_station_km': float(round(dist_to_next, 1)),
                    'distance_remaining_km': float(round(dist_rem, 1)),
                    'scheduled_remaining_time_minutes': float(round(sched_rem_time, 1)),
                    'weather_score': float(round(weather_score, 2)),
                    'rainfall_mm': float(round(day_rain, 1)),
                    'congestion_score': float(round(leg_congestion_scores[k], 2)),
                    'speed_restriction_score': float(round(leg_tsr_scores[k], 2)),
                    'signal_delay_score': float(round(leg_signal_scores[k], 2)),
                    'upcoming_station_count': int(num_stops - 1 - k),
                    'hour_of_day': int(sample_time.hour),
                    'day_of_week': int(sample_time.weekday()),
                    'month': int(sample_time.month),
                    'remaining_travel_time_minutes': float(round(actual_rem_time, 1))
                })

                sched_leg = (dist_to_next / 82.0) * 60.0
                delay_added_on_leg = leg_actual_durations[k] - sched_leg
                prev_delay = current_delay
                current_delay = max(0.0, current_delay + delay_added_on_leg)

    df_result = pd.DataFrame(all_journey_rows)
    df_result = df_result.sort_values('timestamp').reset_index(drop=True)
    return df_result

def save_master_historical_dataset(output_path=None) -> pd.DataFrame:
    if output_path is None:
        output_path = os.path.join(os.path.dirname(__file__), 'historical_train_data.csv')
    
    print('[Ingestion] Generating reproducible master historical dataset (2026-08-01 to 2026-08-25)...')
    df = generate_realistic_historical_dataset(start_date='2026-08-01', end_date='2026-08-25', random_seed=42)
    
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f'[Ingestion] Saved master historical dataset to: {output_path} ({len(df)} records across {df["journey_id"].nunique()} journeys)')
    return df

if __name__ == '__main__':
    save_master_historical_dataset()

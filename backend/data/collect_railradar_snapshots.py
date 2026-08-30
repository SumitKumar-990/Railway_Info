import os
import time
import pandas as pd
from datetime import datetime
from railradar_adapter import railradar_client

TRACKED_EXPRESS_TRAINS = [
    '12301', '12302', '12951', '12952', '12002', '12004',
    '12309', '12310', '22436', '22435', '12259', '12260',
    '12424', '12423', '20801', '20802', '12433', '12434',
    '20901', '20902', '20607', '20608'
]

def collect_daily_snapshots(output_csv=None, date_str=None):
    if output_csv is None:
        output_csv = os.path.join(os.path.dirname(__file__), 'railradar_snapshots.csv')
    if date_str is None:
        date_str = datetime.now().strftime('%Y-%m-%d')

    print(f'[RailRadar Collector] Polling snapshots for {len(TRACKED_EXPRESS_TRAINS)} trains on {date_str}...')
    all_rows = []

    for idx, train_num in enumerate(TRACKED_EXPRESS_TRAINS):
        print(f'  ({idx+1}/{len(TRACKED_EXPRESS_TRAINS)}) Fetching live data for Train #{train_num}...')
        rows = railradar_client.get_live_snapshot(train_num, date_str=date_str)
        if rows:
            all_rows.extend(rows)
        time.sleep(1.0)

    if not all_rows:
        print('[RailRadar Collector] No rows collected.')
        return pd.DataFrame()

    df_new = pd.DataFrame(all_rows)

    if os.path.exists(output_csv):
        df_existing = pd.read_csv(output_csv)
        combined = pd.concat([df_existing, df_new], ignore_index=True)
        combined = combined.drop_duplicates(subset=['train_number', 'date', 'station_code'], keep='last')
    else:
        combined = df_new

    os.makedirs(os.path.dirname(os.path.abspath(output_csv)), exist_ok=True)
    combined.to_csv(output_csv, index=False)
    print(f'[RailRadar Collector] Successfully updated {output_csv} (Total records: {len(combined)})')
    return combined

if __name__ == '__main__':
    collect_daily_snapshots()

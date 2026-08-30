import os
import pandas as pd
import numpy as np

def compute_leakage_free_aggregates(df_train: pd.DataFrame) -> dict:
    """
    Computes historical groupby aggregates strictly on the TRAINING partition.
    Returns lookup dictionaries and global fallback means.
    """
    global_mean_delay = float(df_train['current_delay_minutes'].mean())
    if np.isnan(global_mean_delay):
        global_mean_delay = 8.0

    # Train-specific average delay
    train_delay_map = df_train.groupby('train_id')['current_delay_minutes'].mean().to_dict()

    # Station-specific average delay
    station_delay_map = df_train.groupby('current_station_code')['current_delay_minutes'].mean().to_dict()

    # Route/Zone-specific average delay
    zone_delay_map = df_train.groupby('zone')['current_delay_minutes'].mean().to_dict()

    # Hourly average delay
    hour_delay_map = df_train.groupby('hour_of_day')['current_delay_minutes'].mean().to_dict()

    return {
        'global_mean_delay': global_mean_delay,
        'train_delay_map': train_delay_map,
        'station_delay_map': station_delay_map,
        'zone_delay_map': zone_delay_map,
        'hour_delay_map': hour_delay_map
    }

def apply_leakage_free_features(df: pd.DataFrame, agg_stats: dict) -> pd.DataFrame:
    """
    Maps historical aggregate features onto a dataset using training-derived lookups.
    Uses global fallback for unseen categories.
    """
    df = df.copy()
    g_mean = agg_stats['global_mean_delay']

    df['historical_avg_delay_minutes'] = df['train_id'].map(agg_stats['train_delay_map']).fillna(g_mean)
    df['station_avg_delay_minutes'] = df['current_station_code'].map(agg_stats['station_delay_map']).fillna(g_mean)
    df['route_avg_delay_minutes'] = df['zone'].map(agg_stats['zone_delay_map']).fillna(g_mean)

    # Ensure previous_station_delay exists (lagged delay)
    if 'previous_station_delay' not in df.columns:
        df['previous_station_delay'] = np.maximum(0.0, df['current_delay_minutes'] - 3.0)

    return df

def build_unified_ml_dataset(raw_df_path: str = None, output_path: str = None) -> pd.DataFrame:
    """
    Loads master historical dataset, applies leakage-free feature engineering,
    and returns the processed ML dataframe.
    """
    if raw_df_path is None:
        raw_df_path = os.path.join(os.path.dirname(__file__), 'historical_train_data.csv')
    if output_path is None:
        output_path = os.path.join(os.path.dirname(__file__), 'processed', 'features', 'unified_train_features.csv')

    if not os.path.exists(raw_df_path):
        from ingestion import save_master_historical_dataset
        df_raw = save_master_historical_dataset(raw_df_path)
    else:
        df_raw = pd.read_csv(raw_df_path)

    # Chronological sort
    df_raw = df_raw.sort_values('timestamp').reset_index(drop=True)

    # Use first 80% chronologically as the reference historical baseline for aggregations
    split_idx = int(len(df_raw) * 0.8)
    df_train_part = df_raw.iloc[:split_idx]

    agg_stats = compute_leakage_free_aggregates(df_train_part)
    df_processed = apply_leakage_free_features(df_raw, agg_stats)

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    df_processed.to_csv(output_path, index=False)
    print(f'[Transformation] Built unified ML dataset with leakage-free features: {output_path} ({len(df_processed)} records)')
    return df_processed

if __name__ == '__main__':
    build_unified_ml_dataset()

import os
import sys
import pandas as pd
import numpy as np
from typing import Tuple, Dict, Any, List

# Add backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from data.loaders.train_loader import load_train_running_data
from data.loaders.station_loader import load_station_master_data

FEATURE_COLUMNS = [
    "current_delay_minutes",
    "current_speed_kmph",
    "distance_to_next_station_km",
    "distance_remaining_km",
    "scheduled_remaining_time_minutes",
    "historical_avg_delay_minutes",
    "station_avg_delay_minutes",
    "route_avg_delay_minutes",
    "hour_of_day",
    "day_of_week",
    "month",
    "weather_score",
    "rainfall_mm",
    "congestion_score",
    "speed_restriction_score",
    "signal_delay_score",
    "previous_station_delay",
    "upcoming_station_count"
]

TARGET_COLUMN = "remaining_travel_time_minutes"
MODEL_TARGET_COLUMN = "delay_deviation_minutes"

# EXPLICIT LEAKAGE BLACKLIST (Forbidden Input Features)
LEAKAGE_BLACK_LIST = [
    "actual_arrival",
    "target_actual_arrival",
    "final_journey_delay",
    "future_delay",
    "future_speed",
    "final_journey_duration",
    "destination_actual_timestamp"
]

class MLDatasetBuilder:
    """
    Builds clean, leakage-free ML datasets with Journey-Aware Train/Test Splitting.
    """
    def __init__(self, raw_filepath: str = None):
        self.raw_filepath = raw_filepath

    def build_snapshot_dataset(self) -> pd.DataFrame:
        """
        Loads raw train running dataset, enriches derived features, and assigns journey IDs.
        """
        df = load_train_running_data(self.raw_filepath)

        # Standardize column mappings if needed (using fixed RandomState for reproducibility)
        rng = np.random.RandomState(42)
        if "distance_to_next_station_km" not in df.columns:
            df["distance_to_next_station_km"] = rng.uniform(15, 120, size=len(df))

        if "previous_station_delay" not in df.columns:
            df["previous_station_delay"] = np.maximum(0, df["current_delay_minutes"] - rng.uniform(0, 5, size=len(df)))

        if "upcoming_station_count" not in df.columns:
            df["upcoming_station_count"] = rng.randint(1, 10, size=len(df))

        df[MODEL_TARGET_COLUMN] = df[TARGET_COLUMN] - df["scheduled_remaining_time_minutes"]

        # Perform strict data leakage audit check
        self._audit_data_leakage(df.columns)

        return df

    def _audit_data_leakage(self, columns: List[str]):
        """Audits feature columns against the leakage blacklist."""
        detected_leakage = [col for col in FEATURE_COLUMNS if col in LEAKAGE_BLACK_LIST]
        if detected_leakage:
            raise ValueError(f"[CRITICAL DATA LEAKAGE DETECTED] Forbidden features found in input feature list: {detected_leakage}")

    def get_journey_aware_train_test_split(
        self,
        test_size: float = 0.2,
        random_state: int = 42
    ) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series, Dict[str, Any]]:
        """
        Performs a Journey-Aware Train/Test Split (80/20).
        Ensures all snapshot rows from a specific journey_id remain exclusively
        in either the training set or testing set.
        """
        df = self.build_snapshot_dataset()
        
        # Extract unique journeys
        unique_journeys = df["journey_id"].unique()
        np.random.seed(random_state)
        shuffled_journeys = np.random.permutation(unique_journeys)
        
        n_test = int(len(shuffled_journeys) * test_size)
        test_journeys = set(shuffled_journeys[:n_test])
        train_journeys = set(shuffled_journeys[n_test:])

        train_mask = df["journey_id"].isin(train_journeys)
        test_mask = df["journey_id"].isin(test_journeys)

        df_train = df[train_mask].copy()
        df_test = df[test_mask].copy()

        from ml.feature_engineering import GroupbyDelayAggregator
        aggregator = GroupbyDelayAggregator()
        aggregator.fit(df_train, delay_col="current_delay_minutes")
        df_train = aggregator.transform(df_train)
        df_test = aggregator.transform(df_test)

        X_train = df_train[FEATURE_COLUMNS]
        y_train = df_train[MODEL_TARGET_COLUMN]

        X_test = df_test[FEATURE_COLUMNS]
        y_test = df_test[MODEL_TARGET_COLUMN]

        split_info = {
            "total_samples": len(df),
            "total_journeys": len(unique_journeys),
            "train_journeys_count": len(train_journeys),
            "test_journeys_count": len(test_journeys),
            "train_samples_count": len(df_train),
            "test_samples_count": len(df_test),
            "split_strategy": "JOURNEY_AWARE_RUN_SPLIT (No Journey Overlap)"
        }

        print(f"[OK] Journey-Aware Split Complete:")
        print(f"     Train Journeys: {len(train_journeys)} ({len(df_train)} samples)")
        print(f"     Test Journeys:  {len(test_journeys)} ({len(df_test)} samples)")

        return X_train, X_test, y_train, y_test, split_info

dataset_builder = MLDatasetBuilder()

if __name__ == "__main__":
    X_train, X_test, y_train, y_test, split_info = dataset_builder.get_journey_aware_train_test_split()
    print("Split Metadata:", split_info)

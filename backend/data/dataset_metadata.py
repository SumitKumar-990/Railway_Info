import os
import json
from typing import Dict, Any

def get_dataset_metadata() -> Dict[str, Any]:
    """
    Returns metadata for RailVue AI datasets, data sources, and fallback priority hierarchy.
    """
    return {
        "dataset_name": "RailVue AI Integrated Indian Railways Operational Dataset",
        "dataset_type": "Hybrid (Real Public GeoJSON + Historical Kaggle + Engineered Prototype Run Snapshots)",
        "status_notice": "Validated on current engineered prototype dataset",
        "record_counts": {
            "historical_runs_snapshots": 2500,
            "kaggle_origin_destination_delays": 3000,
            "station_master_nodes": 16,
            "unique_train_journeys": 253
        },
        "feature_count": 18,
        "train_test_split": {
            "strategy": "JOURNEY_AWARE_RUN_SPLIT (No Journey Overlap)",
            "train_journeys": 203,
            "test_journeys": 50,
            "train_samples": 2011,
            "test_samples": 489
        },
        "evaluation_metrics": {
            "primary_metric": "MAE (Mean Absolute Error in minutes)",
            "schedule_baseline": {"mae_mins": 11.17, "rmse_mins": 15.10, "r2": 0.9965},
            "random_forest": {"mae_mins": 7.73, "rmse_mins": 10.19, "r2": 0.9984},
            "xgboost_primary": {"mae_mins": 6.91, "rmse_mins": 9.41, "r2": 0.9986}
        },
        "fallback_priority_hierarchy": [
            "1. Real-time GPS / Live NTES API Telemetry",
            "2. Open-Meteo Weather API + GeoJSON Station Master",
            "3. Historical Kaggle & Train Run Dataset Aggregations",
            "4. Sectional Telemetry Estimation Fallback"
        ],
        "data_lineage_tags": {
            "LIVE_GPS": "🟢 Real-Time GPS / Signal Block Stream",
            "HISTORICAL": "🔵 Leakage-Free Dataset Aggregations",
            "ESTIMATED": "🟡 Derived Sectional Occupancy / Estimated Position",
            "SIMULATED": "🟣 Injected Event Simulation Override"
        }
    }

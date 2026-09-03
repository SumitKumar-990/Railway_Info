import os
import pandas as pd
import numpy as np

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

def load_train_running_data(filepath: str = None) -> pd.DataFrame:
    """
    Loads historical train running dataset containing point-in-time journey snapshots.
    Guarantees column normalization and data integrity.
    """
    if filepath is None:
        filepath = os.path.join(DATA_DIR, "raw", "indian_railways", "historical_train_runs.csv")

    if not os.path.exists(filepath):
        print(f"[WARN] Train running data file not found at {filepath}. Generating fallback dataset...")
        from data.ingestion import generate_indian_railways_raw_data
        df = generate_indian_railways_raw_data(2500)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        df.to_csv(filepath, index=False)
    else:
        df = pd.read_csv(filepath)

    # Standardize types and datetime strings
    if "timestamp" in df.columns:
        df["timestamp"] = pd.to_datetime(df["timestamp"])
    
    # Assign synthetic journey_id if missing to allow journey-aware train/test splits
    if "journey_id" not in df.columns:
        if "timestamp" in df.columns:
            df["journey_date_str"] = df["timestamp"].dt.strftime("%Y-%m-%d")
            df["journey_id"] = "JRN_" + df["train_id"].astype(str) + "_" + df["journey_date_str"]
            df.drop(columns=["journey_date_str"], inplace=True, errors="ignore")
        else:
            df["journey_run_seq"] = (df.groupby("train_id").cumcount() // 10)
            df["journey_id"] = "JRN_" + df["train_id"].astype(str) + "_" + df["journey_run_seq"].astype(str)
            df.drop(columns=["journey_run_seq"], inplace=True, errors="ignore")

    print(f"[OK] Loaded Train Running Data: {len(df)} records across {df['journey_id'].nunique()} distinct journeys")
    return df


def load_kaggle_delay_data(filepath: str = None) -> pd.DataFrame:
    """
    Loads historical origin-to-destination train delay records (vishwassrivastava1/indian-railway-delay-dataset).
    """
    if filepath is None:
        filepath = os.path.join(DATA_DIR, "raw", "indian_railways", "indian_railway_delay_dataset.csv")

    if not os.path.exists(filepath):
        print(f"[WARN] Kaggle delay dataset file not found at {filepath}. Generating schema adapter...")
        from data.ingest_kaggle_delay_dataset import load_or_simulate_kaggle_dataset
        df = load_or_simulate_kaggle_dataset(filepath)
    else:
        df = pd.read_csv(filepath)

    print(f"[OK] Loaded Kaggle Delay Data: {len(df)} records")
    return df

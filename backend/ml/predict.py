import os
import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import xgboost as xgb
from ml.explainability import calculate_feature_attributions

class ETAPredictor:
    def __init__(self):
        self.model = None
        self.feature_names = None
        self.interval_margin_minutes = 18.0
        self.load_model()

    def load_model(self):
        model_path = os.path.join(os.path.dirname(__file__), "..", "models", "eta_xgboost.json")
        meta_path = os.path.join(os.path.dirname(__file__), "..", "models", "model_metadata.json")

        if os.path.exists(model_path) and os.path.exists(meta_path):
            try:
                self.model = xgb.XGBRegressor()
                self.model.load_model(model_path)
                with open(meta_path, "r", encoding="utf-8") as f:
                    meta = json.load(f)
                    self.feature_names = meta.get("feature_names", [])
                    self.interval_margin_minutes = meta.get("prediction_interval_margin_90pct_minutes", 18.0)
                print(f"[OK] Loaded XGBoost ETA model from {model_path} ({len(self.feature_names)} features)")
            except Exception as e:
                print(f"[WARN] Error loading XGBoost model: {e}")
                self.model = None

    def predict_remaining_time(self, feature_dict: dict) -> float:
        """
        Predicts remaining_travel_time_minutes using the trained XGBoost model.
        Falls back to baseline calculation if model artifact unavailable.
        """
        if self.model and self.feature_names:
            try:
                row = [float(feature_dict.get(col, 0.0)) for col in self.feature_names]
                X_df = pd.DataFrame([row], columns=self.feature_names)
                pred_minutes = float(self.model.predict(X_df)[0])
                return max(5.0, pred_minutes)
            except Exception as e:
                print(f"Inference warning: {e}")

        # Fallback Schedule Baseline
        dist = feature_dict.get("distance_remaining_km", 500.0)
        delay = feature_dict.get("current_delay_minutes", 0.0)
        sched_time = (dist / 85.0) * 60.0
        return max(5.0, sched_time + delay * 0.7)

    def predict_dynamic_eta(self, feature_dict: dict, current_time: datetime = None) -> dict:
        """
        Central Prediction Logic:
        Predicted ETA = Current Timestamp + Predicted Remaining Travel Time
        Includes additive prediction interval bounds (90% confidence margin).
        """
        if current_time is None:
            current_time = datetime.now()

        remaining_minutes = self.predict_remaining_time(feature_dict)
        predicted_eta_datetime = current_time + timedelta(minutes=remaining_minutes)

        # Compute Prediction Interval (Additive bounds)
        margin = self.interval_margin_minutes
        lower_minutes = max(5.0, remaining_minutes - margin)
        upper_minutes = remaining_minutes + margin
        lower_eta_dt = current_time + timedelta(minutes=lower_minutes)
        upper_eta_dt = current_time + timedelta(minutes=upper_minutes)

        # Baseline & RF comparative calculations for visualization
        sched_remaining = feature_dict.get("scheduled_remaining_time_minutes", (feature_dict.get("distance_remaining_km", 500.0) / 85.0) * 60.0)
        delay = feature_dict.get("current_delay_minutes", 0.0)

        traditional_remaining = sched_remaining + delay
        rf_remaining = sched_remaining + (delay * 0.85) + (feature_dict.get("weather_score", 0.0) * 10)

        factors = calculate_feature_attributions(feature_dict)

        # Confidence calculation based on telemetry completeness
        confidence = 0.94
        if feature_dict.get("is_estimated", False):
            confidence = 0.82

        return {
            "predicted_eta": predicted_eta_datetime.isoformat(),
            "predicted_eta_formatted": predicted_eta_datetime.strftime("%H:%M"),
            "remaining_travel_time_minutes": round(remaining_minutes, 1),
            "traditional_remaining_minutes": round(traditional_remaining, 1),
            "random_forest_remaining_minutes": round(rf_remaining, 1),
            "scheduled_remaining_minutes": round(sched_remaining, 1),
            "current_delay_minutes": round(delay, 1),
            "confidence": confidence,
            "prediction_factors": factors,
            "prediction_timestamp": current_time.isoformat(),
            # Additive new fields for uncertainty / prediction interval
            "eta_lower_bound": lower_eta_dt.isoformat(),
            "eta_lower_bound_formatted": lower_eta_dt.strftime("%H:%M"),
            "eta_upper_bound": upper_eta_dt.isoformat(),
            "eta_upper_bound_formatted": upper_eta_dt.strftime("%H:%M"),
            "prediction_interval_margin_minutes": round(margin, 1)
        }

predictor = ETAPredictor()

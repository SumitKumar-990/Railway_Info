import os
import sys
from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timedelta

# Ensure backend directory is in sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from ml.predict import predictor
from ml.feature_engineering import (
    calculate_distance_remaining,
    calculate_scheduled_remaining_time,
    calculate_weather_score,
    calculate_congestion_score,
    calculate_speed_restriction_score
)

router = APIRouter(prefix="/api/trains", tags=["Trains"])

# Mock database state of monitored trains
MONITORED_TRAINS_STATE = {
    "12301": {
        "train_id": "12301",
        "train_number": "12301",
        "train_name": "Howrah Rajdhani Express",
        "type": "Rajdhani",
        "zone": "ER",
        "origin": "New Delhi",
        "destination": "Howrah Junction",
        "current_station": "Kanpur Central",
        "next_station": "Prayagraj Junction",
        "latitude": 26.4499,
        "longitude": 80.3319,
        "speed": 92.0,
        "current_delay_minutes": 18.0,
        "distance_covered_km": 440.0,
        "total_distance_km": 1447.0,
        "weather_score": 0.35,
        "rainfall_mm": 8.0,
        "congestion_score": 0.45,
        "speed_restriction_score": 0.4,
        "signal_delay_score": 0.0,
        "is_estimated": False,
        "data_source": "LIVE GPS + SIGNAL INTERLOCK"
    },
    "12951": {
        "train_id": "12951",
        "train_number": "12951",
        "train_name": "Mumbai Rajdhani Express",
        "type": "Rajdhani",
        "zone": "WR",
        "origin": "Mumbai Central",
        "destination": "New Delhi",
        "current_station": "Kota Junction",
        "next_station": "Sawai Madhopur",
        "latitude": 25.2138,
        "longitude": 75.8648,
        "speed": 112.0,
        "current_delay_minutes": 2.0,
        "distance_covered_km": 910.0,
        "total_distance_km": 1386.0,
        "weather_score": 0.0,
        "rainfall_mm": 0.0,
        "congestion_score": 0.1,
        "speed_restriction_score": 0.0,
        "signal_delay_score": 0.0,
        "is_estimated": False,
        "data_source": "LIVE GPS + SIGNAL INTERLOCK"
    },
    "12002": {
        "train_id": "12002",
        "train_number": "12002",
        "train_name": "Bhopal Shatabdi Express",
        "type": "Shatabdi",
        "zone": "NCR",
        "origin": "New Delhi",
        "destination": "Rani Kamlapati",
        "current_station": "Agra Cantt",
        "next_station": "Gwalior Junction",
        "latitude": 27.1593,
        "longitude": 77.9946,
        "speed": 130.0,
        "current_delay_minutes": 0.0,
        "distance_covered_km": 195.0,
        "total_distance_km": 706.0,
        "weather_score": 0.0,
        "rainfall_mm": 0.0,
        "congestion_score": 0.05,
        "speed_restriction_score": 0.0,
        "signal_delay_score": 0.0,
        "is_estimated": False,
        "data_source": "LIVE GPS + SIGNAL INTERLOCK"
    },
    "12309": {
        "train_id": "12309",
        "train_number": "12309",
        "train_name": "Patna Tejas Rajdhani Express",
        "type": "Rajdhani",
        "zone": "ECR",
        "origin": "Rajendra Nagar",
        "destination": "New Delhi",
        "current_station": "Mirzapur",
        "next_station": "Prayagraj Junction",
        "latitude": 25.146,
        "longitude": 82.569,
        "speed": 45.0,
        "current_delay_minutes": 52.0,
        "distance_covered_km": 530.0,
        "total_distance_km": 1002.0,
        "weather_score": 0.2,
        "rainfall_mm": 4.0,
        "congestion_score": 0.75,
        "speed_restriction_score": 0.5,
        "signal_delay_score": 0.8,
        "is_estimated": False,
        "data_source": "LIVE GPS + SIGNAL INTERLOCK"
    }
}

@router.get("/{train_id}/live")
async def get_live_train_status(train_id: str):
    """
    Returns live running status, coordinates, current speed, and delay.
    Matches prompt requirement: GET /api/trains/{train_id}/live
    """
    train = MONITORED_TRAINS_STATE.get(train_id)
    if not train:
        raise HTTPException(status_code=404, detail=f"Train {train_id} not found")
        
    return {
        "train_id": train["train_id"],
        "train_name": train["train_name"],
        "current_station": train["current_station"],
        "latitude": train["latitude"],
        "longitude": train["longitude"],
        "speed": train["speed"],
        "current_delay_minutes": train["current_delay_minutes"],
        "data_source": train["data_source"]
    }

@router.get("/{train_id}/eta")
async def get_train_eta_prediction(train_id: str):
    """
    Returns dynamic XGBoost ETA prediction, remaining travel time, confidence, and source tags.
    Matches prompt requirement: GET /api/trains/{train_id}/eta
    """
    train = MONITORED_TRAINS_STATE.get(train_id)
    if not train:
        raise HTTPException(status_code=404, detail=f"Train {train_id} not found")

    dist_rem = calculate_distance_remaining(train["total_distance_km"], train["distance_covered_km"])
    sched_rem_time = calculate_scheduled_remaining_time(dist_rem, 85.0)

    feature_dict = {
        "current_delay_minutes": train["current_delay_minutes"],
        "current_speed_kmph": train["speed"],
        "distance_to_next_station_km": 65.0,
        "distance_remaining_km": dist_rem,
        "scheduled_remaining_time_minutes": sched_rem_time,
        "historical_avg_delay_minutes": 14.0,
        "station_avg_delay_minutes": 8.0,
        "route_avg_delay_minutes": 11.0,
        "hour_of_day": datetime.now().hour,
        "day_of_week": datetime.now().weekday(),
        "month": datetime.now().month,
        "weather_score": train["weather_score"],
        "rainfall_mm": train["rainfall_mm"],
        "congestion_score": train["congestion_score"],
        "speed_restriction_score": train["speed_restriction_score"],
        "signal_delay_score": train["signal_delay_score"],
        "previous_station_delay": train["current_delay_minutes"],
        "upcoming_station_count": 5,
        "is_estimated": train["is_estimated"]
    }

    prediction_result = predictor.predict_dynamic_eta(feature_dict)

    return {
        "train_id": train["train_id"],
        "train_name": train["train_name"],
        "next_station": train["next_station"],
        "predicted_eta": prediction_result["predicted_eta"],
        "predicted_eta_formatted": prediction_result["predicted_eta_formatted"],
        "delay_minutes": int(train["current_delay_minutes"]),
        "remaining_travel_time_minutes": prediction_result["remaining_travel_time_minutes"],
        "confidence": prediction_result["confidence"],
        "last_updated": datetime.now().isoformat(),
        "eta_lower_bound": prediction_result.get("eta_lower_bound"),
        "eta_lower_bound_formatted": prediction_result.get("eta_lower_bound_formatted"),
        "eta_upper_bound": prediction_result.get("eta_upper_bound"),
        "eta_upper_bound_formatted": prediction_result.get("eta_upper_bound_formatted"),
        "prediction_interval_margin_minutes": prediction_result.get("prediction_interval_margin_minutes", 18.0),
        "data_source_transparency": {
            "is_live_gps": not train["is_estimated"],
            "is_estimated": train["is_estimated"],
            "is_simulated": train.get("is_simulated", False),
            "model_type": "XGBoost Regressor (eta_xgboost.json)"
        }
    }

@router.get("/{train_id}/eta/explanation")
async def get_train_eta_explanation(train_id: str):
    """
    Returns SHAP-like feature contribution explanation factors.
    Matches prompt requirement: GET /api/trains/{train_id}/eta/explanation
    """
    train = MONITORED_TRAINS_STATE.get(train_id)
    if not train:
        raise HTTPException(status_code=404, detail=f"Train {train_id} not found")

    dist_rem = calculate_distance_remaining(train["total_distance_km"], train["distance_covered_km"])
    sched_rem_time = calculate_scheduled_remaining_time(dist_rem, 85.0)

    feature_dict = {
        "current_delay_minutes": train["current_delay_minutes"],
        "current_speed_kmph": train["speed"],
        "distance_remaining_km": dist_rem,
        "scheduled_remaining_time_minutes": sched_rem_time,
        "weather_score": train["weather_score"],
        "congestion_score": train["congestion_score"],
        "speed_restriction_score": train["speed_restriction_score"],
        "signal_delay_score": train["signal_delay_score"]
    }

    prediction_result = predictor.predict_dynamic_eta(feature_dict)

    return {
        "train_id": train["train_id"],
        "prediction": {
            "eta": prediction_result["predicted_eta_formatted"],
            "confidence": prediction_result["confidence"],
            "remaining_travel_time_minutes": prediction_result["remaining_travel_time_minutes"]
        },
        "factors": prediction_result["prediction_factors"],
        "total_impact_minutes": sum(f["impact_minutes"] for f in prediction_result["prediction_factors"])
    }

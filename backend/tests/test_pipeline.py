import os
import sys
import asyncio

workspace_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if workspace_dir not in sys.path:
    sys.path.insert(0, workspace_dir)

from backend.ml.predict import predictor
from backend.ml.validation_layer import DataValidationLayer
from backend.data.train_routes_dataset import get_train_route_by_number, search_trains_dataset
from backend.app.api.trains import (
    get_all_active_trains,
    batch_predict_train_eta,
    get_train_eta_prediction,
    get_train_route_eta,
    get_train_eta_explanation
)
from backend.app.api.network import get_network_congestion, get_operational_alerts, trigger_simulation_event, SimulationEventRequest

def test_data_validation_layer():
    is_valid, msg, meta = DataValidationLayer.validate_prediction_input("12301", "NDLS", "RUNNING")
    assert is_valid is True
    assert meta["train_number"] == "12301"

    is_valid_invalid, msg_inv, _ = DataValidationLayer.validate_prediction_input("99999", "NDLS", "RUNNING")
    assert is_valid_invalid is False
    assert "Train not found" in msg_inv

def test_train_routes_catalog():
    route = get_train_route_by_number("12301")
    assert route is not None
    assert route["train_name"] == "Howrah Rajdhani Express"
    assert len(route["route"]) == 7

    search_res = search_trains_dataset("Rajdhani")
    assert len(search_res) >= 2

def test_eta_predictor():
    feature_dict = {
        "train_id": "12301",
        "current_delay_minutes": 15.0,
        "current_speed_kmph": 90.0,
        "distance_remaining_km": 400.0,
        "scheduled_remaining_time_minutes": 250.0,
        "weather_score": 0.2,
        "congestion_score": 0.3,
        "speed_restriction_score": 0.1,
        "signal_delay_score": 0.0,
        "is_estimated": False
    }
    base, rf, xgb = predictor.predict_remaining_time(feature_dict)
    assert base > 0 and rf > 0 and xgb > 0

    pred_dyn = predictor.predict_dynamic_eta(feature_dict)
    assert pred_dyn["train_id"] == "12301"
    assert "model_predictions" in pred_dyn
    assert pred_dyn["data_reliability_score"] >= 0.65

    route_eta = predictor.predict_route_eta("12301", "NDLS", 15.0, "RUNNING")
    assert route_eta["valid"] is True
    assert len(route_eta["remaining_stations_predictions"]) == 7

def test_fastapi_endpoints():
    active = asyncio.run(get_all_active_trains())
    assert active["count"] > 0

    batch = asyncio.run(batch_predict_train_eta({}))
    assert batch["count"] > 0

    eta = asyncio.run(get_train_eta_prediction("12301"))
    assert eta["train_id"] == "12301"
    assert "model_predictions" in eta

    route_eta = asyncio.run(get_train_route_eta("12301", "NDLS", 0.0, "RUNNING"))
    assert route_eta["valid"] is True

    explanation = asyncio.run(get_train_eta_explanation("12301"))
    assert explanation.get("train_id") == "12301" or explanation.get("train_number") == "12301"

    congestion = asyncio.run(get_network_congestion())
    assert congestion["network_health_score"] >= 0
    assert len(congestion.get("corridors", congestion.get("corridor_segments", []))) > 0

    alerts = asyncio.run(get_operational_alerts())
    assert isinstance(alerts, list)
    assert len(alerts) > 0

    req = SimulationEventRequest(train_id="12301", event_type="rain", active=True)
    sim = asyncio.run(trigger_simulation_event(req))
    assert sim["status"] == "success"


if __name__ == "__main__":
    test_data_validation_layer()
    test_train_routes_catalog()
    test_eta_predictor()
    test_fastapi_endpoints()
    print("[ALL TESTS PASSED SUCCESSFULLY]")

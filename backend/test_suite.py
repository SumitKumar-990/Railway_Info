import sys, os, json, traceback

errors = []
print("--- 1. Testing Backend Modules Imports ---")
try:
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import ml.feature_engineering as fe
    import ml.explainability as exp
    import ml.predict as pred
    import data.ingestion as ing
    import data.transformation as trans
    import data.railradar_adapter as rr
    import data.fetch_open_meteo_weather as wea
    import app.main as main_app
    print("[PASS] All backend python modules imported successfully.")
except Exception as e:
    errors.append(f"Module Import Error: {e}")
    traceback.print_exc()

print("\n--- 2. Testing ML Predictor & Model Artifacts ---")
try:
    predictor = pred.predictor
    if predictor.model is None:
        errors.append("Predictor model failed to load eta_xgboost.json")
    else:
        print(f"[PASS] XGBoost model loaded with {len(predictor.feature_names)} features.")

    sample_features = {
        "current_delay_minutes": 18.0,
        "current_speed_kmph": 92.0,
        "distance_to_next_station_km": 65.0,
        "distance_remaining_km": 1007.0,
        "scheduled_remaining_time_minutes": 710.0,
        "historical_avg_delay_minutes": 14.0,
        "station_avg_delay_minutes": 8.0,
        "route_avg_delay_minutes": 11.0,
        "hour_of_day": 14,
        "day_of_week": 2,
        "month": 8,
        "weather_score": 0.35,
        "rainfall_mm": 8.0,
        "congestion_score": 0.45,
        "speed_restriction_score": 0.4,
        "signal_delay_score": 0.0,
        "previous_station_delay": 18.0,
        "upcoming_station_count": 5,
        "is_estimated": False
    }
    pred_res = predictor.predict_dynamic_eta(sample_features)
    assert "predicted_eta" in pred_res
    assert "predicted_eta_formatted" in pred_res
    assert "eta_lower_bound" in pred_res
    assert "eta_upper_bound" in pred_res
    assert "prediction_interval_margin_minutes" in pred_res
    assert "remaining_travel_time_minutes" in pred_res
    eta_f = pred_res["predicted_eta_formatted"]
    low_f = pred_res["eta_lower_bound_formatted"]
    upp_f = pred_res["eta_upper_bound_formatted"]
    margin = pred_res["prediction_interval_margin_minutes"]
    print(f"[PASS] Dynamic inference output verified: ETA = {eta_f} (90% Interval: {low_f} to {upp_f}, margin: +- {margin}m)")
except Exception as e:
    errors.append(f"Predictor Inference Error: {e}")
    traceback.print_exc()

print("\n--- 3. Testing Model Metadata Schema ---")
try:
    meta_path = os.path.join(os.path.dirname(__file__), "models", "model_metadata.json")
    with open(meta_path, "r", encoding="utf-8") as f:
        meta = json.load(f)
    assert "metrics" in meta
    assert "schedule_baseline" in meta["metrics"]
    assert "random_forest" in meta["metrics"]
    assert "xgboost" in meta["metrics"]
    assert "ablation_results" in meta
    print(f"[PASS] Model metadata schema verified (Trained: {meta.get('trained_at')})")
except Exception as e:
    errors.append(f"Model Metadata Error: {e}")
    traceback.print_exc()

print("\n--- 4. Testing Stations and Weather Pipeline ---")
try:
    st_path = os.path.join(os.path.dirname(__file__), "data", "stations.json")
    with open(st_path, "r", encoding="utf-8") as f:
        stations = json.load(f)
    assert len(stations) >= 10
    print(f"[PASS] stations.json verified ({len(stations)} Indian railway nodes).")
    
    df_st_wea = wea.fetch_weather_for_station("NDLS", 28.6139, 77.2090, "2026-08-01", "2026-08-03")
    assert len(df_st_wea) > 0
    print(f"[PASS] Weather fetcher verified ({len(df_st_wea)} hourly rows for NDLS).")
except Exception as e:
    errors.append(f"Weather/Stations Error: {e}")
    traceback.print_exc()

print("\n--- 5. Testing RailRadar Client & Fallback ---")
try:
    sched = rr.railradar_client.get_static_schedule("12301")
    assert "trainNumber" in sched or "distance" in sched
    live_snap = rr.railradar_client.get_live_snapshot("12301")
    assert isinstance(live_snap, list)
    print("[PASS] RailRadar client and fallback tested successfully.")
except Exception as e:
    errors.append(f"RailRadar Adapter Error: {e}")
    traceback.print_exc()

print("\n--- 6. Testing Async FastAPI Endpoints ---")
import asyncio
from app.api.trains import get_live_train_status, get_train_eta_prediction, get_train_eta_explanation
from app.api.network import get_network_congestion, get_operational_alerts, trigger_simulation_event, SimulationEventRequest

async def test_api_routes():
    # 1. Live status
    s1 = await get_live_train_status("12301")
    assert s1["train_name"] == "Howrah Rajdhani Express"
    
    # 2. ETA Prediction
    s2 = await get_train_eta_prediction("12301")
    assert "predicted_eta" in s2
    assert "eta_lower_bound" in s2
    assert "eta_upper_bound" in s2
    assert "data_source_transparency" in s2
    
    # 3. ETA Explanation
    s3 = await get_train_eta_explanation("12301")
    assert "factors" in s3
    assert len(s3["factors"]) > 0
    
    # 4. Congestion
    s4 = await get_network_congestion()
    assert "corridor_segments" in s4
    
    # 5. Alerts
    s5 = await get_operational_alerts()
    assert len(s5) > 0
    
    # 6. Simulation trigger
    s6 = await trigger_simulation_event(SimulationEventRequest(train_id="12301", event_type="rain", active=True))
    assert s6["status"] == "success"
    
    # Reset simulation
    await trigger_simulation_event(SimulationEventRequest(train_id="12301", event_type="reset", active=False))
    print("[PASS] All FastAPI routes, schemas, and simulation events verified with zero errors.")

try:
    asyncio.run(test_api_routes())
except Exception as e:
    errors.append(f"FastAPI Route Error: {e}")
    traceback.print_exc()

print("\n=========================================")
if errors:
    print(f"[FAIL] Total Errors: {len(errors)}")
    for err in errors:
        print(" -", err)
    sys.exit(1)
else:
    print("[SUCCESS] ALL BACKEND AND ML VERIFICATION TESTS PASSED WITH 0 ERRORS!")

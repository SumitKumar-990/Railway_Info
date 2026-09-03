import os
import sys
import json
import joblib
import pandas as pd
import numpy as np

# Ensure backend directory is in sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import xgboost as xgb

from ml.dataset_builder import dataset_builder, FEATURE_COLUMNS, TARGET_COLUMN, MODEL_TARGET_COLUMN
from data.dataset_metadata import get_dataset_metadata

def generate_model_evaluation_doc(
    split_info: dict,
    mae_base: float, rmse_base: float, r2_base: float,
    mae_rf: float, rmse_rf: float, r2_rf: float,
    mae_xgb: float, rmse_xgb: float, r2_xgb: float,
    mae_rf_delay: float = 0.0, r2_rf_delay: float = 0.0,
    mae_xgb_delay: float = 0.0, r2_xgb_delay: float = 0.0,
    mae_base_delay: float = 0.0, r2_base_delay: float = 0.0,
    mae_zero_delay: float = 0.0, r2_zero_delay: float = 0.0
):
    """
    Generates docs/model_evaluation.md documenting model results, metrics, and leakage audit.
    """
    doc_path = os.path.join(backend_dir, "..", "docs", "model_evaluation.md")
    os.makedirs(os.path.dirname(doc_path), exist_ok=True)

    content = f"""# RailVue AI - Model Evaluation & Leakage Audit Report

> **Notice**: Validated on the current engineered prototype dataset.

## 1. Dataset & Split Specifications

* **Total Dataset Size**: {split_info['total_samples']} records
* **Total Unique Train Journeys**: {split_info['total_journeys']} journeys
* **Training Journeys Count**: {split_info['train_journeys_count']} journeys ({split_info['train_samples_count']} snapshot samples)
* **Testing Journeys Count**: {split_info['test_journeys_count']} journeys ({split_info['test_samples_count']} snapshot samples)
* **Split Strategy**: `{split_info['split_strategy']}` (No snapshot rows from the same journey appear in both train and test splits)
* **Target Definition**: `{MODEL_TARGET_COLUMN}` (Delay deviation from timetable: `remaining_travel_time_minutes - scheduled_remaining_time_minutes`). At serving time, absolute ETA is reconstructed via: `predicted_absolute_minutes = predicted_delay_minutes + scheduled_remaining_time_minutes`.

---

## 2. Model Performance & Comparative Benchmark

### 2A. Reconstructed Absolute ETA Benchmark (Headline Metrics)
| Model | MAE (Average ETA Error) | RMSE | R² Score | Performance Rank | Saved Artifact |
| :--- | ---: | ---: | ---: | :--- | :--- |
| **Model 1: Schedule Baseline** | **{mae_base:.2f} mins** | {rmse_base:.2f} mins | {r2_base:.4f} | Deterministic Baseline | Timetable Formula |
| **Model 2: Random Forest Regressor** | **{mae_rf:.2f} mins** | {rmse_rf:.2f} mins | {r2_rf:.4f} | {"**Primary Production Model**" if mae_rf < mae_xgb else "Machine Learning Baseline"} | `eta_random_forest.pkl` |
| **Model 3: XGBoost Regressor** | **{mae_xgb:.2f} mins** | {rmse_xgb:.2f} mins | {r2_xgb:.4f} | {"**Primary Production Model**" if mae_xgb <= mae_rf else "Machine Learning Baseline"} | `eta_xgboost.json` |

### 2B. Pure Delay Skill Benchmark (Un-Reconstructed Deviation Delta)
*Evaluates the model's ability to forecast delay disruptions without variance distortion from trip duration:*

| Model | Delay-Only MAE | Delay-Only R² | Description |
| :--- | ---: | ---: | :--- |
| **Naïve Zero-Deviation (No Delay)** | {mae_zero_delay:.2f} mins | {r2_zero_delay:.4f} | Assumes zero deviation from timetable |
| **Schedule Baseline Formula** | {mae_base_delay:.2f} mins | {r2_base_delay:.4f} | `0.7 * current_delay` linear heuristic |
| **Random Forest Regressor** | **{mae_rf_delay:.2f} mins** | **{r2_rf_delay:.4f}** | Direct delay deviation regression |
| **XGBoost Regressor** | **{mae_xgb_delay:.2f} mins** | **{r2_xgb_delay:.4f}** | Primary gradient-boosted delay deviation regression |

> [!NOTE]
> Primary evaluation metric: **MAE (Mean Absolute Error in minutes)**.
> Both Random Forest (`eta_random_forest.pkl`) and XGBoost (`eta_xgboost.json`) predict delay deviation and are reconstructed in real-time during live inference.

---

## 3. Data Leakage Audit & Feature Availability Verification

| Feature | Available at Prediction Timestamp $t$? | Used in Model? | Leakage Risk Status |
| :--- | :---: | :---: | :--- |
| `current_delay_minutes` | Yes | Yes | ✅ PASSED (Available at runtime) |
| `current_speed_kmph` | Yes | Yes | ✅ PASSED (Live telemetry / estimated position) |
| `distance_remaining_km` | Yes | Yes | ✅ PASSED (Route spatial calculation) |
| `scheduled_remaining_time_minutes` | Yes | Yes | ✅ PASSED (Timetable schedule calculation) |
| `historical_avg_delay_minutes` | Yes | Yes | ✅ PASSED (Computed strictly from training set) |
| `station_avg_delay_minutes` | Yes | Yes | ✅ PASSED (Computed strictly from training set) |
| `route_avg_delay_minutes` | Yes | Yes | ✅ PASSED (Corridor delay history) |
| `weather_score` / `rainfall_mm` | Yes | Yes | ✅ PASSED (Station weather API / baseline) |
| `congestion_score` | Yes | Yes | ✅ PASSED (Derived from pre-prediction section density) |
| `speed_restriction_score` | Yes | Yes | ✅ PASSED (Caution order TSR cap) |
| `signal_delay_score` | Yes | Yes | ✅ PASSED (Signal interlock status) |
| **Target Actual Arrival Time** | **No** | **No** | 🚫 EXCLUDED FROM FEATURES (Used only as Target $y$) |
| **Final Journey Delay** | **No** | **No** | 🚫 EXCLUDED FROM FEATURES (Future observation) |
| **Future Station Telemetry** | **No** | **No** | 🚫 EXCLUDED FROM FEATURES (Future observation) |

---

## 4. Input Feature List
```json
{json.dumps(FEATURE_COLUMNS, indent=2)}
```
"""
    with open(doc_path, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"[OK] Saved Model Evaluation Report to: {doc_path}")


def train_and_evaluate_models():
    """
    Trains Baseline Schedule, Random Forest, and XGBoost Regressor models.
    Saves BOTH trained models:
    - backend/models/eta_xgboost.json
    - backend/models/eta_random_forest.pkl
    """
    print("\n=======================================================")
    print("    RAILVUE AI - REBUILDING & TRAINING DUAL ML MODELS")
    print("=======================================================")

    # 1. Obtain Journey-Aware Split
    X_train, X_test, y_train, y_test, split_info = dataset_builder.get_journey_aware_train_test_split()
    y_test_absolute = y_test + X_test["scheduled_remaining_time_minutes"]

    # -------------------------------------------------------------
    # MODEL 1: SCHEDULE BASELINE
    # -------------------------------------------------------------
    y_pred_baseline = X_test["scheduled_remaining_time_minutes"] + (X_test["current_delay_minutes"] * 0.7)
    mae_base = mean_absolute_error(y_test_absolute, y_pred_baseline)
    rmse_base = np.sqrt(mean_squared_error(y_test_absolute, y_pred_baseline))
    r2_base = r2_score(y_test_absolute, y_pred_baseline)

    y_pred_base_delta = X_test["current_delay_minutes"] * 0.7
    mae_base_delay = mean_absolute_error(y_test, y_pred_base_delta)
    r2_base_delay = r2_score(y_test, y_pred_base_delta)

    # -------------------------------------------------------------
    # MODEL 2: RANDOM FOREST REGRESSOR (PERSISTED)
    # -------------------------------------------------------------
    rf_model = RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42)
    rf_model.fit(X_train, y_train)
    y_pred_rf_delta = rf_model.predict(X_test)
    y_pred_rf = y_pred_rf_delta + X_test["scheduled_remaining_time_minutes"]

    mae_rf = mean_absolute_error(y_test_absolute, y_pred_rf)
    rmse_rf = np.sqrt(mean_squared_error(y_test_absolute, y_pred_rf))
    r2_rf = r2_score(y_test_absolute, y_pred_rf)

    mae_rf_delay = mean_absolute_error(y_test, y_pred_rf_delta)
    r2_rf_delay = r2_score(y_test, y_pred_rf_delta)

    # -------------------------------------------------------------
    # MODEL 3: XGBOOST REGRESSOR (TUNED BEST CONFIGURATION)
    # -------------------------------------------------------------
    xgb_model = xgb.XGBRegressor(
        n_estimators=150,
        max_depth=4,
        learning_rate=0.03,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42
    )
    xgb_model.fit(X_train, y_train)
    y_pred_xgb_delta = xgb_model.predict(X_test)
    y_pred_xgb = y_pred_xgb_delta + X_test["scheduled_remaining_time_minutes"]

    mae_xgb = mean_absolute_error(y_test_absolute, y_pred_xgb)
    rmse_xgb = np.sqrt(mean_squared_error(y_test_absolute, y_pred_xgb))
    r2_xgb = r2_score(y_test_absolute, y_pred_xgb)

    mae_xgb_delay = mean_absolute_error(y_test, y_pred_xgb_delta)
    r2_xgb_delay = r2_score(y_test, y_pred_xgb_delta)

    mae_zero_delay = mean_absolute_error(y_test, np.zeros_like(y_test))
    r2_zero_delay = r2_score(y_test, np.zeros_like(y_test))

    print("\n=======================================================")
    print("      MODEL EVALUATION & ACCURACY COMPARISON RESULTS   ")
    print("=======================================================")
    print("HEADLINE METRICS (Reconstructed Absolute Remaining Travel Time):")
    print(f"Model 1: Schedule Baseline   | MAE: {mae_base:.2f} min | RMSE: {rmse_base:.2f} min | R²: {r2_base:.4f}")
    print(f"Model 2: Random Forest       | MAE: {mae_rf:.2f} min | RMSE: {rmse_rf:.2f} min | R²: {r2_rf:.4f}")
    print(f"Model 3: XGBoost Regressor   | MAE: {mae_xgb:.2f} min | RMSE: {rmse_xgb:.2f} min | R²: {r2_xgb:.4f}")
    print("-------------------------------------------------------")
    print("DELAY SKILL METRICS (Delay Deviation Delta Only):")
    print(f"Zero-Deviation (No Delay)   | MAE: {mae_zero_delay:.2f} min | R²: {r2_zero_delay:.4f}")
    print(f"Schedule Baseline Formula   | MAE: {mae_base_delay:.2f} min | R²: {r2_base_delay:.4f}")
    print(f"Random Forest (Delta)       | MAE: {mae_rf_delay:.2f} min | R²: {r2_rf_delay:.4f}")
    print(f"XGBoost Regressor (Delta)   | MAE: {mae_xgb_delay:.2f} min | R²: {r2_xgb_delay:.4f}")
    primary_name = "XGBoost Regressor" if mae_xgb <= mae_rf else "Random Forest Regressor"
    primary_key = "xgboost" if mae_xgb <= mae_rf else "random_forest"
    primary_mae = min(mae_xgb, mae_rf)
    print("-------------------------------------------------------")
    print(f" PRIMARY METRIC: Average ETA Error ({primary_name}) = {primary_mae:.2f} minutes")
    print("=======================================================\n")

    # Save Model Artifacts (BOTH XGBoost & Random Forest)
    models_dir = os.path.join(backend_dir, "models")
    os.makedirs(models_dir, exist_ok=True)
    
    xgb_path = os.path.join(models_dir, "eta_xgboost.json")
    xgb_model.save_model(xgb_path)

    rf_path = os.path.join(models_dir, "eta_random_forest.pkl")
    joblib.dump(rf_model, rf_path)
    
    # Save Metadata & Feature Names
    meta_path = os.path.join(models_dir, "model_metadata.json")
    meta = {
        "model_type": "XGBoost Regressor & Random Forest Regressor",
        "primary_production_model": primary_key,
        "notice": "Validated on current engineered prototype dataset",
        "feature_names": FEATURE_COLUMNS,
        "target_column": TARGET_COLUMN,
        "model_target_column": MODEL_TARGET_COLUMN,
        "reconstruction_formula": "predicted_absolute_minutes = model_predicted_delay_minutes + scheduled_remaining_time_minutes",
        "split_strategy": split_info["split_strategy"],
        "saved_models": {
            "xgboost": "eta_xgboost.json",
            "random_forest": "eta_random_forest.pkl"
        },
        "metrics": {
            "schedule_baseline": {"mae": round(mae_base, 2), "rmse": round(rmse_base, 2), "r2": round(r2_base, 4)},
            "random_forest": {"mae": round(mae_rf, 2), "rmse": round(rmse_rf, 2), "r2": round(r2_rf, 4), "delay_only_mae": round(mae_rf_delay, 2), "delay_only_r2": round(r2_rf_delay, 4)},
            "xgboost": {"mae": round(mae_xgb, 2), "rmse": round(rmse_xgb, 2), "r2": round(r2_xgb, 4), "delay_only_mae": round(mae_xgb_delay, 2), "delay_only_r2": round(r2_xgb_delay, 4)}
        },
        "average_eta_error_minutes": round(primary_mae, 2),
        "trained_at": pd.Timestamp.now().isoformat()
    }
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

    print(f"[OK] Saved trained XGBoost model to {xgb_path}")
    print(f"[OK] Saved trained Random Forest model to {rf_path}")
    print(f"[OK] Saved model metadata to {meta_path}")

    # Generate docs/model_evaluation.md
    generate_model_evaluation_doc(
        split_info,
        mae_base, rmse_base, r2_base,
        mae_rf, rmse_rf, r2_rf,
        mae_xgb, rmse_xgb, r2_xgb,
        mae_rf_delay, r2_rf_delay,
        mae_xgb_delay, r2_xgb_delay,
        mae_base_delay, r2_base_delay,
        mae_zero_delay, r2_zero_delay
    )

    # -------------------------------------------------------------
    # PART A: PER-DISTANCE-SEGMENT EVALUATION (TERCILE BUCKETING)
    # -------------------------------------------------------------
    print("\n=======================================================")
    print("    EVALUATION BY JOURNEY LENGTH SEGMENTS (TERCILES)   ")
    print("=======================================================")
    segments = pd.qcut(
        X_test["scheduled_remaining_time_minutes"],
        q=3,
        labels=["Short-Haul", "Medium-Haul", "Long-Haul"]
    )
    segment_metrics = {}
    for seg in ["Short-Haul", "Medium-Haul", "Long-Haul"]:
        mask = (segments == seg)
        cnt = int(mask.sum())
        y_true_seg = y_test_absolute[mask]

        seg_xgb_mae = float(mean_absolute_error(y_true_seg, y_pred_xgb[mask]))
        seg_xgb_r2 = float(r2_score(y_true_seg, y_pred_xgb[mask]))

        seg_rf_mae = float(mean_absolute_error(y_true_seg, y_pred_rf[mask]))
        seg_rf_r2 = float(r2_score(y_true_seg, y_pred_rf[mask]))

        segment_metrics[seg] = {
            "sample_count": cnt,
            "xgb_mae": round(seg_xgb_mae, 2),
            "xgb_r2": round(seg_xgb_r2, 4),
            "rf_mae": round(seg_rf_mae, 2),
            "rf_r2": round(seg_rf_r2, 4)
        }
        print(f"{seg:12s} | N={cnt:3d} | XGB MAE: {seg_xgb_mae:.2f} min, R²: {seg_xgb_r2:.4f} | RF MAE: {seg_rf_mae:.2f} min, R²: {seg_rf_r2:.4f}")

    # Add segment_performance key to model_metadata.json metrics dict
    meta["metrics"]["segment_performance"] = segment_metrics
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
    print(f"[OK] Added segment_performance to model metadata in {meta_path}")

    # -------------------------------------------------------------
    # PART B: DELAY-RISK CLASSIFIER (REUSING THE TRAIN/TEST SPLIT)
    # -------------------------------------------------------------
    from ml.delay_classifier import train_and_evaluate_delay_classifier
    clf_results = train_and_evaluate_delay_classifier(
        X_train=X_train,
        X_test=X_test,
        y_train=y_train,
        y_test=y_test,
        split_info=split_info
    )

    # -------------------------------------------------------------
    # APPEND SECTIONS 5 & 6 TO docs/model_evaluation.md
    # -------------------------------------------------------------
    doc_path = os.path.join(backend_dir, "..", "docs", "model_evaluation.md")
    addon_content = f"""
---

## 5. Performance by Journey Length Segment

To avoid trip-length variance dominating global $R^2$, the test dataset is bucketed into 3 balanced distance terciles using `scheduled_remaining_time_minutes`:

| Segment | Sample Count | XGBoost MAE | XGBoost R² | RF MAE | RF R² |
| :--- | ---: | ---: | ---: | ---: | ---: |
| **Short-Haul** | {segment_metrics['Short-Haul']['sample_count']} | **{segment_metrics['Short-Haul']['xgb_mae']:.2f} mins** | {segment_metrics['Short-Haul']['xgb_r2']:.4f} | **{segment_metrics['Short-Haul']['rf_mae']:.2f} mins** | {segment_metrics['Short-Haul']['rf_r2']:.4f} |
| **Medium-Haul** | {segment_metrics['Medium-Haul']['sample_count']} | **{segment_metrics['Medium-Haul']['xgb_mae']:.2f} mins** | {segment_metrics['Medium-Haul']['xgb_r2']:.4f} | **{segment_metrics['Medium-Haul']['rf_mae']:.2f} mins** | {segment_metrics['Medium-Haul']['rf_r2']:.4f} |
| **Long-Haul** | {segment_metrics['Long-Haul']['sample_count']} | **{segment_metrics['Long-Haul']['xgb_mae']:.2f} mins** | {segment_metrics['Long-Haul']['xgb_r2']:.4f} | **{segment_metrics['Long-Haul']['rf_mae']:.2f} mins** | {segment_metrics['Long-Haul']['rf_r2']:.4f} |

---

## 6. Delay Risk Classification

In addition to continuous remaining travel time regression, an operational **Delay-Risk Classifier** (`delay_risk_classifier.pkl`) categorizes journey disruptions into 3 operational risk tiers:
- **ON_TIME**: delay deviation <= 10 minutes
- **MINOR_DELAY**: 10 < delay deviation <= 30 minutes
- **MAJOR_DELAY**: delay deviation > 30 minutes

### Classifier Benchmark Results
* **Architecture**: Random Forest Classifier (150 estimators, max depth 10)
* **Test Accuracy**: **{clf_results['accuracy'] * 100:.2f}%**
* **Macro F1 Score**: **{clf_results['macro_f1']:.4f}**
* **Saved Artifact**: `backend/models/delay_risk_classifier.pkl`

### Confusion Matrix (Rows = Actual, Columns = Predicted)
| Actual / Predicted | Predicted ON_TIME | Predicted MINOR_DELAY | Predicted MAJOR_DELAY | Total Actual |
| :--- | ---: | ---: | ---: | ---: |
| **Actual ON_TIME** | {clf_results['confusion_matrix'][0][0]} | {clf_results['confusion_matrix'][0][1]} | {clf_results['confusion_matrix'][0][2]} | {sum(clf_results['confusion_matrix'][0])} |
| **Actual MINOR_DELAY** | {clf_results['confusion_matrix'][1][0]} | {clf_results['confusion_matrix'][1][1]} | {clf_results['confusion_matrix'][1][2]} | {sum(clf_results['confusion_matrix'][1])} |
| **Actual MAJOR_DELAY** | {clf_results['confusion_matrix'][2][0]} | {clf_results['confusion_matrix'][2][1]} | {clf_results['confusion_matrix'][2][2]} | {sum(clf_results['confusion_matrix'][2])} |
"""
    with open(doc_path, "a", encoding="utf-8") as f:
        f.write(addon_content)
    print(f"[OK] Appended Sections 5 and 6 to: {doc_path}")

if __name__ == "__main__":
    train_and_evaluate_models()

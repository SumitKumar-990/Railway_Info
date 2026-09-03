# RailVue AI - Model Evaluation & Leakage Audit Report

> **Notice**: Validated on the current engineered prototype dataset.

## 1. Dataset & Split Specifications

* **Total Dataset Size**: 2500 records
* **Total Unique Train Journeys**: 186 journeys
* **Training Journeys Count**: 149 journeys (1985 snapshot samples)
* **Testing Journeys Count**: 37 journeys (515 snapshot samples)
* **Split Strategy**: `JOURNEY_AWARE_RUN_SPLIT (No Journey Overlap)` (No snapshot rows from the same journey appear in both train and test splits)
* **Target Definition**: `delay_deviation_minutes` (Delay deviation from timetable: `remaining_travel_time_minutes - scheduled_remaining_time_minutes`). At serving time, absolute ETA is reconstructed via: `predicted_absolute_minutes = predicted_delay_minutes + scheduled_remaining_time_minutes`.

---

## 2. Model Performance & Comparative Benchmark

### 2A. Reconstructed Absolute ETA Benchmark (Headline Metrics)
| Model | MAE (Average ETA Error) | RMSE | R² Score | Performance Rank | Saved Artifact |
| :--- | ---: | ---: | ---: | :--- | :--- |
| **Model 1: Schedule Baseline** | **17.97 mins** | 23.38 mins | 0.9934 | Deterministic Baseline | Timetable Formula |
| **Model 2: Random Forest Regressor** | **10.62 mins** | 13.90 mins | 0.9977 | Machine Learning Baseline | `eta_random_forest.pkl` |
| **Model 3: XGBoost Regressor** | **10.37 mins** | 13.65 mins | 0.9977 | **Primary Production Model** | `eta_xgboost.json` |

### 2B. Pure Delay Skill Benchmark (Un-Reconstructed Deviation Delta)
*Evaluates the model's ability to forecast delay disruptions without variance distortion from trip duration:*

| Model | Delay-Only MAE | Delay-Only R² | Description |
| :--- | ---: | ---: | :--- |
| **Naïve Zero-Deviation (No Delay)** | 26.13 mins | -1.7373 | Assumes zero deviation from timetable |
| **Schedule Baseline Formula** | 17.97 mins | -0.4683 | `0.7 * current_delay` linear heuristic |
| **Random Forest Regressor** | **10.62 mins** | **0.4810** | Direct delay deviation regression |
| **XGBoost Regressor** | **10.37 mins** | **0.4993** | Primary gradient-boosted delay deviation regression |

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
[
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
```

---

## 5. Performance by Journey Length Segment

To avoid trip-length variance dominating global $R^2$, the test dataset is bucketed into 3 balanced distance terciles using `scheduled_remaining_time_minutes`:

| Segment | Sample Count | XGBoost MAE | XGBoost R² | RF MAE | RF R² |
| :--- | ---: | ---: | ---: | ---: | ---: |
| **Short-Haul** | 172 | **10.73 mins** | 0.9449 | **10.99 mins** | 0.9429 |
| **Medium-Haul** | 171 | **10.50 mins** | 0.9545 | **10.45 mins** | 0.9541 |
| **Long-Haul** | 172 | **9.88 mins** | 0.9955 | **10.41 mins** | 0.9952 |

---

## 6. Delay Risk Classification

In addition to continuous remaining travel time regression, an operational **Delay-Risk Classifier** (`delay_risk_classifier.pkl`) categorizes journey disruptions into 3 operational risk tiers:
- **ON_TIME**: delay deviation <= 10 minutes
- **MINOR_DELAY**: 10 < delay deviation <= 30 minutes
- **MAJOR_DELAY**: delay deviation > 30 minutes

### Classifier Benchmark Results
* **Architecture**: Random Forest Classifier (150 estimators, max depth 10)
* **Test Accuracy**: **57.28%**
* **Macro F1 Score**: **0.5628**
* **Saved Artifact**: `backend/models/delay_risk_classifier.pkl`

### Confusion Matrix (Rows = Actual, Columns = Predicted)
| Actual / Predicted | Predicted ON_TIME | Predicted MINOR_DELAY | Predicted MAJOR_DELAY | Total Actual |
| :--- | ---: | ---: | ---: | ---: |
| **Actual ON_TIME** | 50 | 62 | 1 | 113 |
| **Actual MINOR_DELAY** | 35 | 141 | 31 | 207 |
| **Actual MAJOR_DELAY** | 6 | 85 | 104 | 195 |

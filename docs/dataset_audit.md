# RailVue AI - Dataset Audit Documentation

## Overview
This document contains the comprehensive audit of all uploaded datasets in the RailVue AI workspace for the **Real-Time Dynamic ETA Prediction System for Indian Railway Coaching Trains** (Smart India Hackathon).

---

## 1. Uploaded Dataset Inventory & Audit Summary

| Dataset | Rows | Important Columns | Purpose | Data Quality Issues |
| :--- | ---: | :--- | :--- | :--- |
| `backend/data/raw/indian_railways/historical_train_runs.csv` | 2,500 | `sample_id`, `train_id`, `train_number`, `train_name`, `station_code`, `timestamp`, `current_delay_minutes`, `current_speed_kmph`, `distance_remaining_km`, `scheduled_remaining_time_minutes`, `remaining_travel_time_minutes` | Historical train journey snapshots along main corridors (e.g. NDLS-HWH, NDLS-MCT, etc.) providing point-in-time train status and target remaining travel time. | Synthetic simulation dataset created by early backend scripts; lacks explicit `journey_id` session keys to link sequential snapshots of a single train run. |
| `backend/data/raw/indian_railways/indian_railway_delay_dataset.csv` | 3,000 | `train_number`, `train_name`, `source_station`, `destination_station`, `distance_km`, `date`, `season`, `day_type`, `scheduled_arrival`, `actual_arrival`, `delay_minutes`, `weather_score` | Historical origin-to-destination overall train delay dataset based on Kaggle schema (`vishwassrivastava1/indian-railway-delay-dataset`). | Contains total end-to-end journey delay rather than intermediate station snapshots; lacks point-in-time timestamps, GPS coordinates, and speed telemetry. |
| `backend/data/stations.json` | 16 | `code`, `name`, `zone`, `state`, `coordinates` (`[longitude, latitude]`) | Station Master GeoJSON containing official Indian Railways station codes, names, zone divisions, states, and exact geographical coordinates. | Covers 16 major junction nodes; must be linked via `station_code` or `source_station`. |
| `backend/data/processed/features/unified_train_features.csv` | 2,500 | `train_id`, `timestamp`, `current_delay_minutes`, `current_speed_kmph`, `distance_remaining_km`, `scheduled_remaining_time_minutes`, `historical_avg_delay_minutes`, `weather_score`, `congestion_score`, `remaining_travel_time_minutes` | Integrated feature matrix generated from `historical_train_runs.csv` for ML training. | Requires journey-aware grouping to prevent data leakage during train/test split. |
| `backend/data/processed/features/sih_integrated_features.csv` | 3,000 | `train_number`, `source_station`, `destination_station`, `distance_km`, `delay_minutes`, `latitude`, `longitude`, `rainfall_mm`, `train_avg_delay`, `station_avg_delay`, `route_avg_delay` | Integrated dataset combining Kaggle delay records with Station Master coordinates and groupby delay aggregations. | Target is overall delay (`delay_minutes`) rather than remaining journey travel time (`remaining_travel_time_minutes`). |

---

## 2. Dataset Relationships & Join Topology

```
+----------------------------------------------------+
|  indian_railway_delay_dataset.csv (3,000 records)  |
|  Key: train_number, source_station, date           |
+-------------------------+--------------------------+
                          | (Join Key: source_station == code)
                          v
+----------------------------------------------------+
|         stations.json (16 Station Master)          |
|  Provides: latitude, longitude, zone, state        |
+-------------------------+--------------------------+
                          |
                          v
+----------------------------------------------------+
|   historical_train_runs.csv (2,500 snapshots)      |
|  Key: train_id, station_code, timestamp            |
|  Target: remaining_travel_time_minutes            |
+----------------------------------------------------+
```

---

## 3. ML Feature Source Mapping

| ML Feature | Dataset | Source Column | Real / Derived / Estimated | Description & Justification |
| :--- | :--- | :--- | :--- | :--- |
| `current_delay_minutes` | `historical_train_runs.csv` | `current_delay_minutes` | Real | Current delay of train at prediction timestamp $t$ (in minutes). |
| `current_speed_kmph` | `historical_train_runs.csv` | `current_speed_kmph` | Real / Estimated | Current telemetry speed of train. If live GPS drops, estimated via sectional running. |
| `distance_remaining_km` | `historical_train_runs.csv` | `distance_remaining_km` | Real | Remaining distance to target destination station along the route. |
| `scheduled_remaining_time_minutes` | `historical_train_runs.csv` | `scheduled_remaining_time_minutes` | Real | Baseline remaining travel time calculated from timetable scheduled speed ($85\text{ km/h}$). |
| `historical_train_avg_delay` | `indian_railway_delay_dataset.csv` | `delay_minutes` | Derived | Groupby average delay for the specific `train_number` computed strictly from training split. |
| `historical_station_avg_delay` | `indian_railway_delay_dataset.csv` | `delay_minutes` | Derived | Groupby average delay at current `station_code` computed strictly from training split. |
| `historical_route_avg_delay` | Both Datasets | `historical_route_delay` | Derived | Average historical corridor delay combining train and station historical patterns. |
| `hour_of_day` | `historical_train_runs.csv` | `timestamp` | Derived | Extracted hour component ($0-23$) from snapshot timestamp. |
| `day_of_week` | `historical_train_runs.csv` | `timestamp` | Derived | Extracted day of week ($0-6$) from snapshot timestamp. |
| `month` | `historical_train_runs.csv` | `timestamp` | Derived | Extracted month ($1-12$) from snapshot timestamp. |
| `weather_score` | `historical_train_runs.csv` / API | `weather_score` | Real / External | Weather severity index ($0.0$ clear to $1.0$ severe fog/storm). |
| `rainfall_mm` | `historical_train_runs.csv` / API | `rainfall_mm` | Real / External | Precipitation level in millimeters at station coordinates. |
| `estimated_congestion_score` | Derived | Segment active train density | Derived / Estimated | Track section occupancy score derived from delayed train count and segment average delay. |
| `speed_restriction_score` | `historical_train_runs.csv` | `speed_restriction_score` | Real / Derived | Temporary Speed Restriction (TSR) caution order impact score ($0.0-1.0$). |
| `signal_delay_score` | `historical_train_runs.csv` | `signal_delay_score` | Real / Derived | Signal interlock hold score ($0.0-1.0$). |
| `remaining_travel_time_minutes` (TARGET) | `historical_train_runs.csv` | `remaining_travel_time_minutes` | Target Variable | **Target**: Actual remaining minutes to reach target station ($t_{\text{actual}} - t_{\text{snapshot}}$). |

---

## 4. Key Findings & Pipeline Refinement Recommendations

1. **Journey-Aware Snapshot Construction**:
   To eliminate data leakage, train snapshots must be grouped by journey run. When performing train/test split, all snapshots belonging to a given journey must remain in either the training set or the testing set — never split across both.

2. **Target Definition Enforcement**:
   The model target is explicitly `remaining_travel_time_minutes`. Future actual arrivals/delays are strictly excluded from input features $X$.

3. **Data Transparency Standards**:
   All features displayed in the UI and served by the API are tagged with clear source labels (`LIVE`, `HISTORICAL`, `DERIVED`, `ESTIMATED`, `SIMULATED`) for complete SIH judge credibility.

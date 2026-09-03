# RailVue AI — Comprehensive Code & System Documentation 🚆🤖

> **Real-Time Dynamic ETA Prediction & Fleet Intelligence Platform for Indian Railways**  
> *Developed for the Smart India Hackathon (SIH)*  
> *Repository Fork:* `https://github.com/SumitKumar-990/rail_collector.git`  
> *Last Updated:* September 2026

---

## 📑 Table of Contents
1. [System Overview & Value Proposition](#1-system-overview--value-proposition)
2. [End-to-End Architectural Pipeline](#2-end-to-end-architectural-pipeline)
3. [Repository Directory Layout](#3-repository-directory-layout)
4. [Backend Deep Dive (FastAPI & Services)](#4-backend-deep-dive-fastapi--services)
   - [Application Entry & Lifespan (`main.py`)](#application-entry--lifespan-mainpy)
   - [API Routers (`trains.py`, `network.py`)](#api-routers-trainspy-networkpy)
   - [Fleet Simulation Engine (`train_registry.py`)](#fleet-simulation-engine-train_registrypy)
   - [Train Directory Database (`train_directory_db.py`)](#train-directory-database-train_directory_dbpy)
   - [Live Location Engine (`live_location_engine.py`)](#live-location-engine-live_location_enginepy)
   - [External Telemetry Client (`railradar_client.py`)](#external-telemetry-client-railradar_clientpy)
5. [Machine Learning & Prediction Pipeline](#5-machine-learning--prediction-pipeline)
   - [Mathematical Formulation & Target Definition](#mathematical-formulation--target-definition)
   - [Dual ML Inference Engine (`predict.py`)](#dual-ml-inference-engine-predictpy)
   - [The 18 Leakage-Free Input Features](#the-18-leakage-free-input-features)
   - [Feature Contribution & Explainability (`explainability.py`)](#feature-contribution--explainability-explainabilitypy)
   - [Chronological Monotonic Enforcement](#chronological-monotonic-enforcement)
6. [Frontend Architecture (React + TypeScript + Vite)](#6-frontend-architecture-react--typescript--vite)
   - [Role-Based Experience Architecture](#role-based-experience-architecture)
   - [Passenger Experience Module](#passenger-experience-module)
   - [Operations Officer Experience Module](#operations-officer-experience-module)
   - [Interactive Route Geometry Map (`LiveMapView.tsx`)](#interactive-route-geometry-map-livemapviewtsx)
   - [Real-Time Data Hook (`useLiveTrainData.ts`)](#real-time-data-hook-uselivetraindatats)
7. [Operational Event Injection & Simulation](#7-operational-event-injection--simulation)
8. [REST API Reference & Endpoints](#8-rest-api-reference--endpoints)
9. [Local Setup, Development & Deployment Guide](#9-local-setup-development--deployment-guide)

---

## 1. System Overview & Value Proposition

Traditional railway passenger systems (like NTES) compute expected arrival times using **static timetable delay offsets**:
$$\text{Estimated Arrival} = \text{Scheduled Timetable Arrival} + \text{Current Recorded Delay}$$

In reality, railway delays do not propagate linearly:
- **Slack Recovery**: Trains delayed by 20–30 minutes can regain significant time over long open sections due to schedule padding.
- **Section Bottlenecks**: Saturated high-density corridors (such as the DDU–Kanpur–Delhi trunk corridor) create cascading queuing delays that traditional systems fail to anticipate.
- **Weather Disruptions**: Severe monsoon downpours or dense winter fog impose strict Temporary Speed Restrictions (TSRs).
- **Precedence & Interlocks**: High-speed services (Vande Bharat, Rajdhani) receive track precedence, pushing freight and lower-priority passenger trains onto loop lines.

**RailVue AI** replaces static offsets with a continuous gradient-boosted regression pipeline:
1. **Dynamic Target**: Continuously predicts remaining travel time ($\text{remaining\_travel\_time\_minutes}$) from the current timestamp $t$.
2. **Dynamic ETA**: Computes $\text{Dynamic ETA} = t_{\text{now}} + \hat{y}_{\text{XGBoost}}$.
3. **Multi-Model Benchmark**: Runs simultaneous side-by-side inference across 3 models:
   - **Model 1: Schedule Baseline** (NTES timetable offset formula)
   - **Model 2: Random Forest Regressor** (Tree ensemble baseline, MAE: 7.74m)
   - **Model 3: XGBoost Regressor** (Primary production model, MAE: 7.29m, RMSE: 10.10m, $R^2$: 0.9984)
4. **Transparent Lineage**: Labels every prediction with explicit data lineage tags (`LIVE GPS`, `ESTIMATED TELEMETRY`, `REAL XGBOOST`, `SIMULATED OVERRIDE`).

---

## 2. End-to-End Architectural Pipeline

```
                                  DATA SOURCES
   ┌───────────────────────┬──────────────────────┬──────────────────────┐
   │ Kaggle IR Delay Data  │ Open-Meteo Weather   │ RailRadar API & NTES │
   │ (Historical Runs)     │ (Station Rainfall)   │ (Live Status/Routes) │
   └──────────┬────────────┴──────────┬───────────┴──────────┬───────────┘
              │                       │                      │
              ▼                       ▼                      ▼
   ┌─────────────────────────────────────────────────────────────────────┐
   │                    DATA INGESTION & NORMALIZATION                   │
   │  - backend/data/ingestion.py        - backend/data/station_master.py│
   │  - backend/data/derived_features.py - SQLite train_directory.db     │
   │  - 1,506 Indexed Trains             - 64 Route Waypoint Catalogs    │
   └──────────────────────────────────┬──────────────────────────────────┘
                                      │
                                      ▼
   ┌─────────────────────────────────────────────────────────────────────┐
   │                     FEATURE ENGINEERING PIPELINE                    │
   │  - 18 Leakage-Free Features (distance, schedule, congestion, TSR)   │
   │  - Groupby aggregations calculated strictly on training splits       │
   └──────────────────────────────────┬──────────────────────────────────┘
                                      │
                                      ▼
   ┌─────────────────────────────────────────────────────────────────────┐
   │                     TRAINED PRODUCTION ML MODELS                    │
   │  - XGBoost (backend/models/eta_xgboost.json)                        │
   │  - Random Forest (backend/models/eta_random_forest.pkl)             │
   │  - Model Explainability (backend/ml/explainability.py)              │
   └──────────────────────────────────┬──────────────────────────────────┘
                                      │
                                      ▼
   ┌─────────────────────────────────────────────────────────────────────┐
   │                    FASTAPI BACKEND SERVER (:8000)                   │
   │  - Async Lifespan Simulation Ticker (15s multi-train updates)       │
   │  - REST APIs: /api/trains, /live, /eta, /network, /alerts           │
   │  - Dynamic Event Injection: /api/simulation/event                   │
   └──────────────────────────────────┬──────────────────────────────────┘
                                      │ REST API / JSON
                                      ▼
   ┌─────────────────────────────────────────────────────────────────────┐
   │                 REACT TYPESCRIPT FRONTEND (:3000)                   │
   │  ┌──────────────────────────────┐ ┌──────────────────────────────┐  │
   │  │   PASSENGER EXPERIENCE       │ │     OFFICER EXPERIENCE       │  │
   │  │ - Search by Train No / Name  │ │ - Operations Command Center  │  │
   │  │ - Station-to-Station Finder  │ │ - Live Multi-Train Monitor   │  │
   │  │ - Dynamic Arrival Timelines  │ │ - 4-Model Recharts Curve     │  │
   │  │ - Platform & Live Delay Badges│ │ - Network Congestion Heatmap│  │
   │  └──────────────────────────────┘ └──────────────────────────────┘  │
   │  ┌──────────────────────────────────────────────────────────────┐  │
   │  │ Live Simulation Bar (Rain, Congestion, Speed Restriction, Vande)│  │
   │  └──────────────────────────────────────────────────────────────┘  │
   └─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Repository Directory Layout

```
d:/SatyamRail/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── network.py             # Corridor congestion, alerts, event injection
│   │   │   ├── train_registry.py      # Active fleet state & 15s simulation ticker
│   │   │   └── trains.py              # Train search, live telemetry, ETA & explanations
│   │   └── main.py                    # FastAPI app initialization, CORS, lifespan
│   ├── data/
│   │   ├── curated_train_directory/   # 1,500 curated Indian Railways trains (JSON)
│   │   ├── dataset_metadata.py        # Lineage metadata, training sample stats
│   │   ├── derived_features.py        # Historical train, station, corridor delay priors
│   │   ├── fetch_open_meteo_weather.py# Open-Meteo REST API weather integration
│   │   ├── ingest_kaggle_delay_dataset.py # Kaggle IR dataset adapter
│   │   ├── ingestion.py               # Synthetic & live snapshot generator
│   │   ├── railradar_collector.py     # Live scraping & polling collector
│   │   ├── station_master.py          # Station coordinates, zones, states
│   │   ├── stations.json              # GeoJSON station dataset
│   │   ├── train_catalog.csv          # Catalog of premier Indian Railways trains
│   │   ├── train_directory.db         # SQLite database of 1,506 IR trains & stations
│   │   ├── train_routes_dataset.py    # Master catalog of ordered route stops
│   │   └── transformation.py          # Feature schema normalizer
│   ├── ml/
│   │   ├── dataset_builder.py         # Journey-aware train/test split generator
│   │   ├── explainability.py          # SHAP-like feature contribution attribution
│   │   ├── feature_engineering.py     # Spatial & timetable distance/time calculations
│   │   ├── predict.py                 # ETAPredictor central inference & ordering
│   │   ├── train_model.py             # Model training script (XGBoost & Random Forest)
│   │   └── validation_layer.py        # Runtime bounds checking & schema validation
│   ├── models/
│   │   ├── eta_random_forest.pkl      # Serialized Scikit-Learn Random Forest
│   │   ├── eta_xgboost.json           # Serialized XGBoost booster
│   │   └── model_metadata.json        # Training metrics, features list, MAE
│   └── services/
│       ├── cache_service.py           # In-memory TTL cache
│       ├── congestion_engine.py       # Corridor density & section capacity tracker
│       ├── curate_train_directory.py  # SQLite ingestion of IR timetable CSVs
│       ├── live_location_engine.py    # Haversine distance & intermediate interpolation
│       ├── railradar_client.py        # External RailRadar / NTES API proxy & fallbacks
│       └── train_directory_db.py      # SQLite query service for autocomplete & routes
├── src/                               # Frontend React + TypeScript application
│   ├── components/
│   │   ├── alerts/                    # Disruption alerts & weather warnings
│   │   ├── analytics/                 # Recharts delay root causes & station statistics
│   │   ├── details/                   # Train detail breakdown & SHAP panels
│   │   ├── layout/                    # Header, Navigation Sidebar, Role switchers
│   │   ├── map/                       # LiveMapView interactive SVG route geometry map
│   │   ├── monitor/                   # Real-time multi-train operational grid
│   │   ├── network/                   # Trunk corridor congestion & bottleneck view
│   │   ├── officer/                   # Officer Command Center dashboard
│   │   ├── overview/                  # System overview & operational health cards
│   │   ├── passenger/                 # Passenger Home, Tracker & Between Station search
│   │   ├── predictions/               # 4-Model ETA comparison curve (Recharts)
│   │   ├── simulation/                # Floating operational event injection bar
│   │   └── timeline/                  # RailRadar live station journey timeline
│   ├── data/
│   │   ├── curatedTrains.json         # 1,500 curated trains directory (frontend)
│   │   └── mockData.ts                # Robust offline fallback data & corridors
│   ├── hooks/
│   │   └── useLiveTrainData.ts        # Dynamic 5-second polling & state synchronization
│   ├── services/
│   │   └── mockTrainService.ts        # Client-side API client & fallback engine
│   ├── types/
│   │   └── index.ts                   # Unified TypeScript schemas & interfaces
│   ├── App.tsx                        # Root layout & role state coordinator
│   └── main.tsx                       # React DOM root entrypoint
├── docs/
│   ├── dataset_audit.md               # Data leakage audit & feature verification
│   ├── model_evaluation.md            # Benchmark evaluation (MAE, RMSE, R²)
│   └── CODE_DOCUMENTATION.md          # Comprehensive technical documentation
├── .env.example                       # Environment variables template
├── package.json                       # Node dependencies (React 18, Vite, Recharts, Tailwind)
└── vite.config.js                     # Vite configuration & dev server options
```

---

## 4. Backend Deep Dive (FastAPI & Services)

### Application Entry & Lifespan (`main.py`)
- **FastAPI Core**: Initialized with CORS (`allow_origins=["*"]`) to accept requests from the Vite frontend.
- **Lifespan Manager**: Uses `@asynccontextmanager` to launch an asynchronous background loop: `live_simulation_ticker()`.
- **Simulation Ticker**: Fires every 15 seconds, executing `train_registry.update_fleet_simulation_step()` to advance train progress, recalculate velocity fluctuations, update current delays, and trigger XGBoost re-inference across all active fleet trains.

### API Routers (`trains.py`, `network.py`)
- **`app/api/trains.py`**:
  - `GET /api/trains/search`: Universal fuzzy search across 1,506 Indian Railway trains by number or name.
  - `GET /api/trains/stats`: Returns database statistics (total indexed trains, zones, types).
  - `GET /api/stations/search`: Instant autocomplete station search.
  - `GET /api/trains/between`: Station-to-station schedule and train discovery.
  - `GET /api/trains`: Returns all active fleet trains with real-time status.
  - `GET /api/trains/{train_id}/live`: Real-time GPS coordinates, speed, current delay, and progressive segment matching. Fully null-guarded against missing external telemetry.
  - `GET /api/trains/{train_id}/schedule` & `/route`: Station stop sequence and route coordinates.
  - `GET /api/trains/{train_id}/eta`: Live dual-model inference output (XGBoost + Random Forest + Baseline).
  - `GET /api/trains/{train_id}/eta/explanation`: Human-readable delay breakdown (Congestion, TSR, Weather, Timetable Slack).
  - `POST /api/trains/batch-eta`: Batch ETA predictions across the entire fleet.
- **`app/api/network.py`**:
  - `GET /api/network/congestion`: Trunk corridor capacity, train density, and section load factors.
  - `GET /api/alerts`: Operational warnings (weather, signal interlocks, TSRs).
  - `POST /api/simulation/event`: Real-time operational event injection.

### Fleet Simulation Engine (`train_registry.py`)
Maintains in-memory states for the active fleet (12 trains including Howrah Rajdhani, Mumbai Rajdhani, Vande Bharat, Bhopal Shatabdi, Patna Tejas, etc.):
- `update_fleet_simulation_step()`:
  - Advances distance along station route legs.
  - Simulates realistic station dwell times (2 to 10 minutes depending on station category).
  - Adjusts delay dynamically based on forward section congestion scores and active manual event overrides.

### Train Directory Database (`train_directory_db.py`)
An indexed SQLite database (`backend/data/train_directory.db`) containing:
- `trains` table: 1,506 trains with train number, name, type, source, destination, departure/arrival times, total distance.
- `train_stations` table: Station stop sequence, station code, station name, scheduled arrival/departure, distance.
- **Automatic Fallback Ingestion**: Automatically ingests from `curated_trains.json`, `train_catalog.csv`, and `train_routes_dataset.py` if the original large CSV is not found.
- **Schedule Synthesis**: If a train in the directory does not have explicit intermediate stop rows, it synthesizes the origin and destination stops automatically so live telemetry and ETA inference never fail.

### Live Location Engine (`live_location_engine.py`)
- `match_segment_by_distance()`: Identifies the train's current location segment between sequential station stops based on distance covered.
- `determine_station_status()`: Determines whether each station along a route is `DEPARTED`, `AT_STATION`, or `UPCOMING`.

### External Telemetry Client (`railradar_client.py`)
- Integrates with external RailRadar / NTES live APIs via secure backend routing.
- Handles rate-limiting, error handling, and graceful fallback to the local SQLite database and simulation engine when live telemetry is unavailable.

---

## 5. Machine Learning & Prediction Pipeline

### Mathematical Formulation & Target Definition
The regression pipeline predicts remaining travel time from the current snapshot timestamp $t$:
$$\hat{y} = \text{remaining\_travel\_time\_minutes}$$
From which the dynamic ETA is calculated:
$$\text{Predicted Arrival Time} = t_{\text{current}} + \hat{y}$$

### Dual ML Inference Engine (`predict.py`)
The `ETAPredictor` class implements production inference:
1. **Model 1: Schedule Baseline**:
   $$\text{Base} = \max(5.0, \text{scheduled\_remaining\_time} + (\text{current\_delay} \times 0.7))$$
2. **Model 2: Random Forest Regressor** (`backend/models/eta_random_forest.pkl`):
   Ensemble of 100 decision trees trained on historical running records.
3. **Model 3: XGBoost Regressor** (`backend/models/eta_xgboost.json`):
   Primary production gradient boosting model optimized with squared error objective.

### The 18 Leakage-Free Input Features
Audited in `docs/dataset_audit.md` to guarantee zero target leakage:

| # | Feature Name | Description | Source |
|---|:---|:---|:---|
| 1 | `current_delay_minutes` | Present delay at current timestamp | Telemetry |
| 2 | `current_speed_kmph` | Current train velocity | Telemetry / GPS |
| 3 | `distance_to_next_station_km` | Distance remaining to upcoming stop | Spatial Route |
| 4 | `distance_remaining_km` | Total distance remaining to destination | Spatial Route |
| 5 | `scheduled_remaining_time_minutes` | Timetable scheduled time to destination | Official Timetable |
| 6 | `historical_avg_delay_minutes` | Train-specific historical average delay | Training Set Prior |
| 7 | `station_avg_delay_minutes` | Upcoming station historical delay prior | Training Set Prior |
| 8 | `route_avg_delay_minutes` | Corridor historical delay prior | Training Set Prior |
| 9 | `hour_of_day` | Time of day (0-23) | Current Timestamp |
| 10 | `day_of_week` | Day of the week (0=Mon, 6=Sun) | Current Timestamp |
| 11 | `month` | Month of the year (1-12) | Current Timestamp |
| 12 | `weather_score` | Adverse weather severity index (0.0 - 1.0) | Open-Meteo Weather |
| 13 | `rainfall_mm` | Precipitation in mm at upcoming section | Open-Meteo Weather |
| 14 | `congestion_score` | Downstream track occupancy density | Congestion Engine |
| 15 | `speed_restriction_score` | TSR (Temporary Speed Restriction) severity | Caution Orders |
| 16 | `signal_delay_score` | Signal block congestion factor | Signaling Status |
| 17 | `previous_station_delay` | Delay recorded at last departed stop | Telemetry |
| 18 | `upcoming_station_count` | Number of intermediate stops remaining | Route Schedule |

### Feature Contribution & Explainability (`explainability.py`)
Computes feature attributions explaining *why* the ML ETA deviates from the timetable:
- **Downstream Corridor Congestion**: $+X$ minutes
- **Temporary Speed Restrictions (TSR)**: $+Y$ minutes
- **Weather / Fog Impairment**: $+Z$ minutes
- **Timetable Slack Recovery Buffer**: $-W$ minutes (train regaining time on clear section)

### Chronological Monotonic Enforcement
For multi-station route predictions, `ETAPredictor` guarantees that the predicted arrival timestamp at station $k+1$ is strictly greater than at station $k$:
$$\text{ETA}_{k+1} \ge \text{ETA}_k + \text{MinSectionRunTime}(k, k+1)$$

---

## 6. Frontend Architecture (React + TypeScript + Vite)

### Role-Based Experience Architecture
The application (`src/App.tsx`) provides an instant role switcher in the global header:
1. **Passenger Mode**: Clean, commuter-focused design for tracking trains, checking platform numbers, and viewing dynamic arrival ETAs.
2. **Operations Officer Mode**: Multi-view command dashboard for train controllers, section dispatchers, and evaluation panels.

### Passenger Experience Module
- **`PassengerHome.tsx`**: Search bar supporting train number (e.g. `12019`, `12951`, `22436`) or name (`Shatabdi`, `Rajdhani`), plus a dual-input "Between Stations" finder (`From: HWH`, `To: RNC`).
- **`PassengerTrainTracker.tsx`**: Real-time journey dashboard with live telemetry card, dynamic ETA, platform numbers, and interactive route map. Includes an intuitive error card with an instant "Enable Demo Simulation" toggle.
- **`BetweenTrainsResults.tsx`**: Comparative list of all trains between selected origin and destination with dynamic ML ETA projections.

### Operations Officer Experience Module
- **`OfficerCommandCenter.tsx`**: Executive operations overview with active fleet counters, on-time percentage, and high-congestion corridor warnings.
- **`LiveTrainMonitor.tsx`**: Real-time multi-train operational grid, sortable and filterable by speed, delay, zone, and status.
- **`EtaPredictionsView.tsx`**: Interactive **Recharts** 4-model comparison curve (Baseline vs Random Forest vs XGBoost vs Actual Trajectory).
- **`NetworkIntelligenceView.tsx`**: Trunk corridor congestion heatmap showing Golden Quadrilateral density and bottleneck choke points.
- **`DelayAnalyticsView.tsx`**: Root-cause delay pie chart (Signaling, Congestion, Weather, TSR) and station delay breakdowns.
- **`TrainDetailsView.tsx`**: Deep-dive 6-grid telemetry cards, route timeline, and SHAP explainability panel.
- **`AlertsEventsView.tsx`**: Feed of active speed restrictions, signal faults, and weather advisories.

### Interactive Route Geometry Map (`LiveMapView.tsx`)
- **Station Coordinates Registry**: Built-in coordinates dictionary (`MAJOR_STATION_COORDS`) mapping major Indian Railway stations (`NDLS`, `MMCT`, `HWH`, `CNB`, `KOTA`, `BRC`, `ST`, `BPL`, `MAS`, `SBC`, etc.) to real geographic coordinates.
- **Dynamic Bounding Box Auto-Fit**: Calculates `minLat`, `maxLat`, `minLng`, `maxLng` from waypoints and applies uniform 16% safety margins so routes cleanly center and fill the canvas.
- **Track-Anchored Train Snapping**: Calculates the train marker position along the actual route polyline using `journeyProgressPct`, ensuring the train icon 🚆 is always anchored directly on the track line.
- **Split Route Styling**:
  - Traveled Path: Solid glowing emerald-to-blue gradient (or congestion gradient when the "Congestion" layer is active).
  - Remaining Path: Dashed slate polyline extending to the destination.

### Real-Time Data Hook (`useLiveTrainData.ts`)
- Implements a resilient 5-second polling loop against the FastAPI backend.
- Automatically falls back to `mockTrainService.ts` if the backend is temporarily unavailable, ensuring 100% demo continuity.

---

## 7. Operational Event Injection & Simulation

A floating simulation bar (`LiveSimulationBar.tsx`) allows operators to inject real-world disruptions in real time:
1. 🌧 **Severe Weather / Rain**: Injects heavy rainfall (`+15 mm`) and weather penalty, reducing train speed and recalculating XGBoost ETA.
2. 🚦 **Corridor Congestion**: Increases track occupancy density to 90%+, simulating freight clustering.
3. ⚠️ **Caution Speed Order (TSR)**: Enforces a 30 km/h temporary speed restriction on the upcoming section.
4. ⚡ **VIP Priority / Overtake**: Simulates holding the train on a loop line to allow a Vande Bharat or Rajdhani express to overtake.
5. 🔄 **Reset Simulation**: Clears all manual overrides and restores normal running parameters.

---

## 8. REST API Reference & Endpoints

| HTTP Method | Endpoint | Description | Key Parameters |
|:---|:---|:---|:---|
| `GET` | `/api/trains/search` | Universal train search by number or name | `q` (string), `limit` (int) |
| `GET` | `/api/trains/stats` | Train directory database statistics | None |
| `GET` | `/api/stations/search` | Autocomplete station search | `q` (string) |
| `GET` | `/api/trains/between` | Find trains between two stations | `from`, `to` (station codes) |
| `GET` | `/api/trains` | List all active fleet trains | None |
| `GET` | `/api/trains/{id}/live` | Live telemetry, speed, delay, progressive segment | `id` (path), `date` (query) |
| `GET` | `/api/trains/{id}/schedule` | Station stop timetable sequence | `id` (path), `date` (query) |
| `GET` | `/api/trains/{id}/route` | GeoJSON route geometry | `id` (path), `date` (query) |
| `GET` | `/api/trains/{id}/eta` | XGBoost & RF dynamic ETA prediction | `id` (path), `date` (query) |
| `GET` | `/api/trains/{id}/eta/explanation` | SHAP-like feature factor breakdown | `id` (path), `date` (query) |
| `POST` | `/api/trains/batch-eta` | Batch ETA predictions for fleet | Request Body: array of train payloads |
| `GET` | `/api/network/congestion` | Trunk corridor track occupancy | None |
| `GET` | `/api/alerts` | Active caution orders & weather | None |
| `POST` | `/api/simulation/event` | Inject operational disruption | `train_id`, `event_type`, `intensity` |
| `GET` | `/api/dataset/metadata` | Model evaluation & data lineage | None |

---

## 9. Local Setup, Development & Deployment Guide

### Prerequisites
- **Python**: v3.10 or higher
- **Node.js**: v18.0 or higher
- **npm**: v9.0 or higher

### Step 1: Environment Variables
```bash
# Copy environment template
Copy-Item .env.example .env
```

### Step 2: Backend Setup & Execution
```bash
# Install backend dependencies
pip install fastapi uvicorn xgboost scikit-learn pandas numpy joblib

# Start the FastAPI server (Port 8000)
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```
- API Root: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- Swagger Documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### Step 3: Frontend Setup & Execution
```bash
# Install node packages (includes recharts)
npm install

# Start Vite dev server (Port 3000)
npm run dev -- --host
```
- Web Application: [http://localhost:3000/](http://localhost:3000/)

### Step 4: Verification & Production Build
```bash
npm run build
```

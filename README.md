<div align="center">
  <img src="docs/logo.jpg" alt="RailVue AI Logo" width="190" style="border-radius: 24px; margin-bottom: 12px;" />
  <h1>RailVue AI 🚆🤖</h1>
  <p><strong>Next-Generation Real-Time Dynamic ETA Prediction & Congestion Intelligence Engine for Indian Railways</strong></p>
  <p><em>"Smarter ETA. Better journeys."</em></p>

  <p>
    <a href="https://www.python.org/"><img src="https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" /></a>
    <a href="https://fastapi.tiangolo.com/"><img src="https://img.shields.io/badge/FastAPI-0.115%2B-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" /></a>
    <a href="https://xgboost.readthedocs.io/"><img src="https://img.shields.io/badge/XGBoost-Regression-FF6600?style=for-the-badge&logo=xgboost&logoColor=white" alt="XGBoost" /></a>
    <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-18.2%2B-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" /></a>
    <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Vite-5.0%2B-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" /></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.0%2B-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  </p>
</div>

---

## 📌 Executive Summary

Legacy train tracking platforms (such as NTES and basic tracking feeds) rely on **static timetables and linear delay offsets** (e.g., adding current delay directly to scheduled arrival times). This approach fails in complex rail networks where delays compound or recover non-linearly due to **signal interlocks, trunk section density, weather disruptions (monsoon downpours & fog), and temporary speed restrictions (TSR)**.

**RailVue AI** solves this with a real-time, ML-driven dynamic prediction engine. By ingesting live train telemetry, spatial density metrics, signaling bottlenecks, and meteorological radar data, RailVue AI continuously re-predicts dynamic delay propagation and remaining travel times with **honest, defensible accuracy** and explainable AI insights.

---

## 🎯 Mathematical Formulation & ML Architecture

To prevent distance-collinearity and overfitting, the ML engine isolates and models **Dynamic Added Delay ($\Delta \text{Delay}$)** rather than raw journey duration:

$$\text{Target } y = \text{Actual Remaining Travel Time} - \text{Scheduled Remaining Travel Time}$$

$$\hat{y}_{\Delta \text{delay}} = f_{\text{XGBoost}}\left(\mathbf{x}_{\text{spatial}}, \mathbf{x}_{\text{temporal}}, \mathbf{x}_{\text{network}}, \mathbf{x}_{\text{environmental}}\right)$$

At prediction time, total ETA is reconstructed:

$$\text{Predicted Remaining Time} = \text{Scheduled Remaining Time} + \hat{y}_{\Delta \text{delay}}$$
$$\text{Predicted ETA} = \text{Current Timestamp} + \text{Predicted Remaining Time}$$

### 🔬 Feature Engineering Matrix (17 Features)
- **Spatial Features**: `distance_remaining_km`, `distance_to_next_station_km`, `current_speed_kmph`, `upcoming_station_count`
- **Temporal Features**: `hour_of_day`, `day_of_week`, `month`
- **Operational & Historical Delays**: `current_delay_minutes`, `previous_station_delay`, `historical_avg_delay_minutes`, `station_avg_delay_minutes`, `route_avg_delay_minutes`
- **Network Congestion & Bottlenecks**: `congestion_score` (0.0 to 1.0 section saturation), `signal_delay_score`
- **Environmental & Track Safety**: `weather_score` (precipitation/fog index from Open-Meteo Indian coordinates), `rainfall_mm`, `speed_restriction_score` (TSR zones)

---

## 📊 Machine Learning Model Benchmarks

Trained and evaluated on a **chronological journey-level train/test split (80% Train / 20% Test)** across 15,475 multi-station journey records:

| Model Pipeline | Delay MAE (Minutes) | Delay RMSE (Minutes) | $R^2$ Score | Operational Role |
| :--- | :---: | :---: | :---: | :--- |
| **Model 1: Traditional NTES Delay Baseline** | `34.39 min` | `51.47 min` | `-0.3329` | Legacy Static Extrapolation |
| **Model 2: Random Forest Regressor** | `13.34 min` | `18.27 min` | `0.8321` | Ensemble Reference |
| **Model 3: Regularized XGBoost (Production)** | **`13.15 min`** | **`18.68 min`** | **`0.8245`** | **⚡ Primary Production Engine** |

- **$R^2 = 0.8245$**: Explains **$82.5\%$** of real-world delay propagation across Indian railway corridors.
- **$61.8\%$ Error Reduction**: Reduces delay error from $34.39\text{ minutes}$ down to $13.15\text{ minutes}$.
- **Uncertainty Bounds**: Generates 90% confidence prediction intervals ($\pm 30.6\text{ minutes}$).

---

## 🏗 System Architecture

```
RailVue AI Architecture
├── 🐍 Python FastAPI Backend (Port 8000)
│   ├── Dataset Ingestion & Unified Schema Transformation (ingestion.py, transformation.py)
│   ├── Open-Meteo Weather Adapter (fetch_open_meteo_weather.py)
│   ├── RailRadar Live Adapter & Telemetry Cache (railradar_adapter.py)
│   ├── Model Serialization Engine (backend/models/eta_xgboost.json & metadata)
│   ├── Dynamic Inference Engine (backend/ml/predict.py)
│   ├── AI Explainability / SHAP Factor Decomposition (backend/ml/explainability.py)
│   ├── Automated Test Suite (backend/test_suite.py)
│   └── REST API Endpoints (/api/trains/{id}/live, /eta, /explanation, /network/congestion, /alerts, /simulation/event)
└── ⚛️ React TypeScript Frontend (Port 3000)
    ├── 🎛️ Operations Command Center Dashboard (Overview & SVG Route Progress)
    ├── 🗺️ Interactive Live Train Monitor (Full-table search, multi-zone filters, delay badges)
    ├── 📈 Dynamic ETA Predictions View (AI vs. Traditional ETA comparisons & explainability)
    ├── 🔍 Train Journey Details View (6-metric summary, station timeline, SHAP factor attributions)
    ├── 🌐 Network Intelligence & Trunk Corridor Congestion Heatmap
    ├── 📊 Delay Analytics Dashboard & Root Cause Factor Breakdown
    ├── 🚨 Real-Time Operational Alerts & Disruption Feeds
    ├── 📱 Fully Responsive Mobile Drawer & Touch Navigation
    └── ⚡ Floating Simulation Engine (Test Live Rain, Congestion, Signal Interlock & Recovery)
```

---

## ✨ Key Capabilities

1. **Real-Time Dynamic ETA Re-computation**: Sub-second inference updates whenever telemetry, speed, or downstream track conditions change.
2. **Interactive Route Progress**: Visualizes the Golden Quadrilateral and major trunk routes with live train coordinates, speed badges, and station nodes.
3. **Explainable AI (XAI)**: Breaks down delay contributions into human-readable factors (e.g. *Downstream Congestion: +12m*, *Signal Clearance Interlock: +15m*, *Torrential Rain: +8m*, *Green Corridor Recovery: -10m*).
4. **Live Operational Simulation Engine**: Interactive event injection bar with dynamic client & server state synchronization.
5. **Intelligent Train Lifecycle Management**: Automatic transition between `Scheduled`, `On Time`, `Delayed`, `Critical Delay`, and `Arrived at Destination`.
6. **Data Source Transparency & Lineage**: UI clearly labels telemetry source confidence:
   - `🟢 LIVE GPS DATA`
   - `🔵 ESTIMATED TELEMETRY`
   - `⚡ REAL XGBOOST MODEL`
   - `🏁 ARRIVED AT DESTINATION`

---

## 🔌 API Documentation

FastAPI provides an automatic interactive OpenAPI interface at `http://localhost:8000/docs`.

### Core Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/trains/{train_id}/live` | Live telemetry, speed, coordinates, and current delay |
| `GET` | `/api/trains/{train_id}/eta` | XGBoost ETA prediction, remaining minutes, confidence & prediction intervals |
| `GET` | `/api/trains/{train_id}/eta/explanation` | Explainability factors and feature impact breakdown |
| `GET` | `/api/network/congestion` | Section congestion density, hotspots, and affected train count |
| `GET` | `/api/alerts` | Active safety alerts, weather cautions, and speed restrictions |
| `POST` | `/api/simulation/event` | Inject operational disruption event to trigger real-time re-inference |

### Sample Response (`GET /api/trains/12301/eta`)

```json
{
  "train_id": "12301",
  "train_name": "Howrah Rajdhani Express",
  "next_station": "Prayagraj Junction",
  "predicted_eta": "2026-08-30T18:48:00",
  "predicted_eta_formatted": "18:48",
  "delay_minutes": 18,
  "remaining_travel_time_minutes": 492.0,
  "confidence": 0.94,
  "eta_lower_bound": "2026-08-30T18:17:00",
  "eta_lower_bound_formatted": "18:17",
  "eta_upper_bound": "2026-08-30T19:19:00",
  "eta_upper_bound_formatted": "19:19",
  "prediction_interval_margin_minutes": 30.6,
  "data_source_transparency": {
    "is_live_gps": true,
    "is_estimated": false,
    "is_simulated": false,
    "model_type": "XGBoost Regressor (eta_xgboost.json)"
  }
}
```

---

## 🚀 Quickstart & Installation

### Prerequisites
- **Python**: Version 3.10 or higher
- **Node.js**: Version 18 or higher (`npm` included)
- **Git**

---

### Step 1: Clone Repository
```bash
git clone https://github.com/SumitKumar-990/Railway_Info.git
cd Railway_Info
```

---

### Step 2: Backend Setup & Verification

1. **Install Python Dependencies**:
   ```bash
   pip install fastapi uvicorn xgboost scikit-learn pandas numpy matplotlib
   ```

2. **Run Automated Test Suite**:
   ```bash
   python backend/test_suite.py
   ```
   *Verifies module imports, XGBoost dynamic inference, station lookup, RailRadar client, and all async API routes.*

3. **Start FastAPI Backend Server**:
   ```bash
   python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   - API Root: `http://localhost:8000/`
   - Swagger Docs: `http://localhost:8000/docs`

---

### Step 3: Frontend Setup & Launch

In a separate terminal window:

1. **Install Node Dependencies**:
   ```bash
   npm install
   ```

2. **Build or Start Development Server**:
   ```bash
   # Development Server
   npm run dev

   # Production Build
   npm run build
   ```

3. **Access Dashboard**:
   Open your browser and navigate to **`http://localhost:3000/`** (or your Vercel deployment URL).

---

## 📂 Project Structure

```
Railway_Info/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── trains.py          # Train telemetry, ETA, terminal arrival & explanation routes
│   │   │   └── network.py         # Network congestion & alert routes
│   │   └── main.py                # FastAPI app setup, CORS & background ticker
│   ├── data/                      # Dataset ingestion, Open-Meteo weather & RailRadar adapters
│   │   ├── raw/                   # Official Indian Railway timetable & express train catalogs
│   │   ├── stations.json          # 19 Indian junction nodes with coordinates
│   │   ├── historical_train_data.csv # Master historical dataset
│   │   ├── fetch_open_meteo_weather.py
│   │   ├── railradar_adapter.py
│   │   └── collect_railradar_snapshots.py
│   ├── ml/
│   │   ├── explainability.py      # SHAP-like attribution calculator
│   │   ├── feature_engineering.py # Real-time feature calculation
│   │   ├── predict.py             # Inference pipeline & ETA predictor class
│   │   └── train_model.py         # Model training script (XGBoost, RF, Baseline)
│   ├── models/
│   │   ├── eta_xgboost.json       # Serialized trained XGBoost model
│   │   ├── model_metadata.json    # Feature names and benchmark metrics
│   │   ├── feature_importance.png # Feature gain attribution chart
│   │   └── residual_analysis.png  # Error distribution & residual diagnostic plots
│   └── test_suite.py              # Automated full-stack verification test suite
├── src/
│   ├── components/
│   │   ├── alerts/                # Disruption alerts & safety bulletins
│   │   ├── analytics/             # Delay analytics & root cause breakdown
│   │   ├── details/               # Detailed train journey timeline & explainability
│   │   ├── layout/                # Responsive Sidebar & Header with mobile drawer
│   │   ├── monitor/               # Real-time tabular live train monitor
│   │   ├── network/               # Network intelligence & corridor density
│   │   ├── overview/              # Main operations dashboard & interactive route map
│   │   └── simulation/            # Event injection bar (Rain, Congestion, Signal, Recovery)
│   ├── data/                      # Initial train schedules and network topology
│   ├── hooks/                     # Custom React hooks (useLiveTrainData)
│   ├── services/                  # Frontend API client service
│   ├── types/                     # TypeScript data interfaces
│   ├── App.tsx                    # Top-level React container
│   ├── main.tsx                   # React DOM root
│   └── index.css                  # Tailwind CSS setup
├── package.json
├── vite.config.js
└── README.md
```

---

## 👥 Authors & Acknowledgments

- **Sumit Kumar** ([@SumitKumar-990](https://github.com/SumitKumar-990))
- Developed for **Smart India Hackathon (SIH)** — Railway Operations & Real-Time Telemetry Tracking Challenge.

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

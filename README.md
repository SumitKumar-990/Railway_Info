# RailSight AI 🚆🤖

> **Next-Generation Real-Time Dynamic ETA Prediction & Congestion Management System for Indian Railways**  
> *Smart India Hackathon (SIH) Solution*

[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![XGBoost](https://img.shields.io/badge/XGBoost-Regression-FF6600?style=for-the-badge&logo=xgboost&logoColor=white)](https://xgboost.readthedocs.io/)
[![React](https://img.shields.io/badge/React-18.2%2B-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-5.0%2B-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

---

## 📌 Executive Summary

Legacy train tracking platforms (such as NTES) rely on **static timetables and linear delay offsets** (e.g., adding current delay directly to scheduled arrival times). This approach fails in complex rail networks where delays compound or recover non-linearly due to **signal interlocks, trunk section density, weather disruptions, and temporary speed restrictions (TSR)**.

**RailSight AI** solves this with a real-time, ML-driven dynamic prediction engine. By ingesting live train telemetry, spatial density metrics, signaling bottlenecks, and meteorological radar data, RailSight AI continuously re-predicts remaining travel times with **sub-minute precision** and explainable AI insights.

---

## 🎯 Core Mathematical Formulation

$$\text{Predicted ETA} = \text{Current Timestamp} + \hat{y}_{\text{remaining}}$$

Where the dynamic remaining travel time $\hat{y}_{\text{remaining}}$ is estimated via trained gradient-boosted regression:

$$\hat{y}_{\text{remaining}} = f_{\text{XGBoost}}\left(\mathbf{x}_{\text{spatial}}, \mathbf{x}_{\text{temporal}}, \mathbf{x}_{\text{network}}, \mathbf{x}_{\text{environmental}}\right)$$

### 🔬 Feature Engineering Matrix (20+ Features)
- **Spatial Features**: `distance_remaining_km`, `distance_to_next_station_km`, `current_speed_kmph`, `upcoming_station_count`
- **Temporal Features**: `hour_of_day`, `day_of_week`, `month`, `scheduled_remaining_time_minutes`
- **Operational & Historical Delays**: `current_delay_minutes`, `previous_station_delay`, `historical_avg_delay_minutes`, `route_avg_delay_minutes`
- **Network Congestion & Bottlenecks**: `congestion_score` (0.0 to 1.0 section saturation), `signal_delay_score`
- **Environmental & Track Safety**: `weather_score` (precipitation/fog index), `rainfall_mm`, `speed_restriction_score` (TSR zones)

---

## 📊 Machine Learning Model Benchmarks

Trained and evaluated across multi-route Indian Railways tracking datasets:

| Model Pipeline | MAE (Minutes) | RMSE (Minutes) | $R^2$ Score | Deployment Role |
| :--- | :---: | :---: | :---: | :--- |
| **Model 1: Schedule Baseline (NTES Offset)** | `11.84 min` | `15.88 min` | `0.9966` | Legacy Timetable Reference |
| **Model 2: Random Forest Regressor** | `8.06 min` | `11.24 min` | `0.9983` | Ensemble Benchmark |
| **Model 3: XGBoost Gradient Boosting** | **`6.68 min`** | **`8.81 min`** | **`0.9989`** | **⚡ Primary Production Engine** |

---

## 🏗 System Architecture

```
RailSight AI Architecture
├── 🐍 Python FastAPI Backend (Port 8000)
│   ├── Dataset Ingestion & Unified Schema Transformation (ingestion.py, transformation.py)
│   ├── Model Serialization Engine (backend/models/eta_xgboost.json & metadata)
│   ├── Dynamic Inference Engine (backend/ml/predict.py)
│   ├── AI Explainability / SHAP Factor Decomposition (backend/ml/explainability.py)
│   ├── Live Simulation Ticker Service (15-second background state progression loop)
│   └── REST API Endpoints (/api/trains/{id}/live, /eta, /explanation, /network/congestion, /alerts)
└── ⚛️ React TypeScript Frontend (Port 3000)
    ├── 🎛️ Operations Command Center Dashboard
    ├── 🗺️ Interactive SVG Indian Railways Network Map (Live train beacons, corridor routes)
    ├── 📈 Dynamic 4-Model Recharts Comparative Graph (Actual vs XGB vs RF vs Baseline)
    ├── 🔍 Train Deep-Dive Details View (6-metric grid, station timeline, delay attributions)
    ├── 🌐 Network Intelligence & Trunk Corridor Congestion Heatmap
    ├── 📊 Delay Analytics Dashboard & Root Cause Factor Breakdown
    ├── 🚨 Real-Time Operational Alerts & Disruption Feeds
    ├── 🧪 Interactive Developer API Sandbox Playground
    └── ⚡ Floating Real-Time Event Injection Bar (Simulate Rain, Congestion, TSR, Priority)
```

---

## ✨ Key Capabilities

1. **Real-Time Dynamic ETA Re-computation**: Sub-second inference updates whenever telemetry, speed, or downstream track conditions change.
2. **Interactive SVG Network Map**: Visualizes the Golden Quadrilateral and major trunk routes with live train coordinates, speed badges, and station nodes.
3. **Explainable AI (XAI)**: Breaks down delay contributions into human-readable factors (e.g. *Downstream Congestion: +8m*, *Caution Speed Order: +5m*, *Buffer Recovery: -3m*).
4. **Live Operational Simulation Engine**: Built-in 15-second background ticker with interactive event injection (simulate monsoons, signal failures, or VIP precedence).
5. **Data Source Transparency & Lineage**: UI clearly labels telemetry source confidence:
   - `🟢 LIVE GPS DATA`
   - `🔵 ESTIMATED TELEMETRY`
   - `⚡ REAL XGBOOST MODEL`
   - `🟠 SIMULATED OVERRIDE`

---

## 🔌 API Documentation

FastAPI provides an automatic interactive OpenAPI interface at `http://localhost:8000/docs`.

### Core Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/trains/{train_id}/live` | Live telemetry, speed, coordinates, and current delay |
| `GET` | `/api/trains/{train_id}/eta` | XGBoost ETA prediction, remaining minutes, confidence & data lineage |
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
  "predicted_eta": "2026-08-29T18:42:00",
  "predicted_eta_formatted": "18:42",
  "delay_minutes": 18,
  "remaining_travel_time_minutes": 492.0,
  "confidence": 0.94,
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

### Step 2: Backend Setup & Launch

1. **Install Python Dependencies**:
   ```bash
   pip install fastapi uvicorn xgboost scikit-learn pandas numpy
   ```

2. **(Optional) Train or Re-train ML Models**:
   ```bash
   python backend/ml/train_model.py
   ```
   *Generates `backend/models/eta_xgboost.json` and `backend/models/model_metadata.json`.*

3. **Start FastAPI Backend Server**:
   ```bash
   python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   - API Root: `http://localhost:8000/`
   - Swagger Docs: `http://localhost:8000/docs`

---

### Step 3: Frontend Setup & Launch

In a new terminal window:

1. **Install Node Dependencies**:
   ```bash
   npm install
   ```

2. **Start Vite React Development Server**:
   ```bash
   npm run dev
   ```

3. **Access Dashboard**:
   Open your browser and navigate to **`http://localhost:3000/`**

---

## 📂 Project Structure

```
rail_collector/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── trains.py          # Train telemetry, ETA & explanation routes
│   │   │   └── network.py         # Network congestion & alert routes
│   │   └── main.py                # FastAPI app setup, CORS & background ticker
│   ├── data/                      # Dataset ingestion & transformations
│   ├── ml/
│   │   ├── explainability.py      # SHAP-like attribution calculator
│   │   ├── feature_engineering.py # Real-time feature calculation
│   │   ├── predict.py             # Inference pipeline & ETA predictor class
│   │   └── train_model.py         # Model training script (XGBoost, RF, Baseline)
│   └── models/
│       ├── eta_xgboost.json       # Serialized trained XGBoost model
│       └── model_metadata.json    # Feature names and benchmark metrics
├── src/
│   ├── components/
│   │   ├── alerts/                # Disruption alerts & safety bulletins
│   │   ├── analytics/             # Delay analytics & Recharts root cause view
│   │   ├── api/                   # Developer API sandbox playground
│   │   ├── details/               # Detailed train journey timeline & explainability
│   │   ├── layout/                # Responsive Sidebar & Header
│   │   ├── monitor/               # Real-time tabular live train monitor
│   │   ├── network/               # Network intelligence & corridor density
│   │   ├── overview/              # Main operations dashboard & interactive SVG map
│   │   └── simulation/            # Event injection bar (weather, TSR, priority)
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

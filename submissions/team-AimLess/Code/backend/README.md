# GABRIEL — Python Routing Backend

Pure Python real-time emergency routing daemon utilizing **OSRM (Open Source Routing Machine)**, **OpenStreetMap**, and **Socket.IO** for automated corridor optimization, ETA forecasting, dynamic road rerouting, and hospital suitability dispatch in the GABRIEL emergency network.

---

## 🏛️ Architecture Overview

```
                      GABRIEL
                         │
            ┌────────────┼────────────┐
            │            │            │
         Next.js      Python       PostgreSQL
         Frontend     Backend          │
            │            │             │
       Google Maps /    OSRM           │
      Leaflet + OSM      │             │
            │            │             │
            └────── Socket.IO ─────────┘
```

- **Next.js Frontend**: Interactive driver, hospital, citizen, and admin interfaces powered by a hybrid **Google Maps** (with live traffic layers and satellite hybrid mode) and **Leaflet + OpenStreetMap** engine.
- **Pure Python Routing Daemon**: Background service that subscribes to Socket.IO events, queries OSRM for road network topology, computes multi-hospital ETA comparisons, and manages GPS recalculation throttling.
- **OSRM (`https://router.project-osrm.org`)**: Turn-by-turn road network routing, route geometries (GeoJSON), distance (km), and travel durations (minutes).
- **PostgreSQL**: Authoritative relational storage for incidents, ambulances, hospital capabilities, and historical GPS trails.
- **Socket.IO Relay**: Real-time event bridge connecting Next.js clients, the Python routing daemon, and hospital command consoles.

---

## 🚀 Prerequisites

- **Python**: 3.10+ (tested with Python 3.10 - 3.14)
- **Node.js**: 18.x or 20.x+
- **PostgreSQL**: PostgreSQL 14+ or Neon / Supabase Serverless PostgreSQL

---

## 🛠️ Installation & Virtual Environment Setup

### 1. Virtual Environment Creation

#### Windows (PowerShell / Command Prompt):
```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r backend/requirements.txt
```

#### macOS / Linux:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

---

## ⚙️ Configuration (`.env` / Environment Variables)

The Python service reads configuration from `backend/config.py` and `.env` / `.env.local`:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/gabriel_db` | PostgreSQL connection string |
| `OSRM_BASE_URL` | `https://router.project-osrm.org` | Base URL of the OSRM routing server |
| `SOCKET_SERVER_URL` | `http://localhost:4000` | Address of the Socket.IO event server |
| `ROUTE_RECALC_INTERVAL_SECONDS` | `4.0` | Minimum seconds between OSRM GPS recalculations |
| `MIN_DISTANCE_RECALC_METERS` | `35.0` | Minimum GPS delta meters required to trigger recalculation |
| `REROUTE_SAVINGS_MINUTES_THRESHOLD` | `2.0` | Time savings threshold (minutes) to fire `routing:reroute` alert |

> 🔒 **Security Notice**: Never commit real database passwords or API keys to GitHub. Copy `.env.example` to `.env.local` for local development.

---

## 🚦 Running the System

### Terminal 1: Real-time Socket.IO Server
```bash
npm run socket-server
# Or: npx tsx scripts/socket-server.ts
```

### Terminal 2: Next.js Frontend
```bash
npm run dev
```

### Terminal 3: Pure Python Routing Service
```bash
# Windows
.venv\Scripts\activate
python backend/main.py

# Linux / macOS
source .venv/bin/activate
python backend/main.py
```

---

## 🎮 Development Simulator Mode (`--simulate`)

The Python service includes a development-only simulator that executes an end-to-end ambulance mission lifecycle with live OSRM routing updates:

```bash
# Windows
.venv\Scripts\python backend/main.py --simulate

# Linux / macOS
python backend/main.py --simulate
```

### What the Simulator Does:
1. **Pulls/Creates an Active Incident** (e.g., severe road collision).
2. **Assigns an Available Ambulance** matching the required medical capability level.
3. **Stage 1 (Ambulance → Scene)**: Calculates initial OSRM route, streams moving GPS coordinates towards the accident scene, and emits live ETAs.
4. **Scene Arrival & Patient Triage**: Marks patient as picked up.
5. **Hospital Evaluation**: Filters candidate hospitals by medical capability and queries OSRM driving times to find the fastest suitable trauma center.
6. **Stage 2 (Scene → Hospital)**: Recalculates OSRM road corridor to the selected hospital and streams live GPS updates to hospital consoles.
7. **Hospital Handover**: Marks patient arrival and closes the mission.

---

## 📡 Socket.IO Real-time Events

### Inbound Events (Listened by Python):
- `ambulance:location_updated`: Ingests GPS telemetry (`ambulanceId`, `latitude`, `longitude`, `speed`, `heading`).
- `ambulance:assigned`: Ingests new emergency dispatch assignment.
- `incident:status_changed`: Ingests state transitions (`PATIENT_PICKED_UP`, `ARRIVED`, `CLOSED`).
- `routing:request`: Immediate explicit route recalculation trigger.

### Outbound Events (Emitted by Python):
- `routing:start`: Broadcasts newly generated OSRM road geometry, distance, and ETA.
- `routing:update`: Broadcasts throttled ETA and remaining distance updates as ambulance moves.
- `routing:reroute`: Emitted when an alternative corridor saves $\ge 2.0\text{ min}$ (`previousEtaMinutes`, `newEtaMinutes`, `distanceKm`, `routeGeometry`).
- `hospital:eta_updated`: Real-time transit update pushed directly to hospital emergency department consoles.
- `routing:completed`: Emitted upon patient delivery to the trauma center.
- `routing:error`: Emitted when routing issues occur with graceful linear fallback.

---

## 🧪 Testing & Verification

1. **Verify Database Connection**:
   ```bash
   node scripts/verify-postgres.js
   ```
2. **Run Python Simulator**:
   ```bash
   python backend/main.py --simulate
   ```
3. **Run TypeScript Check**:
   ```bash
   npx tsc --noEmit
   ```

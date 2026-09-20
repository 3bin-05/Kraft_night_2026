# G Λ B R I E L — Autonomous Emergency Response Network

> **People · Faster · Safer**

GABRIEL is an autonomous, real-time emergency coordination ecosystem engineered to eliminate dispatch friction, optimize road transit corridors, and synchronize emergency departments before the ambulance arrives.

---

## 🏛️ System Architecture

```
                                 GABRIEL
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
       Next.js                   Python                   PostgreSQL
       Frontend                  Backend                   Database
          │                         │                         │
   Google Maps /                  OSRM                        │
   Leaflet + OSM              Route Engine                    │
          │                         │                         │
          └─────────────────── Socket.IO ─────────────────────┘
```

- **Frontend (Next.js 15 App Router)**: High-contrast emergency UI with tactical Google Maps satellite/traffic view and Leaflet + OpenStreetMap engine.
- **Routing Daemon (Pure Python)**: Event-driven daemon with zero REST overhead, evaluating multi-hospital suitability and streaming road corridors via OSRM.
- **Relational Storage (PostgreSQL)**: Authoritative storage for emergency incidents, vehicle fleet capabilities, and verified hospital readiness.
- **Real-Time Communication (Socket.IO)**: Low-latency bidirectional event bridge linking drivers, hospital trauma teams, and citizens.

---

## ✨ Key Capabilities

| Capability | Description |
| :--- | :--- |
| **🚨 Triage-Aware Dispatch** | Instant rule-based matching between incident severity and certified ambulance capability (BLS, ALS, Mobile ICU). |
| **🗺️ Tactical Hybrid Routing** | OSRM road network routing + Google Maps JavaScript API with live traffic layers and satellite hybrid mode. |
| **🏥 Trauma Readiness Link** | Live evaluation of hospital emergency capabilities and ICU bed counts with dynamic driving ETA ranking. |
| **⚡ Dynamic Rerouting** | Real-time GPS progress monitoring with automatic alternative corridor alerts when time savings exceed threshold. |
| **📡 Telemetry Stream** | Sub-second vehicle tracking with heading indicators, velocity telemetry, and breadcrumb trail persistence. |
| **🎮 Development Simulator** | Standalone mission simulator demonstrating full end-to-end emergency lifecycles (`python backend/main.py --simulate`). |

---

## 🚀 Quick Start Guide

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/gabriel.git
cd gabriel
```

### 2. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# PostgreSQL Connection (Neon, Supabase, or local)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gabriel_db

# Session Secret (Generate via `openssl rand -hex 32`)
JWT_SECRET=your_long_random_jwt_secret_here

# Google Maps API Key (Optional - falls back to OpenStreetMap)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

> 🔒 **Security**: `.env` and `.env.local` are strictly excluded in `.gitignore`. Never commit API keys or database passwords to source control.

---

### 3. Install Dependencies

#### Node.js Dependencies:
```bash
npm install
```

#### Python Virtual Environment:
```bash
# Windows
python -m venv .venv
.venv\Scripts\activate
pip install -r backend/requirements.txt

# Linux / macOS
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

---

### 4. Run the System

To run the complete real-time stack, launch three terminals:

#### Terminal 1 — Socket.IO Server:
```bash
npm run socket-server
# Or: npx tsx scripts/socket-server.ts
```

#### Terminal 2 — Next.js Application:
```bash
npm run dev
```

#### Terminal 3 — Python Routing Daemon:
```bash
# Windows
.venv\Scripts\activate
python backend/main.py

# Linux / macOS
source .venv/bin/activate
python backend/main.py
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎮 Running the Simulation Mode

Execute a full end-to-end ambulance mission simulation without manual inputs:

```bash
# Windows
.venv\Scripts\python backend/main.py --simulate

# Linux / macOS
python backend/main.py --simulate
```

---

## 📁 Repository Structure

```
gabriel/
├── app/                        # Next.js App Router (Pages & API routes)
│   ├── ambulance/              # Ambulance Fleet Command Console
│   ├── hospital/               # Hospital Emergency Department Console
│   ├── citizen/                # Citizen Incident Tracking & SOS Portal
│   ├── admin/                  # Fleet & Dispatch Oversight
│   └── api/                    # Core REST endpoints (auth, incidents, hospitals)
├── backend/                    # Pure Python Routing Service
│   ├── main.py                 # Daemon entrypoint & development simulator
│   ├── config.py               # Environment configuration
│   ├── requirements.txt        # Minimal Python dependencies
│   ├── routing/                # OSRM client, Hospital Router & Route Engine
│   ├── realtime/               # Socket.IO client handler
│   └── services/               # Direct PostgreSQL database service
├── components/                 # Reusable UI & Map Components
│   ├── map/                    # GoogleMapContainer & DynamicMap
│   ├── ambulance/              # ActiveMissionPanel & HospitalSelectorModal
│   ├── hospital/               # HospitalDashboard & CasualtyList
│   └── ui/                     # Accessible UI components (Cards, Badges, Buttons)
├── lib/                        # Client libraries, API client, Socket manager & DB
├── scripts/                    # Database setup, verification, & Socket.IO server
├── types/                      # TypeScript definitions (Incident, Ambulance, Hospital)
├── .env.example                # Safe environment configuration template
└── .gitignore                  # Git exclusion rules (Secrets, node_modules, .venv)
```

---

## 🧪 Verification & Code Quality

Run tests and type checks before committing:

```bash
# TypeScript type check
npx tsc --noEmit

# Database connection test
node scripts/verify-postgres.js
```

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

# Team Name: <AimLess>

## Members
|    Name   |             Email             |           GitHub             |
|-----------|-------------------------------|------------------------------|
|Ebin reji  |ebin05reji@gmail.com           |https://github.com/3bin-05    |
|Vaishnav S |vaishnavshalikumar49@gmail.com |https://github.com/itzychuu   |
|Jagan J P  |jaganjp7620@gmail.com          |https://github.com/JAGAN7620  | 
|Malavika M |malavikak660@gmail.com         |https://github.com/malavika58 |

## Project Name
<Gabriel>

## Goal / Problem Statement
- Road accidents are often underestimated in the first few minutes, leading to missed injuries and delayed treatment.
- Delayed ambulance response and poor coordination with nearby hospitals can worsen patient outcomes during emergencies.
- Our project aims to provide a cooperative emergency-response system that verifies accidents, assesses severity, coordinates ambulances, and routes patients to the most suitable hospital for timely care.

## Tech Stack
<GABRIEL Tech Stack
Frontend: Next.js + TypeScript
Backend: Python routing engine
Database: PostgreSQL
Real-time: Socket.IO
Maps: Google Maps (Demo)
Routing: OSRM
Location: Browser Geolocation API
Auth: HTTP-only sessions/cookies
Styling: CSS
Version Control: Git + GitHub>

## Demo Video
[Watch Demo Video](https://drive.google.com/drive/folders/1oYxtunGZObF6yomj_BqvGzNK_0LPObAP?usp=sharing)

## Screenshots
See the `photos/` folder in this directory for working screenshots/photos of the project.

## How to Run (Full Stack)

### Prerequisites
Make sure you have installed:
- Node.js 18+
- Python 3.10+
- Git

### Step 1 — Clone and Enter the Project
```bash
git clone https://github.com/3bin-05/GabrielFrontend.git
cd GabrielFrontend
```

### Step 2 — Set Up Environment Variables
```bash
copy .env.example .env.local
```
Then open `.env.local` and fill in your values:
```env
DATABASE_URL=postgresql://neondb_owner:<password>@<host>/neondb?sslmode=require
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NEXTAUTH_SECRET=any_random_string_here
NEXTAUTH_URL=http://localhost:3000
```

### Step 3 — Install Node.js Dependencies
```bash
npm install
```

### Step 4 — Push Database Schema
```bash
npx prisma db push
```

### Step 5 — Set Up Python Virtual Environment
```bash
python -m venv .venv
```
Activate it on Windows:
```bash
.venv\Scripts\activate
```

### Step 6 — Install Python Dependencies
```bash
pip install -r backend/requirements.txt
```

### Step 7 — Start All Three Services (3 separate terminals)

Terminal 1 — Next.js Frontend:
```bash
npm run dev
```

Terminal 2 — Socket.IO Relay Server:
```bash
npx tsx scripts/socket-server.ts
```

Terminal 3 — Python Routing Backend:
```bash
.venv\Scripts\python.exe backend\main.py
```

### Step 8 — Open the App

Service URL:
- Frontend: http://localhost:3000
- Socket.IO: http://localhost:4000
- Python backend: runs internally (no HTTP port)

### Map Routing Used
- Road routing: OSRM (public API)
- Map tiles: Google Maps (satellite/traffic)
- Fallback tiles: OpenStreetMap via Leaflet
- Real-time events: Socket.IO

### Quick Sanity Check
After starting, verify:
- http://localhost:3000 loads the GABRIEL homepage
- Hospital dashboard shows live bed counts from PostgreSQL
- Ambulance console shows map with GPS tracking
- Python terminal shows `[ROUTING] Engine ready`

>GitHub repo: https://github.com/3bin-05/GabrielFrontend

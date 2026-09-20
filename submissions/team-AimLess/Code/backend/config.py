"""
GABRIEL Routing Backend Configuration
Loads configuration from environment variables or .env.local
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Search for .env.local in project root first, then .env
root_dir = Path(__file__).resolve().parent.parent
env_local = root_dir / ".env.local"
if env_local.exists():
    load_dotenv(env_local)
else:
    load_dotenv(root_dir / ".env")

# Database Configuration (PostgreSQL)
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/gabriel_db",
)

# OSRM Routing Engine URL
# Default is the public OSRM car routing service; can be configured to local OSRM instance
OSRM_BASE_URL = os.getenv("OSRM_BASE_URL", "https://router.project-osrm.org").rstrip("/")

# Real-Time Socket.IO Server URL
SOCKET_SERVER_URL = os.getenv("SOCKET_SERVER_URL", "http://localhost:4000").rstrip("/")

# Routing Engine Throttling & Thresholds
# Minimum seconds between OSRM route recalculations for a moving ambulance
ROUTE_RECALC_INTERVAL_SECONDS = float(os.getenv("ROUTE_RECALC_INTERVAL_SECONDS", "4.0"))

# Minimum distance moved (in meters) before recalculating route geometry
MIN_DISTANCE_RECALC_METERS = float(os.getenv("MIN_DISTANCE_RECALC_METERS", "35.0"))

# Dynamic Reroute Savings Threshold (minutes saved before suggesting alternative route)
REROUTE_SAVINGS_MINUTES_THRESHOLD = float(os.getenv("REROUTE_SAVINGS_MINUTES_THRESHOLD", "2.0"))

# Fallback Ambulance Speed in km/h if not provided in GPS telemetry
DEFAULT_AMBULANCE_SPEED_KMH = 55.0

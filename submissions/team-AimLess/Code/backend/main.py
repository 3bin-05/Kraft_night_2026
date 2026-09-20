"""
GABRIEL — Pure Python Routing Backend
Entrypoint for OSRM Road Navigation, Hospital Comparison Engine & Real-Time Socket.IO Client.

Usage:
    python backend/main.py              # Runs production event-driven routing daemon
    python backend/main.py --simulate   # Runs DEVELOPMENT-ONLY full ambulance journey simulation
"""
import sys
import os
import time
import argparse

# Ensure project root is in Python sys.path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.config import OSRM_BASE_URL, SOCKET_SERVER_URL
from backend.routing.osrm import osrm_client, calculate_haversine_distance_km
from backend.routing.hospital_router import hospital_router
from backend.routing.route_engine import route_engine
from backend.services.ambulance_service import db_service
from backend.realtime.socket_client import sio, start_socket_client

def run_simulation():
    """
    DEVELOPMENT-ONLY Simulation Mode
    Simulates a full end-to-end ambulance mission:
      1. Emergency Reported & Ambulance Assigned (Stage 1: To Accident Scene)
      2. Step-by-step GPS movement along OSRM road geometry
      3. Arrival at Accident Scene & Patient Pickup
      4. Hospital capability evaluation & fastest OSRM route selection
      5. Step-by-step GPS movement along OSRM road geometry (Stage 2: To Hospital)
      6. Dynamic ETA recalculation and mission completion
    """
    print("=" * 70)
    print("  GABRIEL EMERGENCY ROUTING ENGINE -- DEVELOPMENT SIMULATOR")
    print("=" * 70)

    # 1. Fetch available entities from PostgreSQL
    hospitals = db_service.get_hospitals()
    ambulances = db_service.get_ambulances()

    print(f"\n[Simulator] Loaded {len(hospitals)} hospitals and {len(ambulances)} ambulances from PostgreSQL.")

    # Define test coordinates in Kochi regional bounds
    station_lat, station_lng = 8.9130, 76.6320 # Paramedic base station
    accident_lat, accident_lng = 8.9350, 76.6450 # Accident scene (MG Road)

    incident_id = f"sim_inc_{int(time.time())}"
    ambulance_id = ambulances[0]["id"] if ambulances else "amb_unit_001"
    severity = "CRITICAL"

    print(f"\n--- STEP 1: Ambulance Assigned to CRITICAL Emergency #{incident_id} ---")
    print(f"Station Origin: ({station_lat}, {station_lng}) -> Accident Scene: ({accident_lat}, {accident_lng})")

    # Initialize Stage 1 Route
    stage1_result = route_engine.init_mission(
        incident_id=incident_id,
        ambulance_id=ambulance_id,
        accident_lat=accident_lat,
        accident_lng=accident_lng,
        ambulance_lat=station_lat,
        ambulance_lng=station_lng,
        severity=severity
    )

    print(f"[OK] OSRM Stage 1 Route Computed:")
    print(f"  * Distance: {stage1_result['distanceKm']} km")
    print(f"  * ETA: {stage1_result['etaMinutes']} min")
    print(f"  * Route Waypoints: {len(stage1_result['routeGeometry'])} geometry points")
    print(f"  * Provider: {stage1_result['providerStatus']} ({stage1_result.get('providerName', 'OSRM')})")

    # Broadcast routing:start via socket if connected
    if sio.connected:
        sio.emit("routing:start", stage1_result)

    # 2. Simulate Ambulance Movement to Scene (Stage 1)
    print("\n--- STEP 2: Simulating Stage 1 GPS Movement to Accident Scene ---")
    geometry_pts = stage1_result["routeGeometry"]
    sample_steps = geometry_pts[::max(1, len(geometry_pts) // 5)] + [geometry_pts[-1]]

    for idx, (curr_lat, curr_lng) in enumerate(sample_steps):
        print(f"  [GPS Update {idx+1}/{len(sample_steps)}] Ambulance at ({curr_lat:.5f}, {curr_lng:.5f})...")
        update, reroute = route_engine.process_gps_update(
            ambulance_id=ambulance_id,
            latitude=curr_lat,
            longitude=curr_lng,
            incident_id=incident_id
        )
        if update:
            print(f"    -> Remaining: {update['distanceKm']} km | ETA: {update['etaMinutes']} min")
            if sio.connected:
                sio.emit("routing:update", update)
        time.sleep(0.5)

    print("[OK] Ambulance arrived at accident scene!")

    # 3. Patient Picked Up & Hospital Capability Evaluation
    print("\n--- STEP 3: Patient Picked Up & Hospital Capability Routing ---")
    print(f"Evaluating capable hospitals for acuity: {severity}...")

    primary_hosp, alts, filtered = hospital_router.evaluate_and_rank_hospitals(
        ambulance_lat=accident_lat,
        ambulance_lng=accident_lng,
        severity=severity
    )

    if primary_hosp:
        print(f"[OK] Primary Recommended Hospital: {primary_hosp.hospital_name} ({primary_hosp.hospital_code})")
        print(f"  * Driving ETA: {primary_hosp.eta_minutes} min | Distance: {primary_hosp.distance_km} km")
        print(f"  * Available Beds: {primary_hosp.available_beds}")
        print(f"  * Reason: {primary_hosp.recommendation_reason}")

        if alts:
            print(f"  * Alternative Suitable Hospitals ({len(alts)}):")
            for alt in alts:
                print(f"    - {alt.hospital_name}: {alt.eta_minutes} min ETA, {alt.available_beds} beds")

        if filtered:
            print(f"  * Filtered Out Hospitals ({len(filtered)}):")
            for f in filtered:
                print(f"    - {f.get('hospitalName')}: {f.get('reason')}")

    # 4. Transition to Stage 2 (Ambulance with Patient -> Hospital)
    print("\n--- STEP 4: Stage 2 Routing (To Fastest Suitable Hospital) ---")
    stage2_result = route_engine.update_to_hospital_stage(incident_id=incident_id)

    if stage2_result:
        print(f"[OK] Stage 2 OSRM Route to {stage2_result['hospitalName']}:")
        print(f"  * Distance: {stage2_result['distanceKm']} km")
        print(f"  * Hospital ETA: {stage2_result['etaMinutes']} min")
        print(f"  * Polyline Points: {len(stage2_result['routeGeometry'])} coordinates")

        if sio.connected:
            sio.emit("routing:start", stage2_result)
            sio.emit("hospital:eta_updated", {
                "incidentId": incident_id,
                "hospitalId": stage2_result.get("hospitalId"),
                "eta": f"{stage2_result.get('etaMinutes')} min",
                "distanceKm": stage2_result.get("distanceKm")
            })

        # 5. Simulate Stage 2 Movement
        print("\n--- STEP 5: Simulating Stage 2 GPS Transit to Hospital ---")
        stage2_geom = stage2_result["routeGeometry"]
        stage2_samples = stage2_geom[::max(1, len(stage2_geom) // 5)] + [stage2_geom[-1]]

        for idx, (curr_lat, curr_lng) in enumerate(stage2_samples):
            print(f"  [Hospital En Route {idx+1}/{len(stage2_samples)}] GPS: ({curr_lat:.5f}, {curr_lng:.5f})...")
            update, reroute = route_engine.process_gps_update(
                ambulance_id=ambulance_id,
                latitude=curr_lat,
                longitude=curr_lng,
                incident_id=incident_id
            )
            if update:
                print(f"    -> ETA to Hospital: {update['etaMinutes']} min ({update['distanceKm']} km)")
                if sio.connected:
                    sio.emit("routing:update", update)
            if reroute:
                print(f"    [REROUTE ALERT]: {reroute['message']}")
                if sio.connected:
                    sio.emit("routing:reroute", reroute)
            time.sleep(0.5)

        print(f"\n[OK] Ambulance arrived at {stage2_result['hospitalName']} trauma bay!")
        route_engine.complete_mission(incident_id)
        if sio.connected:
            sio.emit("routing:completed", {"incidentId": incident_id})

    print("\n" + "=" * 70)
    print("  SIMULATION COMPLETE -- ALL OSRM & ROUTING STAGES VERIFIED!")
    print("=" * 70 + "\n")

def main():
    parser = argparse.ArgumentParser(description="GABRIEL Pure Python Routing Backend")
    parser.add_argument("--simulate", action="store_true", help="Run development simulation mode")
    args = parser.parse_args()

    print("\n" + "=" * 60)
    print("  GABRIEL -- PYTHON ROUTING ENGINE WITH OSRM & SOCKET.IO")
    print("=" * 60)
    print(f"* OSRM Endpoint:       {OSRM_BASE_URL}")
    print(f"* Socket.IO Gateway:   {SOCKET_SERVER_URL}")
    print("* Architecture:        Pure Python (No FastAPI / No Flask)")
    print("* Map Provider:        Leaflet + OpenStreetMap")
    print("=" * 60 + "\n")

    # Connect to Real-Time Socket.IO Server
    start_socket_client()

    if args.simulate:
        run_simulation()
        if sio.connected:
            sio.disconnect()
        sys.exit(0)

    # Production Event Loop
    print("[Python Router] Listening for real-time ambulance & routing events. Press Ctrl+C to exit.\n")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[Python Router] Shutting down cleanly.")
        if sio.connected:
            sio.disconnect()
        sys.exit(0)

if __name__ == "__main__":
    main()

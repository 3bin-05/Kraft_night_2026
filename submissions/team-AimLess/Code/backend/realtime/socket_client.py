"""
Socket.IO Client for Python Routing Backend
Listens to ambulance GPS and incident status events, orchestrates OSRM routing,
and broadcasts routing updates back to Next.js clients.
"""
import time
import socketio
from typing import Dict, Any, Optional
from backend.config import SOCKET_SERVER_URL
from backend.routing.route_engine import route_engine
from backend.services.ambulance_service import db_service

sio = socketio.Client(reconnection=True, reconnection_attempts=0, reconnection_delay=2)

@sio.event
def connect():
    print(f"\n[SocketIO Client] Connected to GABRIEL Real-Time Gateway at {SOCKET_SERVER_URL}")
    sio.emit("routing:service_online", {
        "service": "GABRIEL_PYTHON_ROUTER",
        "status": "READY",
        "timestamp": time.time()
    })

@sio.event
def disconnect():
    print("\n[SocketIO Client] Disconnected from Real-Time Gateway.")

@sio.on("ambulance:assigned")
def on_ambulance_assigned(data: Dict[str, Any]):
    """Triggered when an ambulance is assigned to an emergency mission."""
    try:
        incident = data.get("incident", {})
        incident_id = data.get("incidentId") or incident.get("id")
        ambulance_id = data.get("ambulanceId") or incident.get("assignedAmbulanceId")

        if not (incident_id and ambulance_id):
            return

        loc = incident.get("location", {})
        accident_lat = float(loc.get("latitude", 0))
        accident_lng = float(loc.get("longitude", 0))
        severity = incident.get("severity", "MODERATE")

        # Get ambulance position
        ambulances = db_service.get_ambulances()
        amb = next((a for a in ambulances if a["id"] == ambulance_id or a["vehicle_number"] == ambulance_id), None)

        amb_lat = float(amb["latitude"]) if amb else accident_lat - 0.015
        amb_lng = float(amb["longitude"]) if amb else accident_lng - 0.015

        print(f"[SocketIO] Initiating Stage 1 (To Accident) for Incident #{incident_id} -> Ambulance {ambulance_id}")

        result = route_engine.init_mission(
            incident_id=incident_id,
            ambulance_id=ambulance_id,
            accident_lat=accident_lat,
            accident_lng=accident_lng,
            ambulance_lat=amb_lat,
            ambulance_lng=amb_lng,
            severity=severity
        )

        sio.emit("routing:start", result)
    except Exception as err:
        print(f"[SocketIO] Error in on_ambulance_assigned: {err}")
        sio.emit("routing:error", {"error": str(err), "context": "ambulance:assigned"})

@sio.on("incident:status_changed")
def on_incident_status_changed(data: Dict[str, Any]):
    """Triggered when incident status changes (e.g. PATIENT_PICKED_UP -> Trigger Stage 2 to Hospital)."""
    try:
        incident_id = data.get("incidentId")
        status = data.get("status", "").upper()
        incident = data.get("incident", {})

        if not incident_id:
            return

        if status in ["PATIENT_PICKED_UP", "EN_ROUTE_TO_HOSPITAL", "HOSPITAL_NOTIFIED"]:
            print(f"[SocketIO] Patient Picked Up! Transitioning Incident #{incident_id} to Stage 2 (To Hospital)")

            target_hospital_id = incident.get("targetHospitalId")

            result = route_engine.update_to_hospital_stage(
                incident_id=incident_id,
                hospital_id=target_hospital_id
            )

            if result:
                sio.emit("routing:start", result)
                sio.emit("hospital:eta_updated", {
                    "incidentId": incident_id,
                    "hospitalId": result.get("hospitalId"),
                    "eta": f"{result.get('etaMinutes')} min",
                    "distanceKm": result.get("distanceKm")
                })
        elif status == "CLOSED":
            print(f"[SocketIO] Incident #{incident_id} Closed. Completing routing mission.")
            route_engine.complete_mission(incident_id)
            sio.emit("routing:completed", {"incidentId": incident_id})
    except Exception as err:
        print(f"[SocketIO] Error in on_incident_status_changed: {err}")

@sio.on("ambulance:location_updated")
def on_ambulance_location_updated(data: Dict[str, Any]):
    """Triggered on live ambulance GPS updates."""
    try:
        ambulance_id = data.get("ambulanceId")
        lat = float(data.get("latitude", 0))
        lng = float(data.get("longitude", 0))
        speed = data.get("speed")
        heading = data.get("heading")
        incident_id = data.get("incidentId")

        if not (ambulance_id and lat and lng):
            return

        # 1. Update database telemetry record
        db_service.update_ambulance_location(ambulance_id, lat, lng, speed, heading)

        # 2. Process routing update with throttling
        update_payload, reroute_payload = route_engine.process_gps_update(
            ambulance_id=ambulance_id,
            latitude=lat,
            longitude=lng,
            incident_id=incident_id
        )

        if update_payload:
            sio.emit("routing:update", update_payload)

            # Emit ETA to hospital
            if update_payload.get("stage") == "TO_HOSPITAL":
                sio.emit("hospital:eta_updated", {
                    "incidentId": update_payload.get("incidentId"),
                    "ambulanceId": ambulance_id,
                    "eta": f"{update_payload.get('etaMinutes')} min",
                    "distanceKm": update_payload.get("distanceKm")
                })

        if reroute_payload:
            print(f"[SocketIO] [REROUTE] Dynamic reroute detected for Ambulance {ambulance_id}: Save {reroute_payload.get('savingsMinutes')} min")
            sio.emit("routing:reroute", reroute_payload)
    except Exception as err:
        print(f"[SocketIO] Error in on_ambulance_location_updated: {err}")

@sio.on("routing:request")
def on_routing_request(data: Dict[str, Any]):
    """Handles direct on-demand route calculation requests."""
    try:
        origin = data.get("origin", {})
        dest = data.get("destination", {})

        from backend.routing.osrm import osrm_client
        res = osrm_client.get_route(
            origin_lat=float(origin.get("latitude", 0)),
            origin_lng=float(origin.get("longitude", 0)),
            dest_lat=float(dest.get("latitude", 0)),
            dest_lng=float(dest.get("longitude", 0))
        )
        sio.emit("routing:response", res.to_dict())
    except Exception as err:
        sio.emit("routing:error", {"error": str(err)})

def start_socket_client():
    """Connects the Socket.IO client and enters event loop."""
    connected = False
    for attempt in range(5):
        try:
            print(f"[SocketIO] Connecting to {SOCKET_SERVER_URL} (Attempt {attempt + 1})...")
            sio.connect(SOCKET_SERVER_URL, transports=["websocket", "polling"])
            connected = True
            break
        except Exception as e:
            print(f"[SocketIO] Gateway not reachable yet ({e}). Retrying in 2 seconds...")
            time.sleep(2)

    if not connected:
        print(f"[SocketIO Warning] Real-Time Gateway at {SOCKET_SERVER_URL} is offline. Python router running in standalone event-wait mode.")

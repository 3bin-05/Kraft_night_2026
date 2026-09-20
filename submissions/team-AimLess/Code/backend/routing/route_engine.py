"""
GABRIEL Route Engine
Manages Stage 1 (Ambulance -> Accident) and Stage 2 (Ambulance with Patient -> Hospital),
state separation, GPS throttling, and dynamic rerouting comparison.
"""
import time
import datetime
from typing import Dict, Any, Optional, Tuple, List
from backend.config import (
    ROUTE_RECALC_INTERVAL_SECONDS,
    MIN_DISTANCE_RECALC_METERS,
    REROUTE_SAVINGS_MINUTES_THRESHOLD
)
from backend.routing.osrm import osrm_client, calculate_haversine_distance_km
from backend.routing.hospital_router import hospital_router
from backend.models.route_models import OSRMRouteResult, HospitalCandidateRoute

class ActiveMissionRouteState:
    def __init__(
        self,
        incident_id: str,
        ambulance_id: str,
        accident_lat: float,
        accident_lng: float,
        severity: str = "MODERATE"
    ):
        self.incident_id = incident_id
        self.ambulance_id = ambulance_id
        self.severity = severity

        # Separate location state tracking
        self.accident_location: Tuple[float, float] = (accident_lat, accident_lng)
        self.ambulance_current_location: Tuple[float, float] = (accident_lat, accident_lng)
        self.hospital_location: Optional[Tuple[float, float]] = None
        self.target_hospital_id: Optional[str] = None
        self.target_hospital_name: Optional[str] = None

        # Stage: "TO_ACCIDENT" (Stage 1) or "TO_HOSPITAL" (Stage 2)
        self.stage: str = "TO_ACCIDENT"

        # Route and throttling state
        self.last_recalc_time: float = 0.0
        self.last_recalc_location: Optional[Tuple[float, float]] = None
        self.current_route: Optional[OSRMRouteResult] = None
        self.recommended_hospital: Optional[HospitalCandidateRoute] = None
        self.alternative_hospitals: List[HospitalCandidateRoute] = []

class RouteEngine:
    def __init__(self):
        self.active_missions: Dict[str, ActiveMissionRouteState] = {}

    def init_mission(
        self,
        incident_id: str,
        ambulance_id: str,
        accident_lat: float,
        accident_lng: float,
        ambulance_lat: float,
        ambulance_lng: float,
        severity: str = "MODERATE"
    ) -> Dict[str, Any]:
        """Initializes a new active emergency routing session in Stage 1 (To Accident)."""
        state = ActiveMissionRouteState(
            incident_id=incident_id,
            ambulance_id=ambulance_id,
            accident_lat=accident_lat,
            accident_lng=accident_lng,
            severity=severity
        )
        state.ambulance_current_location = (ambulance_lat, ambulance_lng)
        state.stage = "TO_ACCIDENT"

        # Calculate initial route to accident scene
        route = osrm_client.get_route(
            origin_lat=ambulance_lat,
            origin_lng=ambulance_lng,
            dest_lat=accident_lat,
            dest_lng=accident_lng
        )
        state.current_route = route
        state.last_recalc_time = time.time()
        state.last_recalc_location = (ambulance_lat, ambulance_lng)

        self.active_missions[incident_id] = state

        return {
            "incidentId": incident_id,
            "ambulanceId": ambulance_id,
            "stage": "TO_ACCIDENT",
            "origin": {"latitude": ambulance_lat, "longitude": ambulance_lng},
            "destination": {"latitude": accident_lat, "longitude": accident_lng},
            "distanceKm": route.distance_km,
            "etaMinutes": route.duration_minutes,
            "routeGeometry": route.route_geometry,
            "providerStatus": route.provider_status,
            "timestamp": route.timestamp,
            "stepsSummary": route.steps_summary
        }

    def update_to_hospital_stage(
        self,
        incident_id: str,
        hospital_id: Optional[str] = None,
        hospital_lat: Optional[float] = None,
        hospital_lng: Optional[float] = None,
        hospital_name: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Transitions routing session to Stage 2 (To Hospital) after patient is picked up."""
        state = self.active_missions.get(incident_id)
        if not state:
            return None

        state.stage = "TO_HOSPITAL"
        amb_lat, amb_lng = state.ambulance_current_location

        # If hospital coordinates are provided directly, set them
        if hospital_lat and hospital_lng:
            state.target_hospital_id = hospital_id
            state.target_hospital_name = hospital_name or "Target Hospital"
            state.hospital_location = (hospital_lat, hospital_lng)

            route = osrm_client.get_route(
                origin_lat=amb_lat,
                origin_lng=amb_lng,
                dest_lat=hospital_lat,
                dest_lng=hospital_lng
            )
            state.current_route = route
            state.last_recalc_time = time.time()
            state.last_recalc_location = (amb_lat, amb_lng)

            return {
                "incidentId": incident_id,
                "ambulanceId": state.ambulance_id,
                "hospitalId": hospital_id,
                "hospitalName": state.target_hospital_name,
                "stage": "TO_HOSPITAL",
                "origin": {"latitude": amb_lat, "longitude": amb_lng},
                "destination": {"latitude": hospital_lat, "longitude": hospital_lng},
                "distanceKm": route.distance_km,
                "etaMinutes": route.duration_minutes,
                "routeGeometry": route.route_geometry,
                "providerStatus": route.provider_status,
                "timestamp": route.timestamp,
                "stepsSummary": route.steps_summary,
                "alternativeHospitals": []
            }

        # Otherwise evaluate and rank all capable hospitals via OSRM
        primary, alts, filtered = hospital_router.evaluate_and_rank_hospitals(
            ambulance_lat=amb_lat,
            ambulance_lng=amb_lng,
            severity=state.severity
        )

        if primary:
            state.recommended_hospital = primary
            state.alternative_hospitals = alts
            state.target_hospital_id = primary.hospital_id
            state.target_hospital_name = primary.hospital_name

            # Set destination coordinates from primary hospital geometry endpoint
            dest_pt = primary.route_geometry[-1] if primary.route_geometry else (amb_lat, amb_lng)
            state.hospital_location = dest_pt

            state.current_route = OSRMRouteResult(
                distance_km=primary.distance_km,
                duration_minutes=primary.eta_minutes,
                route_geometry=primary.route_geometry,
                provider_status="OK",
                provider_name="OSRM",
                timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat()
            )

            state.last_recalc_time = time.time()
            state.last_recalc_location = (amb_lat, amb_lng)

            return {
                "incidentId": incident_id,
                "ambulanceId": state.ambulance_id,
                "hospitalId": primary.hospital_id,
                "hospitalName": primary.hospital_name,
                "hospitalCode": primary.hospital_code,
                "availableBeds": primary.available_beds,
                "stage": "TO_HOSPITAL",
                "origin": {"latitude": amb_lat, "longitude": amb_lng},
                "destination": {"latitude": dest_pt[0], "longitude": dest_pt[1]},
                "distanceKm": primary.distance_km,
                "etaMinutes": primary.eta_minutes,
                "routeGeometry": primary.route_geometry,
                "providerStatus": "OK",
                "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "recommendationReason": primary.recommendation_reason,
                "alternativeHospitals": [alt.to_dict() for alt in alts]
            }

        return None

    def process_gps_update(
        self,
        ambulance_id: str,
        latitude: float,
        longitude: float,
        incident_id: Optional[str] = None
    ) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
        """
        Processes ambulance live GPS coordinates with configurable throttling.
        Returns:
          (route_update_payload, optional_reroute_payload)
        """
        # Find active mission
        state = None
        if incident_id and incident_id in self.active_missions:
            state = self.active_missions[incident_id]
        else:
            for m in self.active_missions.values():
                if m.ambulance_id == ambulance_id:
                    state = m
                    break

        if not state:
            return None, None

        state.ambulance_current_location = (latitude, longitude)
        now = time.time()

        # Check throttling conditions
        time_elapsed = now - state.last_recalc_time
        dist_moved_km = 0.0
        if state.last_recalc_location:
            dist_moved_km = calculate_haversine_distance_km(
                state.last_recalc_location[0], state.last_recalc_location[1],
                latitude, longitude
            )
        dist_moved_meters = dist_moved_km * 1000.0

        # Only recalculate OSRM if throttle limits are met
        should_recalc = (
            time_elapsed >= ROUTE_RECALC_INTERVAL_SECONDS and
            dist_moved_meters >= MIN_DISTANCE_RECALC_METERS
        )

        if not should_recalc and state.current_route is not None:
            # Return lightweight update with current route
            return {
                "incidentId": state.incident_id,
                "ambulanceId": state.ambulance_id,
                "stage": state.stage,
                "currentLocation": {"latitude": latitude, "longitude": longitude},
                "distanceKm": state.current_route.distance_km,
                "etaMinutes": state.current_route.duration_minutes,
                "routeGeometry": state.current_route.route_geometry,
                "throttled": True
            }, None

        # Determine current destination based on stage
        if state.stage == "TO_ACCIDENT":
            dest_lat, dest_lng = state.accident_location
            dest_name = "Accident Scene"
        else:
            if state.hospital_location:
                dest_lat, dest_lng = state.hospital_location
            else:
                dest_lat, dest_lng = state.accident_location
            dest_name = state.target_hospital_name or "Hospital"

        new_route = osrm_client.get_route(
            origin_lat=latitude,
            origin_lng=longitude,
            dest_lat=dest_lat,
            dest_lng=dest_lng
        )

        previous_eta = state.current_route.duration_minutes if state.current_route else new_route.duration_minutes

        state.current_route = new_route
        state.last_recalc_time = now
        state.last_recalc_location = (latitude, longitude)

        update_payload = {
            "incidentId": state.incident_id,
            "ambulanceId": state.ambulance_id,
            "stage": state.stage,
            "destinationName": dest_name,
            "currentLocation": {"latitude": latitude, "longitude": longitude},
            "destination": {"latitude": dest_lat, "longitude": dest_lng},
            "distanceKm": new_route.distance_km,
            "etaMinutes": new_route.duration_minutes,
            "routeGeometry": new_route.route_geometry,
            "providerStatus": new_route.provider_status,
            "timestamp": new_route.timestamp,
            "throttled": False
        }

        # Check dynamic rerouting: if significant time savings detected
        reroute_payload = None
        time_diff = previous_eta - new_route.duration_minutes
        if time_diff >= REROUTE_SAVINGS_MINUTES_THRESHOLD:
            reroute_payload = {
                "incidentId": state.incident_id,
                "ambulanceId": state.ambulance_id,
                "previousEtaMinutes": previous_eta,
                "newEtaMinutes": new_route.duration_minutes,
                "savingsMinutes": round(time_diff, 1),
                "distanceKm": new_route.distance_km,
                "routeGeometry": new_route.route_geometry,
                "message": f"Faster road corridor available: Save {round(time_diff, 1)} min."
            }

        return update_payload, reroute_payload

    def complete_mission(self, incident_id: str):
        """Cleans up completed mission session."""
        if incident_id in self.active_missions:
            del self.active_missions[incident_id]

route_engine = RouteEngine()

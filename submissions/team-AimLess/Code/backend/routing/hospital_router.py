"""
Hospital Router
Compares driving routes via OSRM to all capable and available hospitals,
recommending the fastest suitable facility by road duration.
"""
from typing import List, Dict, Any, Optional, Tuple
from backend.routing.osrm import osrm_client, calculate_haversine_distance_km
from backend.services.ambulance_service import db_service
from backend.models.route_models import HospitalCandidateRoute

class HospitalRouter:
    def __init__(self):
        pass

    def evaluate_and_rank_hospitals(
        self,
        ambulance_lat: float,
        ambulance_lng: float,
        severity: str,
        hospitals_override: Optional[List[Dict[str, Any]]] = None
    ) -> Tuple[Optional[HospitalCandidateRoute], List[HospitalCandidateRoute], List[Dict[str, str]]]:
        """
        Evaluates capable hospitals for a given injury severity, queries OSRM for actual driving ETA,
        and returns:
          1. Best recommended hospital route (fastest driving ETA)
          2. Alternative suitable hospital routes
          3. Filtered out hospitals with reasons
        """
        severity_norm = severity.strip().upper() if severity else "MODERATE"
        hospitals = hospitals_override if hospitals_override is not None else db_service.get_hospitals()

        suitable_candidates: List[Dict[str, Any]] = []
        filtered_out: List[Dict[str, str]] = []

        # Step 1: Filter capable & available hospitals
        for h in hospitals:
            h_id = h.get("id", "")
            h_name = h.get("name", "Unknown Hospital")
            h_code = h.get("code", "")
            beds = h.get("available_beds", h.get("availableBeds", 0))
            handled = h.get("handled_severities", h.get("handledSeverities", [])) or []

            # Normalize handled severities list
            handled_upper = [s.upper() for s in handled]

            # Rule check: Facility must handle the specific severity
            if handled_upper and severity_norm not in handled_upper:
                filtered_out.append({
                    "hospitalId": h_id,
                    "hospitalName": h_name,
                    "reason": f"Facility not accredited for {severity_norm} acuity (Accredited: {', '.join(handled_upper)})"
                })
                continue

            # Rule check: Facility must have available beds/capacity
            if beds <= 0:
                filtered_out.append({
                    "hospitalId": h_id,
                    "hospitalName": h_name,
                    "reason": "Facility is at maximum emergency capacity (0 beds available)"
                })
                continue

            suitable_candidates.append(h)

        # If no capable hospital has beds, fallback to all capable hospitals
        if not suitable_candidates and filtered_out:
            capable_hospitals = [
                h for h in hospitals
                if not h.get("handled_severities") or severity_norm in [s.upper() for s in h.get("handled_severities", [])]
            ]
            suitable_candidates = capable_hospitals or hospitals

        # Step 2: Query OSRM for each suitable hospital
        candidate_routes: List[HospitalCandidateRoute] = []

        for h in suitable_candidates:
            h_lat = float(h.get("latitude", 0))
            h_lng = float(h.get("longitude", 0))

            if not (h_lat and h_lng):
                continue

            osrm_result = osrm_client.get_route(
                origin_lat=ambulance_lat,
                origin_lng=ambulance_lng,
                dest_lat=h_lat,
                dest_lng=h_lng
            )

            route_obj = HospitalCandidateRoute(
                hospital_id=h.get("id", ""),
                hospital_name=h.get("name", ""),
                hospital_code=h.get("code", ""),
                available_beds=int(h.get("available_beds", h.get("availableBeds", 0))),
                distance_km=osrm_result.distance_km,
                eta_minutes=osrm_result.duration_minutes,
                route_geometry=osrm_result.route_geometry,
                is_recommended=False,
                recommendation_reason=""
            )
            candidate_routes.append(route_obj)

        if not candidate_routes:
            return None, [], filtered_out

        # Step 3: Compare by fastest driving duration (eta_minutes)
        candidate_routes.sort(key=lambda r: (r.eta_minutes, r.distance_km))

        # Designate primary recommendation
        primary = candidate_routes[0]
        primary.is_recommended = True
        primary.recommendation_reason = (
            f"Fastest road corridor ({primary.eta_minutes} min ETA, {primary.distance_km} km) "
            f"with {primary.available_beds} verified emergency beds available."
        )

        alternatives = candidate_routes[1:]
        for alt in alternatives:
            alt.recommendation_reason = f"Alternative trauma option ({alt.eta_minutes} min ETA, {alt.available_beds} beds)."

        return primary, alternatives, filtered_out

hospital_router = HospitalRouter()

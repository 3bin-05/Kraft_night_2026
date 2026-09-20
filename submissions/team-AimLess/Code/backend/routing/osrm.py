"""
OSRM (Open Source Routing Machine) Client
Calculates road-network distance, driving duration, and polyline coordinates.
"""
import math
import time
import datetime
import requests
from typing import Tuple, List, Optional, Dict, Any
from backend.config import OSRM_BASE_URL, DEFAULT_AMBULANCE_SPEED_KMH
from backend.models.route_models import OSRMRouteResult

def calculate_haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance in kilometers using the Haversine formula."""
    r = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(r * c, 2)

class OSRMClient:
    def __init__(self, base_url: str = OSRM_BASE_URL, timeout_seconds: float = 6.0):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout_seconds

    def get_route(
        self,
        origin_lat: float,
        origin_lng: float,
        dest_lat: float,
        dest_lng: float,
        profile: str = "driving",
        alternative: bool = True
    ) -> OSRMRouteResult:
        """
        Queries OSRM routing service for road navigation between origin and destination coordinates.
        Coordinates in OSRM URL format: {longitude},{latitude};{longitude},{latitude}
        """
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        # Validate coordinate bounds
        if not (-90 <= origin_lat <= 90 and -180 <= origin_lng <= 180 and
                -90 <= dest_lat <= 90 and -180 <= dest_lng <= 180):
            return self._create_fallback_route(
                origin_lat, origin_lng, dest_lat, dest_lng, "INVALID_COORDINATES", now_iso
            )

        # Identical point check
        if abs(origin_lat - dest_lat) < 1e-6 and abs(origin_lng - dest_lng) < 1e-6:
            return OSRMRouteResult(
                distance_km=0.0,
                duration_minutes=0.0,
                duration_seconds=0.0,
                route_geometry=[(origin_lat, origin_lng), (dest_lat, dest_lng)],
                route_coordinates=[[origin_lng, origin_lat], [dest_lng, dest_lat]],
                provider_status="OK",
                provider_name="OSRM",
                timestamp=now_iso,
                steps_summary=["Arrived at destination"]
            )

        url = f"{self.base_url}/route/v1/{profile}/{origin_lng},{origin_lat};{dest_lng},{dest_lat}"
        params = {
            "overview": "full",
            "geometries": "geojson",
            "steps": "true",
            "alternatives": "true" if alternative else "false"
        }

        try:
            response = requests.get(url, params=params, timeout=self.timeout)
            if response.status_code == 200:
                data = response.json()
                if data.get("code") == "Ok" and data.get("routes"):
                    primary_route = data["routes"][0]
                    distance_meters = primary_route.get("distance", 0)
                    duration_sec = primary_route.get("duration", 0)

                    distance_km = round(distance_meters / 1000.0, 2)
                    duration_min = round(duration_sec / 60.0, 1)

                    # Extract GeoJSON coordinates: [[lng, lat], ...]
                    geojson_coords = primary_route.get("geometry", {}).get("coordinates", [])

                    # Convert to Leaflet format: [(lat, lng), ...]
                    leaflet_geometry = [(point[1], point[0]) for point in geojson_coords]

                    # If geometry returned is empty, fallback to endpoints
                    if not leaflet_geometry:
                        leaflet_geometry = [(origin_lat, origin_lng), (dest_lat, dest_lng)]

                    # Extract turn-by-turn steps summary if available
                    steps = []
                    for leg in primary_route.get("legs", []):
                        for step in leg.get("steps", []):
                            name = step.get("name")
                            maneuver = step.get("maneuver", {}).get("type", "")
                            if name:
                                steps.append(f"{maneuver.title()} onto {name}".strip())

                    return OSRMRouteResult(
                        distance_km=distance_km,
                        duration_minutes=duration_min,
                        duration_seconds=duration_sec,
                        route_geometry=leaflet_geometry,
                        route_coordinates=geojson_coords,
                        provider_status="OK",
                        provider_name="OSRM",
                        timestamp=now_iso,
                        steps_summary=steps[:8]
                    )
                else:
                    return self._create_fallback_route(
                        origin_lat, origin_lng, dest_lat, dest_lng, "NO_ROUTE", now_iso
                    )
            else:
                return self._create_fallback_route(
                    origin_lat, origin_lng, dest_lat, dest_lng, f"HTTP_{response.status_code}", now_iso
                )
        except Exception as err:
            return self._create_fallback_route(
                origin_lat, origin_lng, dest_lat, dest_lng, f"NETWORK_ERROR_{type(err).__name__}", now_iso
            )

    def _create_fallback_route(
        self,
        origin_lat: float,
        origin_lng: float,
        dest_lat: float,
        dest_lng: float,
        status: str,
        timestamp: str
    ) -> OSRMRouteResult:
        """Fallback Haversine linear route interpolation if OSRM service is unavailable."""
        dist_km = calculate_haversine_distance_km(origin_lat, origin_lng, dest_lat, dest_lng)
        duration_min = round(max(1.0, (dist_km / DEFAULT_AMBULANCE_SPEED_KMH) * 60.0), 1)

        # Generate 10 smooth interpolation points between origin and destination
        interp_points = []
        num_pts = 10
        for i in range(num_pts + 1):
            t = i / float(num_pts)
            p_lat = origin_lat + t * (dest_lat - origin_lat)
            p_lng = origin_lng + t * (dest_lng - origin_lng)
            interp_points.append((round(p_lat, 6), round(p_lng, 6)))

        geojson_pts = [[p[1], p[0]] for p in interp_points]

        return OSRMRouteResult(
            distance_km=dist_km,
            duration_minutes=duration_min,
            duration_seconds=duration_min * 60.0,
            route_geometry=interp_points,
            route_coordinates=geojson_pts,
            provider_status="FALLBACK",
            provider_name="GABRIEL_HAVERSINE_FALLBACK",
            timestamp=timestamp,
            steps_summary=["Direct road corridor (OSRM fallback active)"]
        )

# Singleton OSRM client instance
osrm_client = OSRMClient()

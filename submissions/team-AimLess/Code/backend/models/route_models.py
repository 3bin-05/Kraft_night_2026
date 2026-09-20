"""
Route and Telemetry Models
"""
from dataclasses import dataclass, field
from typing import List, Optional, Tuple, Dict, Any

@dataclass
class Coordinate:
    latitude: float
    longitude: float

    def to_dict(self) -> Dict[str, float]:
        return {
            "latitude": self.latitude,
            "longitude": self.longitude
        }

@dataclass
class OSRMRouteResult:
    distance_km: float = 0.0
    duration_minutes: float = 0.0
    duration_seconds: float = 0.0
    route_geometry: List[Tuple[float, float]] = field(default_factory=list) # List of (lat, lng) points for Leaflet polyline
    route_coordinates: List[List[float]] = field(default_factory=list) # GeoJSON [[lng, lat], ...]
    provider_status: str = "OK" # "OK", "FALLBACK", "ERROR"
    provider_name: str = "OSRM" # "OSRM"
    timestamp: str = ""
    steps_summary: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "distanceKm": self.distance_km,
            "etaMinutes": self.duration_minutes,
            "durationSeconds": self.duration_seconds,
            "routeGeometry": self.route_geometry,
            "providerStatus": self.provider_status,
            "providerName": self.provider_name,
            "timestamp": self.timestamp,
            "stepsSummary": self.steps_summary
        }

@dataclass
class HospitalCandidateRoute:
    hospital_id: str
    hospital_name: str
    hospital_code: str
    available_beds: int = 0
    distance_km: float = 0.0
    eta_minutes: float = 0.0
    route_geometry: List[Tuple[float, float]] = field(default_factory=list)
    is_recommended: bool = False
    recommendation_reason: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "hospitalId": self.hospital_id,
            "hospitalName": self.hospital_name,
            "hospitalCode": self.hospital_code,
            "availableBeds": self.available_beds,
            "distanceKm": self.distance_km,
            "etaMinutes": self.eta_minutes,
            "routeGeometry": self.route_geometry,
            "isRecommended": self.is_recommended,
            "recommendationReason": self.recommendation_reason
        }

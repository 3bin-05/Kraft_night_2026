"""
Database Service for GABRIEL PostgreSQL instance
Handles fetching authoritative hospital capabilities, ambulance telemetry, and incidents.
"""
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import List, Dict, Any, Optional
from backend.config import DATABASE_URL

class DatabaseService:
    def __init__(self, connection_url: str = DATABASE_URL):
        self.connection_url = connection_url

    def _get_connection(self):
        return psycopg2.connect(self.connection_url, cursor_factory=RealDictCursor)

    def get_hospitals(self) -> List[Dict[str, Any]]:
        """Retrieves all hospitals with capability accreditations and live bed counts."""
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT id, name, code, address, latitude, longitude, phone,
                               status, available_beds, emergency_status, handled_severities
                        FROM hospitals
                        ORDER BY id;
                    """)
                    rows = cur.fetchall()
                    return [dict(r) for r in rows]
        except Exception as err:
            print(f"[DatabaseService] Error fetching hospitals: {err}")
            return []

    def get_ambulances(self) -> List[Dict[str, Any]]:
        """Retrieves all registered ambulance fleet units and their live status."""
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT id, vehicle_number, driver_id, driver_name, driver_phone,
                               status, type, equipment_level, call_sign, base_station,
                               vehicle_model, equipment_list, current_incident_id,
                               current_hospital_id, latitude, longitude, heading, speed
                        FROM ambulances
                        ORDER BY id;
                    """)
                    rows = cur.fetchall()
                    return [dict(r) for r in rows]
        except Exception as err:
            print(f"[DatabaseService] Error fetching ambulances: {err}")
            return []

    def get_incident(self, incident_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves an incident by its ID or incident number."""
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT id, incident_number, reporter_id, reporter_phone,
                               latitude, longitude, accuracy, address, severity,
                               victim_count, description, status, assigned_ambulance_id,
                               target_hospital_id, created_at, updated_at
                        FROM incidents
                        WHERE id = %s OR incident_number = %s;
                    """, (incident_id, incident_id))
                    row = cur.fetchone()
                    return dict(row) if row else None
        except Exception as err:
            print(f"[DatabaseService] Error fetching incident {incident_id}: {err}")
            return None

    def update_ambulance_location(
        self,
        ambulance_id: str,
        latitude: float,
        longitude: float,
        speed: Optional[float] = None,
        heading: Optional[float] = None
    ) -> bool:
        """Updates live ambulance GPS coordinates and logs to ambulance_locations history table."""
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    # 1. Update ambulance current position
                    cur.execute("""
                        UPDATE ambulances
                        SET latitude = %s,
                            longitude = %s,
                            speed = COALESCE(%s, speed),
                            heading = COALESCE(%s, heading),
                            updated_at = NOW()
                        WHERE id = %s OR vehicle_number = %s;
                    """, (latitude, longitude, speed, heading, ambulance_id, ambulance_id))

                    # 2. Log location trail
                    cur.execute("""
                        INSERT INTO ambulance_locations (ambulance_id, latitude, longitude, speed, heading, recorded_at)
                        VALUES (%s, %s, %s, %s, %s, NOW());
                    """, (ambulance_id, latitude, longitude, speed, heading))

                conn.commit()
                return True
        except Exception as err:
            print(f"[DatabaseService] Error updating ambulance location {ambulance_id}: {err}")
            return False

    def update_incident_target_hospital(self, incident_id: str, hospital_id: str) -> bool:
        """Updates assigned hospital for an incident."""
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        UPDATE incidents
                        SET target_hospital_id = %s,
                            updated_at = NOW()
                        WHERE id = %s OR incident_number = %s;
                    """, (hospital_id, incident_id, incident_id))
                conn.commit()
                return True
        except Exception as err:
            print(f"[DatabaseService] Error updating incident target hospital: {err}")
            return False

db_service = DatabaseService()

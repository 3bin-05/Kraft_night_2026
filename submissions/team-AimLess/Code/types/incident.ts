export type IncidentSeverity = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export type IncidentStatus =
  | "REPORTED"
  | "DISPATCHING"
  | "AMBULANCE_ASSIGNED"
  | "AMBULANCE_EN_ROUTE"
  | "PATIENT_PICKED_UP"
  | "HOSPITAL_NOTIFIED"
  | "HOSPITAL_PREPARING"
  | "EN_ROUTE_TO_HOSPITAL"
  | "ARRIVED"
  | "CLOSED";

export interface IncidentLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
}

export interface Incident {
  id: string;
  incidentNumber: string;
  reporterId?: string;
  reporterPhone?: string;
  location: IncidentLocation;
  severity: IncidentSeverity;
  victimCount: number;
  description?: string;
  status: IncidentStatus;
  assignedAmbulanceId?: string;
  targetHospitalId?: string;
  createdAt: string;
  updatedAt: string;
}

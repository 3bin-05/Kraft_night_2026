import { IncidentSeverity } from "./incident";

export type HospitalStatus = "AVAILABLE" | "BUSY" | "CRITICAL" | "FULL";

export type HospitalReadinessState =
  | "IDLE"
  | "ALERT_RECEIVED"
  | "ACKNOWLEDGED"
  | "PREPARING"
  | "READY"
  | "PATIENT_ARRIVED"
  | "CLOSED";

export interface Hospital {
  id: string;
  name: string;
  code: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  status: HospitalStatus;
  availableBeds: number;
  emergencyDepartmentStatus: HospitalReadinessState;
  handledSeverities?: IncidentSeverity[];
  activeIncidentsCount?: number;
}


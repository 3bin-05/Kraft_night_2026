import { IncidentSeverity } from "./incident";
import { AmbulanceLevel } from "./ambulance";

export type UserRole = "CITIZEN" | "AMBULANCE" | "HOSPITAL" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  createdAt?: string;
}

export interface AuthSession {
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: UserRole;
  // Ambulance specifics
  vehicleNumber?: string;
  ambulanceType?: AmbulanceLevel;
  callSign?: string;
  baseStation?: string;
  vehicleModel?: string;
  equipmentLevel?: string;
  equipmentList?: string[];
  // Hospital specifics
  hospitalName?: string;
  hospitalRegistrationNumber?: string;
  address?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  totalBeds?: number;
  handledSeverities?: IncidentSeverity[];
}

export interface AuthResponse {
  user?: User;
  error?: string;
  message?: string;
}

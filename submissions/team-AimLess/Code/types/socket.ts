export interface ServerToClientEvents {
  "incident:created": (incident: unknown) => void;
  "incident:updated": (incident: unknown) => void;
  "incident:status_changed": (data: { incidentId: string; status: string }) => void;
  "ambulance:assigned": (data: { incidentId: string; ambulanceId: string }) => void;
  "ambulance:location_updated": (data: { ambulanceId: string; latitude: number; longitude: number; heading?: number; speed?: number }) => void;
  "ambulance:status_changed": (data: { ambulanceId: string; status: string }) => void;
  "ambulance:eta_updated": (data: { incidentId: string; eta: string; distanceKm?: number }) => void;
  "hospital:alert": (data: { incidentId: string; hospitalId: string; severity: string; victimCount: number; eta: string }) => void;
  "hospital:status_updated": (data: { hospitalId: string; readinessState: string }) => void;
  "notification:new": (notification: { id: string; title: string; message: string; timestamp: string }) => void;
}

export interface ClientToServerEvents {
  "ambulance:update_location": (data: { ambulanceId: string; latitude: number; longitude: number; heading?: number; speed?: number }) => void;
  "incident:join": (incidentId: string) => void;
  "incident:leave": (incidentId: string) => void;
}

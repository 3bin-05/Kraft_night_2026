import React, { useState, useEffect } from "react";
import { Incident, IncidentStatus } from "@/types/incident";
import { Hospital } from "@/types/hospital";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { IncidentTimeline } from "@/components/citizen/IncidentTimeline";
import { HospitalSelectorModal } from "./HospitalSelectorModal";
import { DynamicMap, MapPoint, MapRoute } from "@/components/map/DynamicMap";
import { useSocketEvent, emitSocketEvent } from "@/lib/socket";
import {
  Navigation,
  MapPin,
  Users,
  Building2,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Radio,
  Zap,
  AlertTriangle,
} from "lucide-react";

interface ActiveMissionPanelProps {
  incident: Incident;
  onUpdateStatus: (
    newStatus: IncidentStatus,
    targetHospitalId?: string
  ) => Promise<void>;
  isUpdating?: boolean;
}

interface RerouteData {
  previousEtaMinutes: number;
  newEtaMinutes: number;
  distanceKm: number;
  routeGeometry?: [number, number][];
  hospitalId?: string;
  hospitalName?: string;
}

export function ActiveMissionPanel({
  incident,
  onUpdateStatus,
  isUpdating = false,
}: ActiveMissionPanelProps) {
  const [isHospitalModalOpen, setIsHospitalModalOpen] = useState<boolean>(false);

  // Live real-time OSRM state from Python backend
  const [liveRouteCoords, setLiveRouteCoords] = useState<[number, number][] | null>(null);
  const [liveEtaMinutes, setLiveEtaMinutes] = useState<number | null>(null);
  const [liveDistanceKm, setLiveDistanceKm] = useState<number | null>(null);
  const [liveStatusText, setLiveStatusText] = useState<string>("Active Road Routing");
  const [fasterRouteAlert, setFasterRouteAlert] = useState<RerouteData | null>(null);

  // Real ambulance GPS position
  const [ambPos, setAmbPos] = useState<{ lat: number; lng: number }>({
    lat: incident.location.latitude - 0.006,
    lng: incident.location.longitude - 0.007,
  });

  // Handle hospital selection
  const handleSelectHospital = async (hospital: Hospital) => {
    setIsHospitalModalOpen(false);
    await onUpdateStatus("HOSPITAL_NOTIFIED", hospital.id);

    // Request immediate OSRM route calculation to selected hospital via Socket.IO
    emitSocketEvent("routing:request", {
      incidentId: incident.id,
      stage: 2,
      origin: ambPos,
      destination: {
        latitude: hospital.latitude,
        longitude: hospital.longitude,
      },
      hospitalId: hospital.id,
      hospitalName: hospital.name,
    });
  };

  // ── Listen to Python OSRM Routing Socket Events ──
  useSocketEvent("routing:start", (payload) => {
    if (payload.incidentId && payload.incidentId !== incident.id) return;
    if (payload.distanceKm !== undefined) setLiveDistanceKm(payload.distanceKm);
    if (payload.etaMinutes !== undefined) setLiveEtaMinutes(payload.etaMinutes);
    if (Array.isArray(payload.routeGeometry)) {
      setLiveRouteCoords(payload.routeGeometry);
    }
    setLiveStatusText(payload.stage === "TO_HOSPITAL" ? "En Route to Trauma Center (OSRM)" : "En Route to Accident (OSRM)");
  });

  useSocketEvent("routing:update", (payload) => {
    if (payload.incidentId && payload.incidentId !== incident.id) return;
    if (payload.distanceKm !== undefined) setLiveDistanceKm(payload.distanceKm);
    if (payload.etaMinutes !== undefined) setLiveEtaMinutes(payload.etaMinutes);
    if (Array.isArray(payload.routeGeometry)) {
      setLiveRouteCoords(payload.routeGeometry);
    }
  });

  useSocketEvent("routing:reroute", (payload) => {
    if (payload.incidentId && payload.incidentId !== incident.id) return;
    setFasterRouteAlert({
      previousEtaMinutes: payload.previousEtaMinutes,
      newEtaMinutes: payload.newEtaMinutes,
      distanceKm: payload.distanceKm,
      routeGeometry: payload.routeGeometry,
      hospitalId: payload.hospitalId,
      hospitalName: payload.hospitalName,
    });
  });

  useSocketEvent("ambulance:location_updated", (payload) => {
    if (payload.latitude && payload.longitude) {
      setAmbPos({ lat: payload.latitude, lng: payload.longitude });
    }
  });

  const handleApplyFasterRoute = () => {
    if (!fasterRouteAlert) return;
    setLiveEtaMinutes(fasterRouteAlert.newEtaMinutes);
    setLiveDistanceKm(fasterRouteAlert.distanceKm);
    if (fasterRouteAlert.routeGeometry && Array.isArray(fasterRouteAlert.routeGeometry)) {
      setLiveRouteCoords(fasterRouteAlert.routeGeometry);
    }
    setFasterRouteAlert(null);
  };

  // Map markers & route setup
  const sceneLat = incident.location.latitude;
  const sceneLng = incident.location.longitude;

  const hospitalLat = sceneLat + 0.015;
  const hospitalLng = sceneLng + 0.012;

  const mapMarkers: MapPoint[] = [
    {
      id: "scene",
      latitude: sceneLat,
      longitude: sceneLng,
      title: `Incident #${incident.incidentNumber}`,
      subtitle: `${incident.victimCount} Casualty • ${incident.severity}`,
      type: "accident",
      severity: (incident.severity === "MODERATE" ? "MEDIUM" : incident.severity) as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
      status: incident.status,
    },
    {
      id: "ambulance",
      latitude: ambPos.lat,
      longitude: ambPos.lng,
      title: "Ambulance Unit (You)",
      subtitle: "OSRM Tracked",
      type: "ambulance",
      status: incident.status,
      heading: 55,
      eta: liveEtaMinutes !== null ? `~${liveEtaMinutes.toFixed(1)} min` : undefined,
    },
  ];

  if (
    incident.targetHospitalId ||
    incident.status === "PATIENT_PICKED_UP" ||
    incident.status === "HOSPITAL_NOTIFIED" ||
    incident.status === "EN_ROUTE_TO_HOSPITAL" ||
    incident.status === "ARRIVED"
  ) {
    mapMarkers.push({
      id: "hospital",
      latitude: hospitalLat,
      longitude: hospitalLng,
      title: incident.targetHospitalId ? `Hospital (${incident.targetHospitalId})` : "City Central Emergency Dept",
      subtitle: "Trauma Level 1 Ready",
      type: "hospital",
      status: "TRAUMA CORRIDOR ACTIVE",
    });
  }

  // Fallback linear route if OSRM hasn't delivered yet
  const fallbackCoords: [number, number][] = incident.targetHospitalId
    ? [[ambPos.lat, ambPos.lng], [sceneLat, sceneLng], [hospitalLat, hospitalLng]]
    : [[ambPos.lat, ambPos.lng], [sceneLat, sceneLng]];

  const mapRoute: MapRoute = {
    coordinates: liveRouteCoords && liveRouteCoords.length > 1 ? liveRouteCoords : fallbackCoords,
    distanceKm: liveDistanceKm !== null ? liveDistanceKm : 2.4,
    eta: liveEtaMinutes !== null ? `~${liveEtaMinutes.toFixed(1)} min` : (incident.status === "AMBULANCE_ASSIGNED" || incident.status === "AMBULANCE_EN_ROUTE" ? "03:45" : "05:15"),
  };

  const [mapProvider, setMapProvider] = useState<"google" | "leaflet">("google");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Dynamic Faster Route Detected Alert (Phase 12) */}
      {fasterRouteAlert && (
        <div className="p-5 rounded-[20px] bg-[#141414] text-white border-2 border-amber-500 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slide-up">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-black flex items-center justify-center shrink-0 font-bold shadow-md">
              <Zap className="w-5 h-5 fill-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  FASTER ROUTE AVAILABLE
                </span>
                <Badge variant="default" className="text-[10px] bg-amber-400 text-black font-bold">
                  -{ (fasterRouteAlert.previousEtaMinutes - fasterRouteAlert.newEtaMinutes).toFixed(1) } min
                </Badge>
              </div>
              <div className="text-sm font-bold text-white mt-1">
                Previous ETA: {fasterRouteAlert.previousEtaMinutes.toFixed(1)} min &bull; New ETA: {fasterRouteAlert.newEtaMinutes.toFixed(1)} min ({fasterRouteAlert.distanceKm.toFixed(1)} km)
              </div>
              <div className="text-[11px] text-[#A0A0A0] mt-0.5">
                OSRM road network has determined an optimized transit path to target.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFasterRouteAlert(null)}
              className="border-neutral-700 text-neutral-300 hover:text-white text-xs"
            >
              Dismiss
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleApplyFasterRoute}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider shadow-lg"
            >
              USE NEW ROUTE
            </Button>
          </div>
        </div>
      )}

      {/* Main Tactical Card */}
      <Card variant="surface" className="p-6 sm:p-8 border border-[#141414] shadow-sm">
        {/* Mission Status Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E0E0E0]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#141414] text-white flex items-center justify-center font-bold text-sm">
              <Navigation className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold tracking-widest text-[#707070] uppercase">
                  Active Mission &bull; Google Maps Tactical Corridor
                </span>
                <span className="w-2 h-2 rounded-full bg-green-600 animate-ping" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-mono font-bold text-[#141414]">
                #{incident.incidentNumber}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="dark" className="text-xs px-3.5 py-1 font-bold">
              {incident.status}
            </Badge>
            <Badge variant="default" className="text-xs px-3.5 py-1">
              {incident.severity}
            </Badge>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-6 border-b border-[#E0E0E0] text-xs">
          <div className="p-4 rounded-[16px] bg-white border border-[#E0E0E0]">
            <div className="text-[#707070] mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#141414]" /> Target Coordinates
            </div>
            <div className="text-sm font-mono font-bold text-[#141414]">
              {incident.location.latitude.toFixed(4)}, {incident.location.longitude.toFixed(4)}
            </div>
            <div className="text-[11px] text-[#707070] mt-0.5">Accident Scene locked</div>
          </div>

          <div className="p-4 rounded-[16px] bg-white border border-[#E0E0E0]">
            <div className="text-[#707070] mb-1 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#141414]" /> Casualties
            </div>
            <div className="text-sm font-bold text-[#141414]">
              {incident.victimCount} Person{incident.victimCount > 1 ? "s" : ""}
            </div>
            <div className="text-[11px] text-[#707070] mt-0.5">Paramedic triage active</div>
          </div>

          <div className="p-4 rounded-[16px] bg-white border border-[#E0E0E0]">
            <div className="text-[#707070] mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#141414]" /> Destination Hospital
            </div>
            <div className="text-sm font-bold text-[#141414]">
              {incident.targetHospitalId || "Pending Selection"}
            </div>
            <div className="text-[11px] text-[#707070] mt-0.5">
              {incident.targetHospitalId ? "Trauma alert active" : "Select after pickup"}
            </div>
          </div>

          <div className="p-4 rounded-[16px] bg-white border border-[#E0E0E0]">
            <div className="text-[#707070] mb-1 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-[#141414]" /> Google Maps Stream
            </div>
            <div className="text-sm font-bold text-green-700 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> {liveDistanceKm !== null ? `${liveDistanceKm.toFixed(1)} km · ${liveEtaMinutes?.toFixed(1)}m` : "Live Telemetry"}
            </div>
            <div className="text-[11px] text-[#707070] mt-0.5">{liveStatusText}</div>
          </div>
        </div>

        {/* Tactical Navigation Map (Google Maps + OpenStreetMap Switchable) */}
        <div className="pt-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 px-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#141414] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                {mapProvider === "google" ? "Google Maps Satellite Grid" : "OpenStreetMap Leaflet Grid"}
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F0F0F0] text-[#707070]">
                {mapProvider === "google" ? "API KEY ACTIVE" : "OSM ACTIVE"}
              </span>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <div className="flex items-center bg-[#F0F0F0] p-0.5 rounded-lg text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setMapProvider("google")}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    mapProvider === "google"
                      ? "bg-white text-[#141414] shadow-xs"
                      : "text-[#707070] hover:text-[#141414]"
                  }`}
                >
                  Google Maps
                </button>
                <button
                  type="button"
                  onClick={() => setMapProvider("leaflet")}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    mapProvider === "leaflet"
                      ? "bg-white text-[#141414] shadow-xs"
                      : "text-[#707070] hover:text-[#141414]"
                  }`}
                >
                  OpenStreetMap
                </button>
              </div>

              <span className="text-[11px] font-mono text-[#707070] border-l border-[#E0E0E0] pl-2">
                Dynamic ETA: {mapRoute.eta}
              </span>
            </div>
          </div>

          <DynamicMap
            provider={mapProvider}
            markers={mapMarkers}
            route={mapRoute}
            height="360px"
            zoom={14}
          />
        </div>

        {/* Timeline Progress */}
        <div className="pt-2 pb-6">
          <IncidentTimeline currentStatus={incident.status} />
        </div>

        {/* Operational Driver Control Center */}
        <div className="p-6 rounded-[20px] bg-[#141414] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#ADADAD]">
              Current Action Step
            </div>
            <div className="text-base font-bold text-white mt-0.5">
              {incident.status === "AMBULANCE_ASSIGNED" || incident.status === "AMBULANCE_EN_ROUTE"
                ? "Stage 1: En Route to Accident Scene"
                : incident.status === "PATIENT_PICKED_UP"
                ? "Patient Picked Up • Destination Trauma Center Required"
                : incident.status === "HOSPITAL_NOTIFIED" || incident.status === "EN_ROUTE_TO_HOSPITAL"
                ? "Stage 2: Transporting Patient to Trauma Center"
                : incident.status === "ARRIVED"
                ? "Arrived at Hospital • Emergency Transfer Complete"
                : "Incident Closed"}
            </div>
          </div>

          {/* Action Step Transitions */}
          <div className="shrink-0 flex items-center gap-3">
            {(incident.status === "AMBULANCE_ASSIGNED" || incident.status === "AMBULANCE_EN_ROUTE") && (
              <Button
                variant="secondary"
                size="lg"
                disabled={isUpdating}
                isLoading={isUpdating}
                onClick={() => onUpdateStatus("PATIENT_PICKED_UP")}
                className="bg-white text-[#141414] hover:bg-[#F0F0F0] font-bold text-xs uppercase tracking-wider"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Patient Picked Up
              </Button>
            )}

            {incident.status === "PATIENT_PICKED_UP" && (
              <Button
                variant="secondary"
                size="lg"
                disabled={isUpdating}
                onClick={() => setIsHospitalModalOpen(true)}
                className="bg-white text-[#141414] hover:bg-[#F0F0F0] font-bold text-xs uppercase tracking-wider"
              >
                <Building2 className="w-4 h-4 mr-2" /> Select Destination Hospital
              </Button>
            )}

            {(incident.status === "HOSPITAL_NOTIFIED" || incident.status === "EN_ROUTE_TO_HOSPITAL") && (
              <Button
                variant="secondary"
                size="lg"
                disabled={isUpdating}
                isLoading={isUpdating}
                onClick={() => onUpdateStatus("ARRIVED")}
                className="bg-white text-[#141414] hover:bg-[#F0F0F0] font-bold text-xs uppercase tracking-wider"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Arrived at Hospital
              </Button>
            )}

            {incident.status === "ARRIVED" && (
              <Button
                variant="secondary"
                size="lg"
                disabled={isUpdating}
                isLoading={isUpdating}
                onClick={() => onUpdateStatus("CLOSED")}
                className="bg-white text-[#141414] hover:bg-[#F0F0F0] font-bold text-xs uppercase tracking-wider"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" /> Close Mission &amp; Return Available
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Hospital Selector Modal */}
      <HospitalSelectorModal
        isOpen={isHospitalModalOpen}
        onClose={() => setIsHospitalModalOpen(false)}
        onSelectHospital={handleSelectHospital}
        incident={incident}
        isSubmitting={isUpdating}
      />
    </div>
  );
}

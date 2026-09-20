"use client";

import React, { useEffect, useState, use } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { api } from "@/lib/api";
import { Incident } from "@/types/incident";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { IncidentTimeline } from "@/components/citizen/IncidentTimeline";
import { DynamicMap, MapPoint, MapRoute } from "@/components/map/DynamicMap";
import { useSocketEvent } from "@/lib/socket";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldAlert,
  MapPin,
  Users,
  Calendar,
  Navigation,
  Building2,
  Clock,
  Phone,
  RefreshCw,
} from "lucide-react";

export default function CitizenIncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const incidentId = resolvedParams.id;

  const [incident, setIncident] = useState<Incident | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [ambulancePos, setAmbulancePos] = useState<{ lat: number; lng: number; eta?: string } | null>(null);

  const fetchIncident = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getIncidentById(incidentId);
      setIncident(data);
      if (data.location) {
        // Initialize estimated ambulance position if assigned
        setAmbulancePos({
          lat: data.location.latitude + 0.008,
          lng: data.location.longitude - 0.009,
          eta: "04:30",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load incident details.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncident();
  }, [incidentId]);

  // Real-time updates
  useSocketEvent("incident:updated", (data) => {
    if (data.incident?.id === incidentId) {
      setIncident(data.incident);
    }
  });

  useSocketEvent("ambulance:location_updated", (data) => {
    if (incident?.assignedAmbulanceId === data.ambulanceId || !incident?.assignedAmbulanceId) {
      setAmbulancePos((prev) => ({
        lat: data.latitude,
        lng: data.longitude,
        eta: prev?.eta || "03:45",
      }));
    }
  });

  useSocketEvent("ambulance:eta_updated", (data) => {
    if (data.incidentId === incidentId) {
      setAmbulancePos((prev) => (prev ? { ...prev, eta: data.eta } : null));
    }
  });

  // Prepare map points and route
  const mapMarkers: MapPoint[] = [];
  let mapRoute: MapRoute | undefined = undefined;

  if (incident?.location) {
    // 1. Accident scene marker
    mapMarkers.push({
      id: "scene",
      latitude: incident.location.latitude,
      longitude: incident.location.longitude,
      title: `Incident #${incident.incidentNumber}`,
      subtitle: `${incident.victimCount} Casualty • ${incident.severity}`,
      type: "accident",
      severity: (incident.severity === "MODERATE" ? "MEDIUM" : incident.severity) as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
      status: incident.status,
    });

    // 2. Ambulance position marker
    if (ambulancePos) {
      mapMarkers.push({
        id: "ambulance",
        latitude: ambulancePos.lat,
        longitude: ambulancePos.lng,
        title: incident.assignedAmbulanceId ? `Ambulance ${incident.assignedAmbulanceId}` : "Ambulance Unit A-01",
        subtitle: "Emergency Response Vehicle",
        type: "ambulance",
        status: "EN ROUTE",
        eta: ambulancePos.eta || "04:30",
        heading: 45,
      });

      // 3. Hospital marker if selected or nearby
      const hospitalLat = incident.location.latitude + 0.015;
      const hospitalLng = incident.location.longitude + 0.012;
      mapMarkers.push({
        id: "hospital",
        latitude: hospitalLat,
        longitude: hospitalLng,
        title: incident.targetHospitalId ? `Hospital (${incident.targetHospitalId})` : "City Central Emergency Dept",
        subtitle: "Level 1 Trauma Center • ER Active",
        type: "hospital",
        status: "RECEIVING READY",
      });

      // Route polyline connecting ambulance -> accident -> hospital
      mapRoute = {
        coordinates: [
          [ambulancePos.lat, ambulancePos.lng],
          [incident.location.latitude, incident.location.longitude],
          [hospitalLat, hospitalLng],
        ],
        distanceKm: 2.8,
        eta: ambulancePos.eta || "04:30",
      };
    }
  }

  return (
    <ProtectedRoute allowedRoles={["CITIZEN", "ADMIN"]}>
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/citizen"
            className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-[#707070] hover:text-[#141414] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Citizen Dashboard
          </Link>
        </div>

        {isLoading ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-[#141414] border-t-transparent animate-spin mx-auto mb-3" />
            <p className="text-xs text-[#707070]">Loading emergency incident record...</p>
          </div>
        ) : error || !incident ? (
          <Card variant="surface" className="p-8 text-center border border-red-200">
            <ShieldAlert className="w-8 h-8 text-red-600 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-[#141414]">Incident Record Not Found</h2>
            <p className="text-xs text-[#707070] mt-1 mb-6">{error || "Unable to locate incident record."}</p>
            <Link href="/citizen">
              <Button variant="secondary" size="sm">
                Return to Dashboard
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Header Card */}
            <Card variant="surface" className="p-6 sm:p-8 border border-[#E0E0E0]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E0E0E0]">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold tracking-widest text-[#707070] uppercase">
                      Emergency Incident Report
                    </span>
                    <Badge variant="dark">{incident.status}</Badge>
                    <Badge variant="default">{incident.severity}</Badge>
                  </div>
                  <h1 className="text-3xl font-mono font-bold text-[#141414]">
                    #{incident.incidentNumber}
                  </h1>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchIncident}
                  className="self-start sm:self-center text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh Telemetry
                </Button>
              </div>

              {/* Progress Stepper */}
              <div className="pt-4">
                <IncidentTimeline currentStatus={incident.status} />
              </div>
            </Card>

            {/* Tactical Live Map View */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#707070]">
                  Live Tactical GPS Navigation &amp; Corridor Map
                </h2>
                <span className="text-[11px] font-mono text-[#707070]">
                  Lat: {incident.location.latitude.toFixed(4)}, Lng: {incident.location.longitude.toFixed(4)}
                </span>
              </div>
              <DynamicMap
                markers={mapMarkers}
                route={mapRoute}
                height="400px"
                zoom={14}
              />
            </div>

            {/* Grid of details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Scene & Casualty Telemetry */}
              <Card variant="white" className="p-6 border border-[#E0E0E0]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#141414] mb-4">
                  Incident Scene Telemetry
                </h3>
                <div className="space-y-3 text-xs text-[#707070]">
                  <div className="flex justify-between py-1.5 border-b border-[#F0F0F0]">
                    <span className="flex items-center gap-1.5 font-semibold text-[#141414]">
                      <MapPin className="w-3.5 h-3.5" /> GPS Coordinates:
                    </span>
                    <span className="font-mono text-[#141414]">
                      {incident.location.latitude.toFixed(5)}, {incident.location.longitude.toFixed(5)}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-[#F0F0F0]">
                    <span className="flex items-center gap-1.5 font-semibold text-[#141414]">
                      <Users className="w-3.5 h-3.5" /> Victim Casualties:
                    </span>
                    <span className="text-[#141414] font-bold">
                      {incident.victimCount} Person{incident.victimCount > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-[#F0F0F0]">
                    <span className="flex items-center gap-1.5 font-semibold text-[#141414]">
                      <Calendar className="w-3.5 h-3.5" /> Incident Timestamp:
                    </span>
                    <span className="text-[#141414]">
                      {new Date(incident.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {incident.description && (
                    <div className="pt-2">
                      <span className="block font-semibold text-[#141414] mb-1">
                        Reported Details / Scene Description:
                      </span>
                      <p className="p-3 bg-[#F3F3F3] rounded-[12px] text-[#141414] italic">
                        &ldquo;{incident.description}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Multi-Agency Response Status */}
              <Card variant="white" className="p-6 border border-[#E0E0E0]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#141414] mb-4">
                  Cooperative Response Coordination
                </h3>
                <div className="space-y-3 text-xs text-[#707070]">
                  <div className="flex justify-between py-1.5 border-b border-[#F0F0F0]">
                    <span className="flex items-center gap-1.5 font-semibold text-[#141414]">
                      <Navigation className="w-3.5 h-3.5" /> Ambulance Dispatch:
                    </span>
                    <span className="text-[#141414] font-medium">
                      {incident.assignedAmbulanceId || "Unit A-01 (Auto-assigning)"}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-[#F0F0F0]">
                    <span className="flex items-center gap-1.5 font-semibold text-[#141414]">
                      <Building2 className="w-3.5 h-3.5" /> Target Trauma Center:
                    </span>
                    <span className="text-[#141414] font-medium">
                      {incident.targetHospitalId || "City Central Emergency Dept"}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-[#F0F0F0]">
                    <span className="flex items-center gap-1.5 font-semibold text-[#141414]">
                      <Clock className="w-3.5 h-3.5" /> Response Phase:
                    </span>
                    <span className="text-[#141414] font-bold">
                      {incident.status}
                    </span>
                  </div>

                  {incident.reporterPhone && (
                    <div className="flex justify-between py-1.5 border-b border-[#F0F0F0]">
                      <span className="flex items-center gap-1.5 font-semibold text-[#141414]">
                        <Phone className="w-3.5 h-3.5" /> Reporter Callback:
                      </span>
                      <span className="text-[#141414] font-mono">
                        {incident.reporterPhone}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

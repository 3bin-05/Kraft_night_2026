"use client";

import React, { useEffect, useState, useCallback } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";
import { useSocketEvent, emitSocketEvent } from "@/lib/socket";
import { Incident, IncidentStatus } from "@/types/incident";
import { Ambulance, AmbulanceStatus } from "@/types/ambulance";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AmbulanceTelemetryCard } from "@/components/ambulance/AmbulanceTelemetryCard";
import { IncomingEmergencyAlert } from "@/components/ambulance/IncomingEmergencyAlert";
import { ActiveMissionPanel } from "@/components/ambulance/ActiveMissionPanel";
import {
  Navigation,
  ShieldAlert,
  RefreshCw,
  Activity,
  CheckCircle2,
  MapPin,
  Clock,
} from "lucide-react";

export default function AmbulanceDashboardPage() {
  const { user } = useAuth();

  const [ambulance, setAmbulance] = useState<Ambulance>({
    id: "amb_unit_001",
    vehicleNumber: "Unit A-01 (Rapid Medic)",
    driverId: user?.id || "usr_amb_001",
    driverName: user?.name || "Unit A-01 Driver",
    driverPhone: user?.phone || "+15550000002",
    status: "AVAILABLE",
    latitude: 8.915,
    longitude: 76.633,
    heading: 90,
    speed: 0,
    updatedAt: new Date().toISOString(),
  });

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [incidentsData, ambulancesData] = await Promise.all([
        api.getIncidents("all"),
        api.getAmbulances().catch(() => []),
      ]);

      setIncidents(incidentsData);

      if (ambulancesData.length > 0) {
        setAmbulance(ambulancesData[0]);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Real-time socket event listeners
  useSocketEvent("incident:created", ({ incident }) => {
    setIncidents((prev) => {
      const exists = prev.some((i) => i.id === incident.id);
      if (exists) return prev;
      return [incident, ...prev];
    });
  });

  useSocketEvent("incident:updated", ({ incident }) => {
    setIncidents((prev) =>
      prev.map((i) => (i.id === incident.id ? incident : i))
    );
  });

  // Find active mission for this ambulance
  const activeMission = incidents.find(
    (i) =>
      (i.assignedAmbulanceId === ambulance.id ||
        i.assignedAmbulanceId === ambulance.vehicleNumber ||
        (ambulance.callSign && i.assignedAmbulanceId === ambulance.callSign) ||
        i.assignedAmbulanceId === "Unit A-01 (Rapid Medic)") &&
      i.status !== "CLOSED"
  );

  // Device Geolocation Watcher (Phase 8)
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return;

    let lastEmitTime = 0;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        const { latitude, longitude, heading, speed } = pos.coords;

        // Throttle emissions to at most once per 2 seconds
        if (now - lastEmitTime >= 2000) {
          lastEmitTime = now;

          // Emit to Socket.IO network for Python OSRM router
          emitSocketEvent("ambulance:location_updated", {
            ambulanceId: ambulance.id,
            incidentId: activeMission?.id,
            latitude,
            longitude,
            heading: heading || 0,
            speed: speed ? Math.round(speed * 3.6) : 0,
          });

          // Sync database position in background
          api.updateAmbulance(ambulance.id, {
            latitude,
            longitude,
            heading: heading || 0,
            speed: speed ? Math.round(speed * 3.6) : 0,
          }).catch(() => {});
        }
      },
      (err) => {
        // Fallback silently if user denies browser GPS permission
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 10000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [ambulance.id, activeMission?.id]);

  // Find incoming emergency (an incident waiting in REPORTED, DISPATCHING, or AMBULANCE_ASSIGNED state for this unit)
  const incomingEmergency = incidents.find(
    (i) =>
      !activeMission &&
      (i.status === "REPORTED" ||
        i.status === "DISPATCHING" ||
        ((i.status === "AMBULANCE_ASSIGNED" || i.status === "AMBULANCE_EN_ROUTE") &&
          (i.assignedAmbulanceId === ambulance.id ||
            i.assignedAmbulanceId === ambulance.vehicleNumber ||
            (ambulance.callSign && i.assignedAmbulanceId === ambulance.callSign))))
  );

  // Driver changes ambulance availability status
  const handleAmbulanceStatusChange = async (newStatus: AmbulanceStatus) => {
    setIsUpdatingStatus(true);
    try {
      const res = await api.updateAmbulance(ambulance.id, {
        status: newStatus,
      });
      setAmbulance(res.ambulance);
    } catch {
      setAmbulance((prev) => ({ ...prev, status: newStatus }));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Driver accepts an incoming emergency
  const handleAcceptEmergency = async (incident: Incident) => {
    setIsUpdatingStatus(true);
    try {
      await api.updateIncidentStatus(incident.id, {
        status: "AMBULANCE_EN_ROUTE",
        assignedAmbulanceId: ambulance.vehicleNumber,
      });

      await api.updateAmbulance(ambulance.id, {
        status: "RESPONDING",
        currentIncidentId: incident.id,
      });

      await fetchDashboardData();
    } catch (err) {
      console.error("Failed to accept emergency:", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Driver updates incident lifecycle step (e.g. PATIENT_PICKED_UP, HOSPITAL_NOTIFIED, ARRIVED, CLOSED)
  const handleUpdateIncidentStatus = async (
    newStatus: IncidentStatus,
    targetHospitalId?: string
  ) => {
    if (!activeMission) return;
    setIsUpdatingStatus(true);
    try {
      await api.updateIncidentStatus(activeMission.id, {
        status: newStatus,
        targetHospitalId,
      });

      const newAmbStatus: AmbulanceStatus =
        newStatus === "CLOSED"
          ? "AVAILABLE"
          : newStatus === "PATIENT_PICKED_UP" ||
            newStatus === "HOSPITAL_NOTIFIED" ||
            newStatus === "EN_ROUTE_TO_HOSPITAL"
          ? "TRANSPORTING"
          : "RESPONDING";

      await api.updateAmbulance(ambulance.id, {
        status: newAmbStatus,
        currentIncidentId: newStatus === "CLOSED" ? null : activeMission.id,
        currentHospitalId: targetHospitalId || null,
      });

      await fetchDashboardData();
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["AMBULANCE", "ADMIN"]}>
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-[#E0E0E0]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="dark">Fleet Operations Console</Badge>
              <span className="text-xs text-[#707070]">AIMLESS Response Node</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#141414]">
              Ambulance Driver Command
            </h1>
            <p className="text-sm text-[#707070] mt-1">
              Unit: <strong className="text-[#141414]">{ambulance.vehicleNumber}</strong> • Driver: {ambulance.driverName}
            </p>
          </div>

          <Button
            variant="outline"
            size="md"
            onClick={fetchDashboardData}
            className="text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh Telemetry
          </Button>
        </div>

        {/* Dashboard Content */}
        <div className="mt-8 space-y-8">
          {/* Top: Fleet Telemetry & Availability Control */}
          <AmbulanceTelemetryCard
            ambulance={ambulance}
            onStatusChange={handleAmbulanceStatusChange}
            disabled={isUpdatingStatus}
          />

          {/* Incoming Emergency Dispatch Offer */}
          {incomingEmergency && !activeMission && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-red-600 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 animate-ping" />
                  Dispatch Recommendation
                </h2>
                <Badge variant="dark">Immediate Action Required</Badge>
              </div>
              <IncomingEmergencyAlert
                incident={incomingEmergency}
                onAccept={handleAcceptEmergency}
                isProcessing={isUpdatingStatus}
              />
            </section>
          )}

          {/* Active Tactical Mission Panel */}
          {activeMission && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#141414] flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-700" /> Current Active Mission
                </h2>
                <Badge variant="dark">MISSION IN PROGRESS</Badge>
              </div>
              <ActiveMissionPanel
                incident={activeMission}
                onUpdateStatus={handleUpdateIncidentStatus}
                isUpdating={isUpdatingStatus}
              />
            </section>
          )}

          {/* Standby State */}
          {!activeMission && !incomingEmergency && (
            <Card variant="surface" className="p-8 text-center border border-[#E0E0E0]">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mx-auto mb-3 text-[#141414] shadow-sm">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-base font-bold text-[#141414]">Ambulance On Standby</h3>
              <p className="text-xs text-[#707070] mt-1 max-w-md mx-auto">
                No active dispatches currently assigned to this unit. Maintain operational readiness. New road accident reports will trigger real-time dispatch alerts here.
              </p>
            </Card>
          )}

          {/* System Incident Overview Table */}
          <section className="space-y-4 pt-4 border-t border-[#E0E0E0]">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#141414]">
                Recent Emergency Network Incidents
              </h3>
              <span className="text-xs font-mono text-[#707070]">
                {incidents.length} Total Registered
              </span>
            </div>

            <div className="space-y-2.5">
              {incidents.slice(0, 5).map((inc) => (
                <div
                  key={inc.id}
                  className="p-4 rounded-[16px] bg-white border border-[#E0E0E0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#F0F0F0] text-[#141414] flex items-center justify-center font-bold text-xs shrink-0">
                      SOS
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[#141414]">
                          #{inc.incidentNumber}
                        </span>
                        <Badge variant="dark" className="text-[10px] px-2 py-0.5">
                          {inc.status}
                        </Badge>
                        <Badge variant="default" className="text-[10px] px-2 py-0.5">
                          {inc.severity}
                        </Badge>
                      </div>
                      <div className="text-[#707070] mt-0.5 flex items-center gap-3">
                        <span className="font-mono">
                          {inc.location.latitude.toFixed(4)}, {inc.location.longitude.toFixed(4)}
                        </span>
                        <span>• {inc.victimCount} Casualty(s)</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-[#707070]">
                    <div>Assigned: {inc.assignedAmbulanceId || "Unassigned"}</div>
                    <div>{new Date(inc.createdAt).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </ProtectedRoute>
  );
}

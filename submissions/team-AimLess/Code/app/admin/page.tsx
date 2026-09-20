"use client";

import React, { useEffect, useState, useCallback } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";
import { useSocketEvent } from "@/lib/socket";
import { Incident, IncidentStatus } from "@/types/incident";
import { Ambulance } from "@/types/ambulance";
import { Hospital } from "@/types/hospital";
import { User } from "@/types/auth";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AdminMetricsOverview } from "@/components/admin/AdminMetricsOverview";
import { AdminIncidentsTable } from "@/components/admin/AdminIncidentsTable";
import { AdminAmbulanceMonitor } from "@/components/admin/AdminAmbulanceMonitor";
import { AdminHospitalMonitor } from "@/components/admin/AdminHospitalMonitor";
import { AdminUserManagement } from "@/components/admin/AdminUserManagement";
import { DynamicMap, MapPoint } from "@/components/map/DynamicMap";
import {
  ShieldAlert,
  Activity,
  Navigation,
  Building2,
  Users,
  RefreshCw,
  LayoutDashboard,
  Map as MapIcon,
} from "lucide-react";

type AdminTab = "OVERVIEW" | "MAP" | "INCIDENTS" | "AMBULANCES" | "HOSPITALS" | "USERS";

export default function AdminDashboardPage() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<AdminTab>("OVERVIEW");
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchAdminData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [incData, ambData, hospData, usersData] = await Promise.all([
        api.getIncidents("all").catch(() => []),
        api.getAmbulances().catch(() => []),
        api.getHospitals().catch(() => []),
        api.getUsers().catch(() => []),
      ]);

      setIncidents(incData);
      setAmbulances(ambData);
      setHospitals(hospData);
      setUsers(usersData);
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  // Real-time socket event subscriptions
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

  useSocketEvent("ambulance:status_changed", ({ ambulanceId, status }) => {
    setAmbulances((prev) =>
      prev.map((a) =>
        a.id === ambulanceId ? { ...a, status: status as any } : a
      )
    );
  });

  useSocketEvent("ambulance:location_updated", ({ ambulanceId, latitude, longitude }) => {
    setAmbulances((prev) =>
      prev.map((a) =>
        a.id === ambulanceId
          ? { ...a, latitude, longitude, updatedAt: new Date().toISOString() }
          : a
      )
    );
  });

  useSocketEvent("hospital:status_updated", ({ hospitalId, availableBeds, readinessState }) => {
    setHospitals((prev) =>
      prev.map((h) =>
        h.id === hospitalId
          ? {
              ...h,
              availableBeds: availableBeds !== undefined ? availableBeds : h.availableBeds,
              emergencyDepartmentStatus: (readinessState as any) || h.emergencyDepartmentStatus,
            }
          : h
      )
    );
  });

  const handleUpdateIncidentStatus = async (
    incidentId: string,
    status: IncidentStatus
  ) => {
    try {
      await api.updateIncidentStatus(incidentId, { status });
      await fetchAdminData();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  // Helper: map IncidentSeverity ('MODERATE') to MapPoint severity ('MEDIUM')
  const toMapSeverity = (s: string): "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | undefined => {
    if (s === "CRITICAL") return "CRITICAL";
    if (s === "HIGH") return "HIGH";
    if (s === "MODERATE" || s === "MEDIUM") return "MEDIUM";
    if (s === "LOW") return "LOW";
    return undefined;
  };

  // Compile system-wide map markers
  const systemMapMarkers: MapPoint[] = [];

  // 1. Incidents
  incidents
    .filter((i) => i.status !== "CLOSED")
    .forEach((inc) => {
      systemMapMarkers.push({
        id: `inc-${inc.id}`,
        latitude: inc.location.latitude,
        longitude: inc.location.longitude,
        title: `Incident #${inc.incidentNumber}`,
        subtitle: `${inc.victimCount} Casualty • ${inc.severity}`,
        type: "accident",
        severity: toMapSeverity(inc.severity),
        status: inc.status,
      });
    });

  // 2. Ambulances
  ambulances.forEach((amb) => {
    systemMapMarkers.push({
      id: `amb-${amb.id}`,
      latitude: amb.latitude,
      longitude: amb.longitude,
      title: amb.vehicleNumber,
      subtitle: `Driver: ${amb.driverName}`,
      type: "ambulance",
      status: amb.status,
      heading: 60,
    });
  });

  // 3. Hospitals
  hospitals.forEach((hosp) => {
    systemMapMarkers.push({
      id: `hosp-${hosp.id}`,
      latitude: hosp.latitude,
      longitude: hosp.longitude,
      title: hosp.name,
      subtitle: `${hosp.availableBeds} Beds • ${hosp.emergencyDepartmentStatus}`,
      type: "hospital",
      status: hosp.emergencyDepartmentStatus,
    });
  });

  const TABS: Array<{ id: AdminTab; label: string; icon: React.ReactNode }> = [
    {
      id: "OVERVIEW",
      label: "System Overview",
      icon: <LayoutDashboard className="w-3.5 h-3.5" />,
    },
    {
      id: "MAP",
      label: `Tactical Grid Map (${systemMapMarkers.length})`,
      icon: <MapIcon className="w-3.5 h-3.5" />,
    },
    {
      id: "INCIDENTS",
      label: `Incidents (${incidents.length})`,
      icon: <Activity className="w-3.5 h-3.5" />,
    },
    {
      id: "AMBULANCES",
      label: `Fleet (${ambulances.length})`,
      icon: <Navigation className="w-3.5 h-3.5" />,
    },
    {
      id: "HOSPITALS",
      label: `Trauma Centers (${hospitals.length})`,
      icon: <Building2 className="w-3.5 h-3.5" />,
    },
    {
      id: "USERS",
      label: `Users (${users.length})`,
      icon: <Users className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-[#E0E0E0]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="dark">Executive Oversight</Badge>
              <span className="text-xs text-[#707070]">AIMLESS Central Command</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#141414]">
              Emergency Command &amp; Control
            </h1>
            <p className="text-sm text-[#707070] mt-1">
              Live multi-agency operational visibility • Administrator: <strong className="text-[#141414]">{user?.name}</strong>
            </p>
          </div>

          <Button
            variant="outline"
            size="md"
            onClick={fetchAdminData}
            className="text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh Network
          </Button>
        </div>

        {/* Top Metric Cards */}
        <div className="mt-8">
          <AdminMetricsOverview
            incidents={incidents}
            ambulances={ambulances}
            hospitals={hospitals}
            users={users}
          />
        </div>

        {/* Tab Navigation Controls */}
        <div className="mt-8 flex flex-wrap items-center gap-2 pb-4 border-b border-[#E0E0E0]">
          {TABS.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 ${
                  isSelected
                    ? "bg-[#141414] text-white shadow-sm"
                    : "bg-[#F3F3F3] text-[#707070] hover:text-[#141414] hover:bg-[#EAEAEA]"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Views Content */}
        <div className="mt-8">
          {isLoading ? (
            <div className="py-24 text-center">
              <div className="w-8 h-8 rounded-full border-2 border-[#141414] border-t-transparent animate-spin mx-auto mb-3" />
              <p className="text-xs text-[#707070]">Synchronizing network telemetry...</p>
            </div>
          ) : activeTab === "OVERVIEW" ? (
            <div className="space-y-10">
              {/* Tactical Quick Map Preview */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#141414]">
                    Live City Operational Grid
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("MAP")}
                    className="text-xs font-semibold text-[#141414] underline hover:text-[#707070]"
                  >
                    View Fullscreen Grid →
                  </button>
                </div>
                <DynamicMap
                  markers={systemMapMarkers}
                  height="340px"
                  zoom={13}
                />
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#141414]">
                    Active Emergency Incident Queue
                  </h3>
                  <span className="text-xs font-mono text-[#707070]">
                    {incidents.filter((i) => i.status !== "CLOSED").length} Active
                  </span>
                </div>
                <AdminIncidentsTable
                  incidents={incidents.slice(0, 5)}
                  onUpdateStatus={handleUpdateIncidentStatus}
                />
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <section className="space-y-4">
                  <h3 className="text-base font-bold text-[#141414]">
                    Ambulance Units
                  </h3>
                  <AdminAmbulanceMonitor ambulances={ambulances} />
                </section>

                <section className="space-y-4">
                  <h3 className="text-base font-bold text-[#141414]">
                    Trauma Facilities
                  </h3>
                  <AdminHospitalMonitor hospitals={hospitals} />
                </section>
              </div>
            </div>
          ) : activeTab === "MAP" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#141414]">
                    Tactical Network Fleet &amp; Incident GPS Map
                  </h3>
                  <p className="text-xs text-[#707070] mt-0.5">
                    Real-time visual positioning of all emergency incidents, active ambulance units, and hospital ER status.
                  </p>
                </div>
                <Badge variant="dark">{systemMapMarkers.length} Active Nodes</Badge>
              </div>
              <DynamicMap
                markers={systemMapMarkers}
                height="560px"
                zoom={13}
              />
            </div>
          ) : activeTab === "INCIDENTS" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#141414]">
                  All Emergency Incidents
                </h3>
                <span className="text-xs font-mono text-[#707070]">
                  {incidents.length} Total Registered
                </span>
              </div>
              <AdminIncidentsTable
                incidents={incidents}
                onUpdateStatus={handleUpdateIncidentStatus}
              />
            </div>
          ) : activeTab === "AMBULANCES" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#141414]">
                  Ambulance Fleet Status &amp; Telemetry
                </h3>
                <span className="text-xs font-mono text-[#707070]">
                  {ambulances.length} Active Units
                </span>
              </div>
              <AdminAmbulanceMonitor ambulances={ambulances} />
            </div>
          ) : activeTab === "HOSPITALS" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#141414]">
                  Trauma Facilities &amp; Emergency Readiness
                </h3>
                <span className="text-xs font-mono text-[#707070]">
                  {hospitals.length} Registered Centers
                </span>
              </div>
              <AdminHospitalMonitor hospitals={hospitals} />
            </div>
          ) : (
            <AdminUserManagement
              users={users}
              onUserCreated={fetchAdminData}
            />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

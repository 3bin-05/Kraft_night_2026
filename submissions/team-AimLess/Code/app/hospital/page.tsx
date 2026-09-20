"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";
import { useSocketEvent } from "@/lib/socket";
import { Incident, IncidentSeverity } from "@/types/incident";
import { Hospital } from "@/types/hospital";
import { Ambulance, AMBULANCE_LEVEL_CONFIGS } from "@/types/ambulance";
import { emergencySiren, getSirenSpeedForSeverity, playEmergencySiren, stopEmergencySiren } from "@/lib/audio";
import {
  Building2,
  Bell,
  Home,
  Truck,
  Activity,
  User,
  Users,
  FileText,
  Settings,
  HelpCircle,
  Clock,
  MapPin,
  ChevronRight,
  ChevronDown,
  Volume2,
  VolumeX,
  Gauge,
  Plus,
  Minus,
  Navigation,
  CheckCircle2,
  ArrowRight,
  Menu,
  X,
  LogOut,
  Bed,
  HeartPulse,
  Stethoscope,
  ShieldCheck,
  Check,
  RefreshCw,
  Zap,
  Radio,
  History,
  Archive,
  FolderCheck,
  Search,
  ExternalLink,
} from "lucide-react";

function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function calculateEtaMinutes(distKm: number, speedKmH = 55): number {
  const speed = speedKmH > 10 ? speedKmH : 55;
  return Math.max(2, Math.round((distKm / speed) * 60));
}

function formatArrivalTime(etaMinutes: number): string {
  const date = new Date(Date.now() + etaMinutes * 60000);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function HospitalDashboardPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "inbound" | "history" | "er" | "patients" | "staff" | "reports" | "profile" | "settings" | "help"
  >("dashboard");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isAlertAcknowledged, setIsAlertAcknowledged] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [readinessStep, setReadinessStep] = useState<number>(2); // 1: Alert, 2: Preparing, 3: Ready, 4: Patient Arrived
  const [staffRequested, setStaffRequested] = useState(false);
  const [isUpdatingBeds, setIsUpdatingBeds] = useState(false);
  const [isDisposing, setIsDisposing] = useState(false);
  const [disposalToast, setDisposalToast] = useState<string | null>(null);
  const [inspectCase, setInspectCase] = useState<Incident | null>(null);
  const [historySearch, setHistorySearch] = useState("");
  const [historyFilterSeverity, setHistoryFilterSeverity] = useState<string>("ALL");

  // Live data collections
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);

  // Fetch all live records
  const loadData = useCallback(async (showSpinner = false) => {
    if (showSpinner) setIsLoading(true);
    else setIsRefetching(true);

    try {
      const [incData, hospData, ambData] = await Promise.all([
        api.getIncidents("all").catch(() => []),
        api.getHospitals().catch(() => []),
        api.getAmbulances().catch(() => []),
      ]);

      setIncidents(incData);
      setHospitals(hospData);
      setAmbulances(ambData);
    } catch (err) {
      console.error("[HospitalDashboard] Failed to fetch data:", err);
    } finally {
      setIsLoading(false);
      setIsRefetching(false);
    }
  }, []);

  useEffect(() => {
    loadData(true);
    const interval = setInterval(() => loadData(false), 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Identify current hospital profile
  const currentHospital = useMemo(() => {
    if (hospitals.length === 0) return null;
    if (user?.id) {
      const matched = hospitals.find((h) => h.id === user.id);
      if (matched) return matched;
    }
    if (user?.name) {
      const matchedByName = hospitals.find((h) =>
        h.name.toLowerCase().includes(user.name.toLowerCase())
      );
      if (matchedByName) return matchedByName;
    }
    return hospitals[0];
  }, [hospitals, user]);

  // Filter active inbound incidents for this hospital (unclosed cases)
  const activeInboundIncidents = useMemo(() => {
    const unclosed = incidents.filter((i) => i.status !== "CLOSED");
    if (!currentHospital) return unclosed;

    const forThisHospital = unclosed.filter(
      (i) => i.targetHospitalId === currentHospital.id || !i.targetHospitalId
    );
    return forThisHospital.length > 0 ? forThisHospital : unclosed;
  }, [incidents, currentHospital]);

  // Disposed / Closed incidents in hospital history
  const disposedIncidents = useMemo(() => {
    const closed = incidents.filter((i) => i.status === "CLOSED");
    if (!currentHospital) return closed;

    const forThisHospital = closed.filter(
      (i) => i.targetHospitalId === currentHospital.id || !i.targetHospitalId
    );
    return forThisHospital.length > 0 ? forThisHospital : closed;
  }, [incidents, currentHospital]);

  // Filtered history list
  const filteredDisposedIncidents = useMemo(() => {
    return disposedIncidents.filter((inc) => {
      const matchesSearch =
        historySearch.trim() === "" ||
        inc.incidentNumber.toLowerCase().includes(historySearch.toLowerCase()) ||
        (inc.location?.address && inc.location.address.toLowerCase().includes(historySearch.toLowerCase())) ||
        (inc.description && inc.description.toLowerCase().includes(historySearch.toLowerCase()));

      const matchesSeverity =
        historyFilterSeverity === "ALL" || inc.severity === historyFilterSeverity;

      return matchesSearch && matchesSeverity;
    });
  }, [disposedIncidents, historySearch, historyFilterSeverity]);

  // Active selected incident
  const activeIncident = useMemo(() => {
    if (activeInboundIncidents.length === 0) return null;
    if (selectedIncidentId) {
      const found = activeInboundIncidents.find((i) => i.id === selectedIncidentId);
      if (found) return found;
    }
    const severityRank: Record<IncidentSeverity, number> = {
      CRITICAL: 4,
      HIGH: 3,
      MODERATE: 2,
      LOW: 1,
    };
    const sorted = [...activeInboundIncidents].sort(
      (a, b) => (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0)
    );
    return sorted[0] || null;
  }, [activeInboundIncidents, selectedIncidentId]);

  // Resolve assigned ambulance
  const assignedAmbulance = useMemo(() => {
    if (!activeIncident) return null;
    if (activeIncident.assignedAmbulanceId) {
      const amb = ambulances.find((a) => a.id === activeIncident.assignedAmbulanceId);
      if (amb) return amb;
    }
    const byIncident = ambulances.find((a) => a.currentIncidentId === activeIncident.id);
    if (byIncident) return byIncident;
    return ambulances[0] || null;
  }, [activeIncident, ambulances]);

  // Compute live Distance & ETA
  const telemetry = useMemo(() => {
    if (!activeIncident || !currentHospital) {
      return { distanceKm: 4.2, etaMinutes: 8, etaFormatted: "8 min", arrivalTime: "10:45 AM" };
    }
    const fromLat = assignedAmbulance ? assignedAmbulance.latitude : activeIncident.location.latitude;
    const fromLon = assignedAmbulance ? assignedAmbulance.longitude : activeIncident.location.longitude;
    const toLat = currentHospital.latitude;
    const toLon = currentHospital.longitude;

    const dist = calculateHaversineKm(fromLat, fromLon, toLat, toLon);
    const speed = assignedAmbulance?.speed || 55;
    const eta = calculateEtaMinutes(dist, speed);
    return {
      distanceKm: dist,
      etaMinutes: eta,
      etaFormatted: `${eta} min`,
      arrivalTime: formatArrivalTime(eta),
    };
  }, [activeIncident, assignedAmbulance, currentHospital]);

  // Siren speed modulation based on active incident severity
  // Minor / Low: 1x, Moderate: 1x, Severe / Danger / Critical: 2x
  const sirenSpeed = useMemo(() => {
    return getSirenSpeedForSeverity(activeIncident?.severity);
  }, [activeIncident?.severity]);

  const isHighUrgency = sirenSpeed >= 2.0;

  // Manage emergency siren audio
  useEffect(() => {
    if (activeIncident && !isAlertAcknowledged && !isMuted) {
      emergencySiren.start(activeIncident.severity, sirenSpeed);
    } else {
      emergencySiren.stop();
    }

    return () => {
      emergencySiren.stop();
    };
  }, [activeIncident, isAlertAcknowledged, isMuted, sirenSpeed]);

  // Real-time socket events
  useSocketEvent("hospital:alert", ({ incident }) => {
    setIsAlertAcknowledged(false);
    setReadinessStep(2);
    setIncidents((prev) => [incident, ...prev.filter((i) => i.id !== incident.id)]);
    setSelectedIncidentId(incident.id);
  });

  useSocketEvent("incident:updated", ({ incident }) => {
    setIncidents((prev) => prev.map((i) => (i.id === incident.id ? incident : i)));
  });

  useSocketEvent("ambulance:location_updated", ({ ambulanceId, latitude, longitude, speed, heading }) => {
    setAmbulances((prev) =>
      prev.map((a) =>
        a.id === ambulanceId
          ? {
              ...a,
              latitude,
              longitude,
              speed: speed ?? a.speed,
              heading: heading ?? a.heading,
            }
          : a
      )
    );
  });

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (!isAlertAcknowledged && activeIncident) {
        emergencySiren.start(activeIncident.severity, sirenSpeed);
      }
    } else {
      setIsMuted(true);
      emergencySiren.stop();
    }
  };

  const handleUpdateBeds = async (newBedsCount: number) => {
    if (!currentHospital || isUpdatingBeds) return;
    const sanitized = Math.max(0, newBedsCount);
    setIsUpdatingBeds(true);

    // Optimistic update
    setHospitals((prev) =>
      prev.map((h) => (h.id === currentHospital.id ? { ...h, availableBeds: sanitized } : h))
    );

    try {
      await api.updateHospital(currentHospital.id, {
        availableBeds: sanitized,
      });
    } catch (err) {
      console.error("[HospitalDashboard] Bed update failed:", err);
      loadData(false);
    } finally {
      setIsUpdatingBeds(false);
    }
  };

  const handleAdvanceReadiness = async (nextStep: number) => {
    setReadinessStep(nextStep);
    if (!activeIncident) return;

    if (nextStep === 4) {
      try {
        await api.updateIncidentStatus(activeIncident.id, {
          status: "ARRIVED",
        });
      } catch (err) {
        console.warn("Status update note:", err);
      }
    }
  };

  // Case Disposal / Close Workflow
  const handleDisposeCase = async (targetIncident: Incident) => {
    if (isDisposing) return;
    setIsDisposing(true);

    try {
      // 1. Silence audio immediately
      stopEmergencySiren();
      setIsAlertAcknowledged(true);

      // 2. Update status to CLOSED in backend
      await api.updateIncidentStatus(targetIncident.id, {
        status: "CLOSED",
      });

      // 3. Update local state
      setIncidents((prev) =>
        prev.map((i) => (i.id === targetIncident.id ? { ...i, status: "CLOSED" } : i))
      );

      // 4. Reset readiness & toast
      setReadinessStep(1);
      setSelectedIncidentId(null);
      setDisposalToast(`Emergency #${targetIncident.incidentNumber} successfully received, admitted & disposed to Hospital History.`);

      setTimeout(() => {
        setDisposalToast(null);
      }, 6000);

      // 5. Reload fresh telemetry
      await loadData(false);
    } catch (err) {
      console.error("[HospitalDashboard] Failed to dispose case:", err);
      alert("Failed to dispose case. Please check network connection.");
    } finally {
      setIsDisposing(false);
    }
  };

  const ambConfig = assignedAmbulance?.type
    ? AMBULANCE_LEVEL_CONFIGS[assignedAmbulance.type]
    : null;

  const displayName = user?.name || currentHospital?.name || "Dr. Meera Nair";
  const userInitial = displayName.replace("Dr. ", "").charAt(0).toUpperCase() || "H";
  const hospitalName = currentHospital?.name || "City Central Emergency & Trauma Center";
  const hospitalAddress = currentHospital?.address || "100 Medical Center Way, Downtown";
  const availableBeds = currentHospital?.availableBeds ?? 12;

  return (
    <ProtectedRoute allowedRoles={["HOSPITAL", "ADMIN"]}>
      <div className="min-h-screen w-full bg-[#FAFAFA] text-[#141414] flex flex-col lg:flex-row antialiased">
        {/* ─────────────────────────────────────────────────────────────
            1. LEFT SIDEBAR (Desktop Fixed & Mobile Drawer)
        ───────────────────────────────────────────────────────────── */}
        <aside
          className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 xl:w-72 bg-[#FFFFFF] border-r border-neutral-200/70 p-6 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div>
            {/* Top Brand Logo */}
            <div className="flex items-center justify-between pb-7">
              <Link
                href="/"
                className="flex items-center gap-2 group cursor-pointer hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center gap-1 text-[#141414] font-black text-xl tracking-[0.32em] uppercase">
                  <span>G</span>
                  <span className="inline-block font-sans font-normal scale-y-110">Λ</span>
                  <span>B</span>
                  <span>R</span>
                  <span>I</span>
                  <span>E</span>
                  <span>L</span>
                </div>
              </Link>
              <div className="hidden xl:block text-[8px] uppercase font-bold tracking-[0.25em] text-neutral-400 pl-2 border-l border-neutral-200">
                People Faster Safer
              </div>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="lg:hidden p-1 text-neutral-500 hover:text-black cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Menu Links */}
            <nav className="flex flex-col gap-1">
              <button
                onClick={() => {
                  setActiveTab("dashboard");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "dashboard"
                    ? "bg-[#111111] text-white shadow-sm"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
                }`}
              >
                <Home className="w-4 h-4 shrink-0" strokeWidth={2} />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("inbound");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "inbound"
                    ? "bg-[#111111] text-white shadow-sm"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Truck className="w-4 h-4 shrink-0" strokeWidth={2} />
                  <span>Incoming Ambulances</span>
                </div>
                {activeInboundIncidents.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-black text-white text-[10px] font-bold">
                    {activeInboundIncidents.length}
                  </span>
                )}
              </button>

              {/* Case History & Disposed Cases */}
              <button
                onClick={() => {
                  setActiveTab("history");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "history"
                    ? "bg-[#111111] text-white shadow-sm"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <FolderCheck className="w-4 h-4 shrink-0" strokeWidth={2} />
                  <span>Disposed Cases History</span>
                </div>
                {disposedIncidents.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-800 text-[10px] font-bold">
                    {disposedIncidents.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setActiveTab("er");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "er"
                    ? "bg-[#111111] text-white shadow-sm"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
                }`}
              >
                <Activity className="w-4 h-4 shrink-0" strokeWidth={2} />
                <span>Emergency Department</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("patients");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "patients"
                    ? "bg-[#111111] text-white shadow-sm"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
                }`}
              >
                <User className="w-4 h-4 shrink-0" strokeWidth={2} />
                <span>Patients &amp; Triage</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("staff");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "staff"
                    ? "bg-[#111111] text-white shadow-sm"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
                }`}
              >
                <Users className="w-4 h-4 shrink-0" strokeWidth={2} />
                <span>Staff &amp; Resources</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("reports");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "reports"
                    ? "bg-[#111111] text-white shadow-sm"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
                }`}
              >
                <FileText className="w-4 h-4 shrink-0" strokeWidth={2} />
                <span>Reports</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("profile");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "profile"
                    ? "bg-[#111111] text-white shadow-sm"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
                }`}
              >
                <Building2 className="w-4 h-4 shrink-0" strokeWidth={2} />
                <span>Hospital Profile</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("settings");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "settings"
                    ? "bg-[#111111] text-white shadow-sm"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
                }`}
              >
                <Settings className="w-4 h-4 shrink-0" strokeWidth={2} />
                <span>Settings</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("help");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "help"
                    ? "bg-[#111111] text-white shadow-sm"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
                }`}
              >
                <HelpCircle className="w-4 h-4 shrink-0" strokeWidth={2} />
                <span>Help &amp; Support</span>
              </button>
            </nav>
          </div>

          {/* Bottom Sidebar Mission Tagline */}
          <div className="pt-6 border-t border-neutral-100">
            <div className="w-8 h-[1.5px] bg-neutral-300 rounded-full mb-3" />
            <p className="text-[11px] text-neutral-400 font-normal leading-relaxed">
              Prepared<br />
              People Save Lives.
            </p>
            <div className="text-[11px] font-extrabold text-[#111111] tracking-[0.2em] uppercase mt-2">
              Gabriel
            </div>
          </div>
        </aside>

        {/* Mobile Backdrop */}
        {mobileSidebarOpen && (
          <div
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 lg:hidden"
          />
        )}

        {/* ─────────────────────────────────────────────────────────────
            2. MAIN HOSPITAL DASHBOARD CONTENT
        ───────────────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Header Bar */}
          <header className="w-full bg-[#FFFFFF] border-b border-neutral-200/70 px-6 sm:px-8 lg:px-10 h-20 flex items-center justify-between sticky top-0 z-30">
            {/* Left Hospital Badge */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-full hover:bg-neutral-100 text-black cursor-pointer"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-black font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-bold text-[#111111] leading-tight flex items-center gap-2">
                    <span>{hospitalName}</span>
                    {currentHospital?.code && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-700 border border-neutral-200">
                        {currentHospital.code}
                      </span>
                    )}
                  </h2>
                  <div className="text-[10px] text-neutral-400 font-medium truncate max-w-[240px] sm:max-w-xs">
                    {hospitalAddress}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Header Controls */}
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Live Audio Siren Controller */}
              <div className="hidden sm:flex items-center gap-2 bg-neutral-100 px-3 py-1.5 rounded-full border border-neutral-200 text-xs">
                <button
                  type="button"
                  onClick={handleToggleMute}
                  className="flex items-center gap-1.5 font-bold hover:text-black transition-colors cursor-pointer"
                  title={isMuted ? "Unmute siren" : "Mute siren"}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 text-neutral-400" />
                  ) : (
                    <Volume2 className={`w-4 h-4 ${isHighUrgency ? "text-red-600 animate-pulse" : "text-amber-600 animate-pulse"}`} />
                  )}
                  <span className="text-[11px] font-mono">
                    {isMuted ? "MUTED" : `SIREN ${sirenSpeed}x`}
                  </span>
                </button>
                <span className="w-1 h-3 bg-neutral-300 rounded-full" />
                <span className={`text-[10px] font-bold ${isHighUrgency ? "text-red-600" : "text-neutral-600"}`}>
                  {isHighUrgency ? "2x Severe/Danger" : "1x Minor/Mod"}
                </span>
              </div>

              {/* Refetch Trigger */}
              <button
                onClick={() => loadData(false)}
                disabled={isRefetching}
                className="p-2 rounded-full hover:bg-neutral-100 text-neutral-600 transition-colors cursor-pointer"
                title="Refresh Live Telemetry"
              >
                <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin text-black" : ""}`} />
              </button>

              {/* Notification Bell */}
              <button
                className="relative p-2 rounded-full hover:bg-neutral-100 text-neutral-700 transition-colors cursor-pointer"
                title="Active Inbound Ambulances"
                onClick={() => {
                  alert(
                    activeInboundIncidents.length > 0
                      ? `${activeInboundIncidents.length} Active Inbound Incident(s):\n` +
                          activeInboundIncidents
                            .map((i) => `• #${i.incidentNumber}: ${i.severity} Acuity (ETA ~${telemetry.etaFormatted})`)
                            .join("\n")
                      : "No active inbound ambulances at this moment. Trauma bays on standby."
                  );
                }}
              >
                <Bell className="w-4 h-4" strokeWidth={2} />
                {activeInboundIncidents.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-600 ring-2 ring-white animate-pulse" />
                )}
              </button>

              {/* Staff Profile Chip */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2.5 p-1 sm:px-3 sm:py-1.5 rounded-full hover:bg-neutral-100 transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-[#111111] text-white flex items-center justify-center font-bold text-xs">
                    {userInitial}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-bold text-[#111111] leading-tight">
                      {displayName}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-medium">
                      Emergency Dept Officer
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400 hidden sm:block" />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-neutral-200/80 py-2 z-50 animate-fade-in">
                    <div className="px-4 py-2 border-b border-neutral-100">
                      <div className="text-xs font-bold text-[#111111]">{displayName}</div>
                      <div className="text-[10px] text-neutral-400 truncate">{hospitalName}</div>
                    </div>
                    <Link
                      href="/"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                    >
                      <Home className="w-3.5 h-3.5 text-neutral-400" />
                      Home Landing
                    </Link>
                    <Link
                      href="/ambulance"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                    >
                      <Truck className="w-3.5 h-3.5 text-neutral-400" />
                      Ambulance Fleet View
                    </Link>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Toast Notice for Case Disposal */}
          {disposalToast && (
            <div className="mx-6 sm:mx-8 lg:mx-10 mt-6 p-4 rounded-2xl bg-emerald-950 text-emerald-100 border border-emerald-700 shadow-xl flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-xs sm:text-sm font-semibold">{disposalToast}</span>
              </div>
              <button
                onClick={() => setDisposalToast(null)}
                className="text-emerald-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Main Dashboard Content Area */}
          <main className="p-6 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto flex flex-col gap-7">
            {/* Top View Selector: Dashboard vs Disposed Cases History */}
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "dashboard" || activeTab === "inbound" || activeTab === "er"
                      ? "bg-[#111111] text-white shadow-sm"
                      : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200"
                  }`}
                >
                  Active Emergency Command ({activeInboundIncidents.length})
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "history"
                      ? "bg-[#111111] text-white shadow-sm"
                      : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200"
                  }`}
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Disposed Cases History ({disposedIncidents.length})</span>
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Trauma Center Online</span>
              </div>
            </div>

            {/* TAB VIEW 1: DISPOSED CASES HISTORY CONSOLE */}
            {activeTab === "history" ? (
              <div className="bg-white rounded-[24px] border border-neutral-200/80 p-6 sm:p-8 shadow-xs flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-[#111111] flex items-center gap-2">
                      <FolderCheck className="w-5 h-5 text-emerald-600" />
                      <span>Hospital History • Disposed Emergency Cases</span>
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Permanent audit archive of all ambulances received, patients admitted, and completed trauma handovers.
                    </p>
                  </div>

                  {/* Search and Filter */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="Search case # or scene..."
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50 text-xs focus:outline-none focus:ring-1 focus:ring-black w-44 sm:w-56"
                      />
                    </div>

                    <select
                      value={historyFilterSeverity}
                      onChange={(e) => setHistoryFilterSeverity(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50 text-xs font-semibold focus:outline-none cursor-pointer"
                    >
                      <option value="ALL">All Severities</option>
                      <option value="CRITICAL">Critical</option>
                      <option value="HIGH">High</option>
                      <option value="MODERATE">Moderate</option>
                      <option value="LOW">Low</option>
                    </select>
                  </div>
                </div>

                {/* Disposed Cases List */}
                {filteredDisposedIncidents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredDisposedIncidents.map((inc) => {
                      const incAmb = ambulances.find((a) => a.id === inc.assignedAmbulanceId);
                      const incAmbConfig = incAmb?.type ? AMBULANCE_LEVEL_CONFIGS[incAmb.type] : null;

                      return (
                        <div
                          key={inc.id}
                          className="p-5 rounded-2xl bg-neutral-50 hover:bg-neutral-100/80 border border-neutral-200/80 transition-all flex flex-col justify-between gap-4"
                        >
                          <div>
                            <div className="flex items-center justify-between pb-2 border-b border-neutral-200/60">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-mono font-bold text-[#111111]">
                                  #{inc.incidentNumber}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                                  <Check className="w-3 h-3" /> DISPOSED
                                </span>
                              </div>

                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                  inc.severity === "CRITICAL"
                                    ? "bg-red-600 text-white"
                                    : inc.severity === "HIGH"
                                    ? "bg-orange-600 text-white"
                                    : inc.severity === "MODERATE"
                                    ? "bg-amber-500 text-black"
                                    : "bg-emerald-600 text-white"
                                }`}
                              >
                                {inc.severity}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs text-neutral-600 mt-3">
                              <div>
                                <span className="text-[10px] text-neutral-400 block font-medium">
                                  Ambulance Unit
                                </span>
                                <span className="font-bold text-[#111111]">
                                  {incAmb?.vehicleNumber || inc.assignedAmbulanceId || "Paramedic Unit"}
                                </span>
                                {incAmbConfig && (
                                  <span className={`inline-block ml-1.5 px-1.5 py-0.2 rounded text-[9px] font-bold ${incAmbConfig.tagColor}`}>
                                    {incAmbConfig.letter}
                                  </span>
                                )}
                              </div>

                              <div>
                                <span className="text-[10px] text-neutral-400 block font-medium">
                                  Casualties Received
                                </span>
                                <span className="font-bold text-[#111111]">
                                  {inc.victimCount} Patient{inc.victimCount > 1 ? "s" : ""}
                                </span>
                              </div>

                              <div className="col-span-2">
                                <span className="text-[10px] text-neutral-400 block font-medium">
                                  Scene / Origin
                                </span>
                                <span className="text-[11px] text-neutral-700 truncate block">
                                  {inc.location?.address || `${inc.location.latitude.toFixed(4)}, ${inc.location.longitude.toFixed(4)}`}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-neutral-200/60 flex items-center justify-between text-[10px] text-neutral-400">
                            <span>
                              Disposed: {new Date(inc.updatedAt || inc.createdAt).toLocaleString()}
                            </span>
                            <button
                              onClick={() => setInspectCase(inc)}
                              className="font-bold text-[#111111] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <span>View Case Audit</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 text-neutral-400">
                    <FolderCheck className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                    <p className="text-xs">No disposed cases match the current filter.</p>
                  </div>
                )}
              </div>
            ) : (
              /* TAB VIEW 2: ACTIVE EMERGENCY COMMAND DASHBOARD */
              <>
                {/* ─────────────────────────────────────────────────────────
                    HERO ALARM BANNER (Real Data & Dynamic Siren Modulation)
                ───────────────────────────────────────────────────────── */}
                {activeIncident ? (
                  <div className="bg-[#0A0A0A] text-white rounded-[26px] p-6 sm:p-8 border border-neutral-900 shadow-xl relative overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    {/* Left Info & Icon */}
                    <div className="flex items-center gap-5 z-10">
                      <div
                        className={`relative w-16 h-16 rounded-full border flex items-center justify-center shrink-0 ${
                          isHighUrgency
                            ? "bg-red-950/60 border-red-500/50 text-red-400"
                            : "bg-amber-950/60 border-amber-500/50 text-amber-400"
                        }`}
                      >
                        <div
                          className={`absolute inset-0 rounded-full animate-ping opacity-30 ${
                            isHighUrgency ? "bg-red-500" : "bg-amber-500"
                          }`}
                        />
                        <Truck className="w-7 h-7 animate-pulse" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-white/70">
                            Incoming Emergency
                          </span>
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                              activeIncident.severity === "CRITICAL"
                                ? "bg-red-600 text-white"
                                : activeIncident.severity === "HIGH"
                                ? "bg-orange-600 text-white"
                                : activeIncident.severity === "MODERATE"
                                ? "bg-amber-500 text-black"
                                : "bg-emerald-500 text-white"
                            }`}
                          >
                            {activeIncident.severity}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-400">
                            #{activeIncident.incidentNumber}
                          </span>
                        </div>

                        <h3 className="text-2xl sm:text-[26px] font-black text-white tracking-tight leading-tight">
                          {assignedAmbulance?.vehicleNumber || assignedAmbulance?.callSign || "Ambulance Unit"} is on the way
                        </h3>
                        <p className="text-xs sm:text-sm text-neutral-400 font-normal mt-0.5 flex items-center gap-2">
                          <span>
                            {activeIncident.victimCount} casualty(s) • Scene:{" "}
                            <strong className="text-white font-medium">
                              {activeIncident.location?.address || `${activeIncident.location.latitude.toFixed(4)}, ${activeIncident.location.longitude.toFixed(4)}`}
                            </strong>
                          </span>
                          {ambConfig && (
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${ambConfig.tagColor}`}>
                              Level {ambConfig.letter}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Middle ETA Display */}
                    <div className="flex items-baseline lg:flex-col lg:items-center gap-2 lg:gap-0 lg:px-8 lg:border-x lg:border-white/15 z-10">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                        ETA
                      </span>
                      <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                        {telemetry.etaFormatted}
                      </div>
                      <span className="text-[11px] text-neutral-400 font-medium">
                        {telemetry.distanceKm} km • Arr: {telemetry.arrivalTime}
                      </span>
                    </div>

                    {/* Right Acknowledge / Dispose Button & Siren Speed */}
                    <div className="flex flex-col items-start lg:items-end gap-2 z-10 w-full sm:w-auto">
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        {/* Acknowledge Siren button */}
                        <button
                          onClick={() => {
                            setIsAlertAcknowledged(!isAlertAcknowledged);
                            if (!isAlertAcknowledged) {
                              stopEmergencySiren();
                            } else {
                              emergencySiren.start(activeIncident.severity, sirenSpeed);
                            }
                          }}
                          className={`flex-1 sm:flex-initial px-5 py-3 rounded-full font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                            isAlertAcknowledged
                              ? "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                              : "bg-white hover:bg-neutral-100 text-[#111111]"
                          }`}
                        >
                          {isAlertAcknowledged ? (
                            <>
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Siren Acknowledged</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5 stroke-[2.5] animate-pulse text-red-600" />
                              <span>Silence Siren ({sirenSpeed}x)</span>
                            </>
                          )}
                        </button>

                        {/* Handover & Dispose Case button */}
                        <button
                          onClick={() => handleDisposeCase(activeIncident)}
                          disabled={isDisposing}
                          className="flex-1 sm:flex-initial px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                        >
                          <FolderCheck className="w-4 h-4" />
                          <span>{isDisposing ? "Disposing Case..." : "Acknowledge & Dispose Case"}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-neutral-400 self-center lg:self-end">
                        <span>
                          {isAlertAcknowledged
                            ? "Siren Silenced • Ready for Handover"
                            : isMuted
                            ? "Siren Muted"
                            : `Siren Sounding (${sirenSpeed.toFixed(1)}x - ${isHighUrgency ? "Severe/Critical" : "Minor/Moderate"})`}
                        </span>
                        <button
                          type="button"
                          onClick={handleToggleMute}
                          className="underline text-neutral-300 hover:text-white ml-1 cursor-pointer"
                        >
                          {isMuted ? "Unmute" : "Mute"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Standby Hero Card when no active inbound emergencies */
                  <div className="bg-[#111111] text-white rounded-[26px] p-6 sm:p-8 border border-neutral-800 shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                        <ShieldCheck className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold tracking-widest uppercase text-emerald-400">
                          Emergency Room Standby
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-white">
                          No Inbound Emergencies Active
                        </h3>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {hospitalName} trauma bays ready. Continuous regional dispatch telemetry monitoring active.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          playEmergencySiren("CRITICAL", 2.0);
                          setTimeout(() => stopEmergencySiren(), 3000);
                        }}
                        className="px-4 py-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-neutral-700"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-red-400" />
                        <span>Test 2x Siren (Severe)</span>
                      </button>
                      <button
                        onClick={() => {
                          playEmergencySiren("MODERATE", 1.0);
                          setTimeout(() => stopEmergencySiren(), 3000);
                        }}
                        className="px-4 py-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-neutral-700"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Test 1x Siren (Moderate)</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* ─────────────────────────────────────────────────────────
                    2. LIVE TRACKING & READINESS WORKFLOW (Split Row)
                ───────────────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left 8 Cols: Live Tracking Card */}
                  <div className="lg:col-span-8 bg-white rounded-[24px] border border-neutral-200/80 p-6 sm:p-7 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-[#111111] tracking-tight">
                          Live Telemetry &amp; Route
                        </h3>
                        <p className="text-[11px] text-neutral-400">
                          Real GPS link from emergency location to trauma bay
                        </p>
                      </div>
                      <Link
                        href="/ambulance"
                        className="text-xs font-bold text-neutral-500 hover:text-black flex items-center gap-1"
                      >
                        <span>View Ambulance Fleet</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                      {/* Visual Route Preview Map (7 Cols) */}
                      <div className="md:col-span-7 relative h-64 sm:h-72 rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200 select-none">
                        <div className="absolute inset-0 bg-[#F2F2F4] bg-[radial-gradient(#d4d4d8_1px,transparent_1px)] [background-size:16px_16px] flex flex-col justify-between p-4">
                          {/* Origin Accident Location Tag */}
                          <div className="self-start bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-neutral-200 text-[10px] font-bold text-black shadow-xs flex items-center gap-1.5 max-w-[200px]">
                            <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                            <div className="truncate">
                              <div>Incident Scene</div>
                              <div className="text-[9px] text-neutral-400 font-normal truncate">
                                {activeIncident
                                  ? activeIncident.location?.address ||
                                    `${activeIncident.location.latitude.toFixed(4)}, ${activeIncident.location.longitude.toFixed(4)}`
                                  : "No active scene"}
                              </div>
                            </div>
                          </div>

                          {/* Moving In-Transit Ambulance Indicator */}
                          <div className="self-center bg-black text-white px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
                            <Truck className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold">
                              {assignedAmbulance?.vehicleNumber || "Ambulance"}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/20">
                              {telemetry.etaFormatted}
                            </span>
                          </div>

                          {/* Destination Hospital Tag */}
                          <div className="self-end bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-neutral-200 text-[10px] font-bold text-black shadow-xs flex items-center gap-1.5 max-w-[200px]">
                            <Building2 className="w-3.5 h-3.5 text-black shrink-0" />
                            <div className="truncate">
                              <div className="truncate">{hospitalName}</div>
                              <div className="text-[9px] text-neutral-400 font-normal">
                                ETA: {telemetry.etaFormatted}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Audio Status Pill */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-xl border border-neutral-200 shadow-xs text-[10px] font-mono font-bold">
                          <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                          <span>LIVE GPS</span>
                        </div>
                      </div>

                      {/* Telemetry Metrics (5 Cols) */}
                      <div className="md:col-span-5 flex flex-col justify-between h-full py-1">
                        <div>
                          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                            <div>
                              <span className="text-sm font-bold text-[#111111] block">
                                {assignedAmbulance?.vehicleNumber || assignedAmbulance?.callSign || "Paramedic Unit"}
                              </span>
                              {ambConfig && (
                                <span className="text-[10px] text-neutral-500 font-medium">
                                  {ambConfig.name}
                                </span>
                              )}
                            </div>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              {assignedAmbulance?.status || "EN ROUTE"}
                            </span>
                          </div>

                          <div className="flex flex-col gap-3 pt-3">
                            {/* Metric 1 */}
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-black shrink-0">
                                <MapPin className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-[10px] text-neutral-400 font-medium">Distance</div>
                                <div className="text-xs font-bold text-[#111111]">
                                  {telemetry.distanceKm} km
                                </div>
                              </div>
                            </div>

                            {/* Metric 2 */}
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-black shrink-0">
                                <Clock className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-[10px] text-neutral-400 font-medium">Estimated Arrival</div>
                                <div className="text-xs font-bold text-[#111111]">
                                  {telemetry.etaFormatted} ({telemetry.arrivalTime})
                                </div>
                              </div>
                            </div>

                            {/* Metric 3 */}
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-black shrink-0">
                                <Gauge className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-[10px] text-neutral-400 font-medium">Telemetry Speed</div>
                                <div className="text-xs font-bold text-[#111111]">
                                  {assignedAmbulance?.speed || 55} km/h
                                </div>
                              </div>
                            </div>

                            {/* Metric 4 */}
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-black shrink-0">
                                <Users className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-[10px] text-neutral-400 font-medium">Patient(s) Acuity</div>
                                <div className="text-xs font-bold text-[#111111]">
                                  {activeIncident ? `${activeIncident.victimCount} (${activeIncident.severity})` : "0 (Standby)"}
                                </div>
                              </div>
                            </div>

                            {/* Metric 5 */}
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-black shrink-0">
                                <Navigation className="w-4 h-4" />
                              </div>
                              <div className="truncate">
                                <div className="text-[10px] text-neutral-400 font-medium">From Scene</div>
                                <div className="text-xs font-bold text-[#111111] truncate">
                                  {activeIncident?.location?.address || "MG Road, Kochi"}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right 4 Cols: Emergency Department Readiness Card */}
                  <div className="lg:col-span-4 bg-white rounded-[24px] border border-neutral-200/80 p-6 sm:p-7 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-base sm:text-lg font-bold text-[#111111] tracking-tight">
                            ER Readiness Protocol
                          </h3>
                          <p className="text-[11px] text-neutral-400">Trauma bay staging workflow</p>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 font-bold">
                          STAGE 0{readinessStep}/04
                        </span>
                      </div>

                      {/* 4-Stage Step Workflow */}
                      <div className="relative mb-8">
                        <div className="absolute top-4 inset-x-4 h-[2px] bg-neutral-200 z-0" />
                        <div
                          className="absolute top-4 left-4 h-[2px] bg-[#111111] z-0 transition-all duration-300"
                          style={{
                            width:
                              readinessStep === 1
                                ? "0%"
                                : readinessStep === 2
                                ? "33%"
                                : readinessStep === 3
                                ? "66%"
                                : "100%",
                          }}
                        />

                        <div className="relative z-10 flex items-start justify-between text-center">
                          {/* Stage 1 */}
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-[#111111] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                              ✓
                            </div>
                            <span className="text-[10px] font-bold text-[#111111] mt-1.5">
                              Alert<br />Received
                            </span>
                          </div>

                          {/* Stage 2 */}
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                readinessStep >= 2
                                  ? "bg-[#111111] ring-4 ring-neutral-200 text-white"
                                  : "bg-neutral-200 text-neutral-500"
                              }`}
                            >
                              {readinessStep > 2 ? "✓" : "2"}
                            </div>
                            <span className="text-[10px] font-bold text-[#111111] mt-1.5">
                              Preparing<br />Trauma Bay
                            </span>
                          </div>

                          {/* Stage 3 */}
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                readinessStep >= 3
                                  ? "bg-[#111111] ring-4 ring-neutral-200 text-white"
                                  : "bg-neutral-200 text-neutral-500"
                              }`}
                            >
                              {readinessStep > 3 ? "✓" : "3"}
                            </div>
                            <span className="text-[10px] font-medium text-neutral-600 mt-1.5">
                              Team<br />Ready
                            </span>
                          </div>

                          {/* Stage 4 */}
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                readinessStep >= 4
                                  ? "bg-[#111111] ring-4 ring-neutral-200 text-white"
                                  : "bg-neutral-200 text-neutral-500"
                              }`}
                            >
                              4
                            </div>
                            <span className="text-[10px] font-medium text-neutral-600 mt-1.5">
                              Patient<br />Arrived
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Readiness Action Buttons */}
                    <div className="flex flex-col gap-2.5">
                      {readinessStep >= 4 && activeIncident ? (
                        <button
                          onClick={() => handleDisposeCase(activeIncident)}
                          disabled={isDisposing}
                          className="w-full py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                        >
                          <FolderCheck className="w-4 h-4" />
                          <span>{isDisposing ? "Disposing Case..." : "Acknowledge Handover & Dispose Case"}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (readinessStep < 4) {
                              handleAdvanceReadiness(readinessStep + 1);
                            } else {
                              handleAdvanceReadiness(1);
                            }
                          }}
                          className="w-full py-3.5 rounded-full bg-[#111111] hover:bg-[#262626] active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                        >
                          <span>
                            {readinessStep === 1
                              ? "Start Bay Preparation"
                              : readinessStep === 2
                              ? "Mark Trauma Team Ready"
                              : readinessStep === 3
                              ? "Confirm Patient Arrived"
                              : "Reset Protocol"}
                          </span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setStaffRequested(true);
                          alert(
                            `Additional emergency team paged for ${hospitalName}:\n• On-Call Trauma Surgeon\n• Emergency Anesthesiologist\n• Blood Bank Technician`
                          );
                        }}
                        className={`w-full py-3.5 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                          staffRequested
                            ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                            : "bg-white hover:bg-neutral-50 border-neutral-300 text-[#111111]"
                        }`}
                      >
                        <Users className="w-4 h-4" />
                        <span>{staffRequested ? "Emergency Team Paged ✓" : "Page On-Call Trauma Team"}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* ─────────────────────────────────────────────────────────
                    3. BOTTOM GRID (Inbound Queue, Live Bed Capacity & Updates)
                ───────────────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Card 1: Incoming Ambulances Queue (4 Cols) */}
                  <div className="lg:col-span-4 bg-white rounded-[24px] border border-neutral-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-base font-bold text-[#111111] tracking-tight">
                            Inbound Emergencies Queue
                          </h3>
                          <p className="text-[10px] text-neutral-400">
                            {activeInboundIncidents.length} active emergency transit(s)
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                          Live Telemetry
                        </span>
                      </div>

                      <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto pr-1">
                        {activeInboundIncidents.length > 0 ? (
                          activeInboundIncidents.map((inc) => {
                            const isSelected = activeIncident?.id === inc.id;
                            const incAmb = ambulances.find(
                              (a) => a.id === inc.assignedAmbulanceId || a.currentIncidentId === inc.id
                            );
                            const incDist = currentHospital
                              ? calculateHaversineKm(
                                  incAmb ? incAmb.latitude : inc.location.latitude,
                                  incAmb ? incAmb.longitude : inc.location.longitude,
                                  currentHospital.latitude,
                                  currentHospital.longitude
                                )
                              : 4.5;
                            const incEta = calculateEtaMinutes(incDist, incAmb?.speed || 55);

                            return (
                              <div
                                key={inc.id}
                                onClick={() => setSelectedIncidentId(inc.id)}
                                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                                  isSelected
                                    ? "bg-[#111111] text-white border-black shadow-sm"
                                    : "bg-white hover:bg-neutral-50 border-neutral-200/80 text-[#111111]"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <span
                                    className={`w-2 h-2 rounded-full shrink-0 ${
                                      inc.severity === "CRITICAL"
                                        ? "bg-red-500 animate-pulse"
                                        : inc.severity === "HIGH"
                                        ? "bg-orange-500 animate-pulse"
                                        : "bg-amber-500"
                                    }`}
                                  />
                                  <div className="truncate max-w-[120px] sm:max-w-[150px]">
                                    <div className="text-xs font-bold truncate">
                                      {incAmb?.vehicleNumber || incAmb?.callSign || `Unit #${inc.incidentNumber}`}
                                    </div>
                                    <div
                                      className={`text-[10px] truncate ${
                                        isSelected ? "text-neutral-300" : "text-neutral-400"
                                      }`}
                                    >
                                      {inc.location?.address || `${inc.victimCount} casualty(s)`}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span
                                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                      isSelected
                                        ? "bg-white/20 text-white"
                                        : "bg-neutral-100 text-neutral-800"
                                    }`}
                                  >
                                    {incEta} min
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                      inc.severity === "CRITICAL"
                                        ? "bg-red-600 text-white"
                                        : inc.severity === "HIGH"
                                        ? "bg-orange-600 text-white"
                                        : inc.severity === "MODERATE"
                                        ? "bg-amber-500 text-black"
                                        : "bg-emerald-600 text-white"
                                    }`}
                                  >
                                    {inc.severity}
                                  </span>
                                  <ChevronRight
                                    className={`w-3.5 h-3.5 ${
                                      isSelected ? "text-white" : "text-neutral-400"
                                    }`}
                                  />
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-8 text-neutral-400 text-xs">
                            <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
                            <span>All clear • No active inbound emergencies</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Emergency Department Status & Beds (4 Cols) */}
                  <div className="lg:col-span-4 bg-white rounded-[24px] border border-neutral-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-base font-bold text-[#111111] tracking-tight">
                            Trauma &amp; Bed Capacity
                          </h3>
                          <p className="text-[10px] text-neutral-400">Live hospital resource registry</p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={isUpdatingBeds || availableBeds <= 0}
                            onClick={() => handleUpdateBeds(availableBeds - 1)}
                            className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 text-black flex items-center justify-center text-xs font-bold disabled:opacity-30 cursor-pointer"
                            title="Decrease available beds"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={isUpdatingBeds}
                            onClick={() => handleUpdateBeds(availableBeds + 1)}
                            className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 text-black flex items-center justify-center text-xs font-bold disabled:opacity-30 cursor-pointer"
                            title="Increase available beds"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* 4 Capacity Blocks Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Trauma Bays */}
                        <div className="p-3.5 rounded-2xl bg-[#F8F8F9] border border-neutral-200/70">
                          <div className="flex items-center gap-2 text-neutral-500 text-xs font-semibold mb-1">
                            <Bed className="w-3.5 h-3.5 text-black" />
                            <span>Available Beds</span>
                          </div>
                          <div className="text-xl font-extrabold text-[#111111]">
                            {availableBeds} <span className="text-xs font-normal text-neutral-400">Bays</span>
                          </div>
                          <span className="text-[10px] text-emerald-600 font-medium">Ready in ER</span>
                        </div>

                        {/* ICU Beds */}
                        <div className="p-3.5 rounded-2xl bg-[#F8F8F9] border border-neutral-200/70">
                          <div className="flex items-center gap-2 text-neutral-500 text-xs font-semibold mb-1">
                            <HeartPulse className="w-3.5 h-3.5 text-black" />
                            <span>ICU Bays</span>
                          </div>
                          <div className="text-xl font-extrabold text-[#111111]">
                            {Math.max(1, Math.floor(availableBeds / 3))} / 8
                          </div>
                          <span className="text-[10px] text-neutral-400 font-medium">Ventilator ready</span>
                        </div>

                        {/* Operating Theatres */}
                        <div className="p-3.5 rounded-2xl bg-[#F8F8F9] border border-neutral-200/70">
                          <div className="flex items-center gap-2 text-neutral-500 text-xs font-semibold mb-1">
                            <Stethoscope className="w-3.5 h-3.5 text-black" />
                            <span>Surgical OTs</span>
                          </div>
                          <div className="text-xl font-extrabold text-[#111111]">
                            {Math.max(1, Math.floor(availableBeds / 4))} / 4
                          </div>
                          <span className="text-[10px] text-neutral-400 font-medium">Sterile standby</span>
                        </div>

                        {/* Staff On Duty */}
                        <div className="p-3.5 rounded-2xl bg-[#F8F8F9] border border-neutral-200/70">
                          <div className="flex items-center gap-2 text-neutral-500 text-xs font-semibold mb-1">
                            <Users className="w-3.5 h-3.5 text-black" />
                            <span>On-Duty Staff</span>
                          </div>
                          <div className="text-xl font-extrabold text-[#111111]">
                            18
                          </div>
                          <span className="text-[10px] text-neutral-400 font-medium">Surgeons &amp; Nurses</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
                      <span>Capacity Status:</span>
                      <span className="font-bold text-emerald-600 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {availableBeds > 3 ? "OPTIMAL" : "HIGH LOAD"}
                      </span>
                    </div>
                  </div>

                  {/* Card 3: Recent Live Feed & Emergency Quote Card (4 Cols) */}
                  <div className="lg:col-span-4 flex flex-col gap-4">
                    {/* Recent Updates */}
                    <div className="bg-white rounded-[24px] border border-neutral-200/80 p-4 sm:p-5 shadow-xs">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wider">
                          Recent Regional Events
                        </h4>
                        <span className="text-[10px] text-neutral-400 font-medium">Live Feed</span>
                      </div>

                      <div className="flex flex-col gap-2.5 text-xs">
                        {incidents.slice(0, 3).map((inc, i) => (
                          <div key={inc.id} className="flex items-start gap-2.5">
                            <span className="text-[10px] font-mono font-bold text-neutral-400 shrink-0 mt-0.5">
                              {new Date(inc.createdAt || Date.now()).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${
                                inc.status === "CLOSED" ? "bg-emerald-500" : i === 0 ? "bg-black" : "bg-neutral-300"
                              }`}
                            />
                            <span className="text-[#111111] text-[11px] leading-tight truncate">
                              #{inc.incidentNumber} ({inc.severity}) • {inc.status}
                            </span>
                          </div>
                        ))}
                        {incidents.length === 0 && (
                          <div className="text-[11px] text-neutral-400">No recent incident logs.</div>
                        )}
                      </div>
                    </div>

                    {/* Noir Photo Quote Card */}
                    <div className="relative rounded-[24px] overflow-hidden bg-[#0A0A0A] text-white p-5 select-none min-h-[135px] flex flex-col justify-between">
                      <Image
                        src="/images/gabriel-hospital-hero.jpg"
                        alt="Hospital Trauma Corridor"
                        fill
                        sizes="(max-width: 1024px) 100vw, 350px"
                        className="object-cover object-center opacity-30 mix-blend-luminosity brightness-75 contrast-125"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

                      <div className="relative z-10">
                        <h4 className="text-sm font-extrabold text-white leading-snug">
                          “Every second<br />prepares a life.”
                        </h4>
                      </div>

                      <div className="relative z-10 text-[10px] text-neutral-400 font-medium flex items-center justify-between">
                        <span>Ready teams. Stronger tomorrows.</span>
                        <span className="font-mono text-white/60">GABRIEL EMS</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </main>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            3. AUDIT / INSPECT CASE MODAL
        ───────────────────────────────────────────────────────────── */}
        {inspectCase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-[28px] max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-neutral-200">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <FolderCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#111111]">
                      Case Audit #{inspectCase.incidentNumber}
                    </h3>
                    <span className="text-[10px] text-neutral-400">
                      Disposed Trauma Mission Report
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setInspectCase(null)}
                  className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3.5 my-5 text-xs text-neutral-700">
                <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50">
                  <span className="text-neutral-400 font-medium">Status &amp; Acuity</span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      {inspectCase.status}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-neutral-900 text-white text-[10px] font-bold">
                      {inspectCase.severity}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-neutral-50 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Casualties</span>
                    <span className="font-bold text-[#111111]">{inspectCase.victimCount} Patient(s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Assigned Unit</span>
                    <span className="font-bold text-[#111111]">{inspectCase.assignedAmbulanceId || "Unit A-01"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Scene Location</span>
                    <span className="font-bold text-[#111111] text-right max-w-[240px] truncate">
                      {inspectCase.location?.address || `${inspectCase.location.latitude}, ${inspectCase.location.longitude}`}
                    </span>
                  </div>
                </div>

                {inspectCase.description && (
                  <div className="p-3 rounded-xl bg-neutral-50 text-[11px] italic text-neutral-600">
                    &ldquo;{inspectCase.description}&rdquo;
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-neutral-100 flex justify-end">
                <button
                  onClick={() => setInspectCase(null)}
                  className="px-6 py-2.5 rounded-full bg-[#111111] text-white text-xs font-bold hover:bg-neutral-800 cursor-pointer"
                >
                  Close Summary
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

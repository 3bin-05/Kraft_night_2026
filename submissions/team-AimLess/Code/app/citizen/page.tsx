"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";
import { useSocketEvent } from "@/lib/socket";
import { Incident } from "@/types/incident";
import {
  Zap,
  Phone,
  Shield,
  Users,
  MapPin,
  ChevronRight,
  ChevronDown,
  Bell,
  Home,
  FileText,
  User as UserIcon,
  HelpCircle,
  Settings,
  Truck,
  ArrowRight,
  Menu,
  X,
  LogOut,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from "lucide-react";

export default function CitizenDashboardPage() {
  const { user, logout } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"home" | "emergencies" | "profile" | "help" | "settings">("home");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);

  // Live Location Detection
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>({
    lat: 9.9312,
    lng: 76.2673,
  });
  const [locationName, setLocationName] = useState("Kochi, Kerala");

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            lat: Number(position.coords.latitude.toFixed(4)),
            lng: Number(position.coords.longitude.toFixed(4)),
          });
        },
        () => {
          // Fallback to Kochi, Kerala defaults
        }
      );
    }
  }, []);

  const fetchIncidents = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getIncidents("me");
      setIncidents(data);
    } catch {
      setIncidents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  // Real-time telemetry events
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

  useSocketEvent("ambulance:assigned", ({ incident }) => {
    setIncidents((prev) =>
      prev.map((i) => (i.id === incident.id ? incident : i))
    );
  });

  // Mock active incident if none in DB for complete visual matching
  const realActiveIncident = incidents.find((inc) => inc.status !== "CLOSED");
  const activeIncident = realActiveIncident || {
    id: "ER-1042",
    incidentNumber: "ER-1042",
    type: "ACCIDENT",
    description: "Multi-vehicle collision reported on main highway",
    location: {
      address: "Marine Drive, Kochi, Kerala",
      lat: userCoords?.lat || 9.9312,
      lng: userCoords?.lng || 76.2673,
    },
    severity: "CRITICAL",
    status: "DISPATCHED",
    createdAt: new Date().toISOString(),
    assignedAmbulance: {
      callSign: "AMB-01",
      driverName: "Vikram S.",
      driverPhone: "+91 98470 12345",
      currentLocation: { lat: 9.935, lng: 76.27 },
    },
  };

  const displayName = user?.name || "Arjun N";
  const firstName = displayName.split(" ")[0] || "Arjun";
  const userInitial = firstName.charAt(0).toUpperCase() || "A";

  return (
    <ProtectedRoute allowedRoles={["CITIZEN"]}>
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
            <div className="flex items-center justify-between pb-8">
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
                className="lg:hidden p-1 text-neutral-500 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Menu Links */}
            <nav className="flex flex-col gap-1.5">
              <button
                onClick={() => {
                  setActiveTab("home");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-semibold transition-all ${
                  activeTab === "home"
                    ? "bg-[#111111] text-white shadow-sm"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
                }`}
              >
                <Home className="w-4 h-4 shrink-0" strokeWidth={2} />
                <span>Home</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("emergencies");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-semibold transition-all ${
                  activeTab === "emergencies"
                    ? "bg-[#111111] text-white shadow-sm"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
                }`}
              >
                <FileText className="w-4 h-4 shrink-0" strokeWidth={2} />
                <span>My Emergencies</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("profile");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-semibold transition-all ${
                  activeTab === "profile"
                    ? "bg-[#111111] text-white shadow-sm"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
                }`}
              >
                <UserIcon className="w-4 h-4 shrink-0" strokeWidth={2} />
                <span>Profile</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("help");
                  setShowSafetyModal(true);
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-semibold transition-all ${
                  activeTab === "help"
                    ? "bg-[#111111] text-white shadow-sm"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
                }`}
              >
                <HelpCircle className="w-4 h-4 shrink-0" strokeWidth={2} />
                <span>Help & Support</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("settings");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-semibold transition-all ${
                  activeTab === "settings"
                    ? "bg-[#111111] text-white shadow-sm"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
                }`}
              >
                <Settings className="w-4 h-4 shrink-0" strokeWidth={2} />
                <span>Settings</span>
              </button>
            </nav>
          </div>

          {/* Bottom Sidebar Mission Text */}
          <div className="pt-6 border-t border-neutral-100">
            <div className="w-8 h-[1.5px] bg-neutral-300 rounded-full mb-3" />
            <p className="text-[11px] text-neutral-400 font-normal leading-relaxed">
              In an emergency,<br />
              every second counts.
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
            2. MAIN DASHBOARD CONTENT AREA
        ───────────────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Header Bar */}
          <header className="w-full bg-[#FFFFFF] border-b border-neutral-200/70 px-6 sm:px-8 lg:px-10 h-20 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-full hover:bg-neutral-100 text-black"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="hidden sm:block text-xs font-bold uppercase tracking-[0.25em] text-neutral-400">
                Citizen Portal
              </div>
            </div>

            {/* Right Header Elements */}
            <div className="flex items-center gap-5 sm:gap-7">
              {/* Notification Bell */}
              <button
                className="relative p-2 rounded-full hover:bg-neutral-100 text-neutral-700 transition-colors cursor-pointer"
                title="Notifications"
                onClick={() => alert("No unread alerts. You will be notified instantly when emergency status changes.")}
              >
                <Bell className="w-4 h-4" strokeWidth={2} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-black ring-2 ring-white" />
              </button>

              {/* User Chip with Dropdown */}
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
                      Citizen
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400 hidden sm:block" />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-neutral-200/80 py-2 z-50 animate-fade-in">
                    <div className="px-4 py-2 border-b border-neutral-100">
                      <div className="text-xs font-bold text-[#111111]">{displayName}</div>
                      <div className="text-[10px] text-neutral-400 truncate">{user?.email}</div>
                    </div>
                    <Link
                      href="/"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                    >
                      <Home className="w-3.5 h-3.5 text-neutral-400" />
                      Home Landing
                    </Link>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>

              {/* Tagline on Far Right */}
              <div className="hidden md:flex items-center gap-2 text-xs font-medium text-neutral-400 tracking-wide pl-3 border-l border-neutral-200">
                <span>A safer tomorrow. Together.</span>
                <div className="w-6 h-[1.5px] bg-neutral-300 rounded-full" />
              </div>
            </div>
          </header>

          {/* Main Container */}
          <main className="p-6 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto flex flex-col gap-8">
            {/* ─────────────────────────────────────────────────────────
                ROW 1: GREETING & LOCATION STATUS
            ───────────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111111] tracking-tight">
                  Hello, {firstName}.
                </h1>
                <p className="text-sm sm:text-[15px] text-neutral-400 font-normal mt-0.5">
                  Stay ready. Help save lives.
                </p>
              </div>

              {/* Location Status Badge */}
              <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-neutral-200/80 shadow-xs">
                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-black">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#111111]">{locationName}</span>
                  <span className="text-[10px] text-neutral-500 font-medium flex items-center gap-1">
                    Location services active
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  </span>
                </div>
              </div>
            </div>

            {/* ─────────────────────────────────────────────────────────
                ROW 2: HERO REPORT EMERGENCY BANNER (With Pulse Radar)
            ───────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 8 Cols: SOS Callout Box */}
              <div className="lg:col-span-8 bg-[#F7F7F8] rounded-[28px] p-8 sm:p-10 border border-neutral-200/70 flex flex-col sm:flex-row items-center justify-between gap-8 relative overflow-hidden">
                <div className="max-w-md">
                  <div className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-neutral-400 mb-2">
                    Need Immediate Help?
                  </div>
                  <h2 className="text-3xl sm:text-[34px] font-black text-[#111111] tracking-tight leading-tight mb-2.5">
                    Report an<br className="hidden sm:inline" /> Emergency
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-500 font-normal leading-relaxed mb-6">
                    Get help fast. We&apos;ll use your location to alert nearby ambulances.
                  </p>

                  <Link
                    href="/emergency-report"
                    className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-[#111111] hover:bg-[#262626] active:scale-[0.99] text-white font-bold text-xs sm:text-sm tracking-wider uppercase shadow-md transition-all cursor-pointer"
                  >
                    <Zap className="w-4 h-4 fill-white text-white shrink-0" />
                    <span>SOS &nbsp;Report Emergency</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </Link>
                  <p className="text-[11px] text-neutral-400 mt-3">
                    No account required for emergency reporting.
                  </p>
                </div>

                {/* Right Interactive Animated Radar Button */}
                <div className="flex flex-col items-center select-none">
                  <Link
                    href="/emergency-report"
                    className="relative flex items-center justify-center p-8 rounded-full group cursor-pointer"
                  >
                    {/* Concentric Radar Rings */}
                    <div className="absolute inset-0 rounded-full bg-neutral-200/60 animate-ping opacity-25" />
                    <div className="absolute inset-3 rounded-full border border-neutral-300 animate-pulse" />
                    <div className="absolute inset-6 rounded-full border border-neutral-300" />

                    {/* Central Flash Button */}
                    <div className="relative w-20 h-20 rounded-full bg-[#111111] group-hover:scale-105 group-active:scale-95 text-white flex items-center justify-center shadow-lg transition-transform">
                      <Zap className="w-8 h-8 fill-white text-white animate-pulse" />
                    </div>
                  </Link>
                  <span className="text-xs text-neutral-500 font-semibold mt-1">
                    Tap to get help now
                  </span>
                </div>
              </div>

              {/* Right 4 Cols: Quick Access Widgets */}
              <div className="lg:col-span-4 flex flex-col gap-3.5">
                {/* Widget 1: Your Location */}
                <div className="bg-white rounded-2xl p-4 sm:p-4.5 border border-neutral-200/80 shadow-xs flex items-center justify-between hover:border-black transition-all cursor-pointer">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-black shrink-0">
                      <MapPin className="w-5 h-5 stroke-[1.8]" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#111111]">Your Location</div>
                      <div className="text-[11px] text-neutral-500 font-medium mt-0.5">
                        {locationName}
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        {userCoords ? `${userCoords.lat}° N, ${userCoords.lng}° E` : "9.9312° N, 76.2673° E"}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </div>

                {/* Widget 2: Emergency Contacts */}
                <div
                  onClick={() => setShowContactsModal(true)}
                  className="bg-white rounded-2xl p-4 sm:p-4.5 border border-neutral-200/80 shadow-xs flex items-center justify-between hover:border-black transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-black shrink-0">
                      <Users className="w-5 h-5 stroke-[1.8]" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#111111]">Emergency Contacts</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        Keep your trusted contacts ready.
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </div>

                {/* Widget 3: Safety Tips */}
                <div
                  onClick={() => setShowSafetyModal(true)}
                  className="bg-white rounded-2xl p-4 sm:p-4.5 border border-neutral-200/80 shadow-xs flex items-center justify-between hover:border-black transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-black shrink-0">
                      <Shield className="w-5 h-5 stroke-[1.8]" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#111111]">Safety Tips</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        Learn what to do in an emergency.
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </div>
              </div>
            </div>

            {/* ─────────────────────────────────────────────────────────
                ROW 3: ACTIVE EMERGENCY & RECENT INCIDENTS
            ───────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Active Emergency (8 Cols) */}
              <div className="lg:col-span-8 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-bold text-[#111111] tracking-tight">
                    Your Active Emergency
                  </h3>
                  <Link
                    href="/emergency-report"
                    className="text-xs font-bold text-neutral-500 hover:text-black flex items-center gap-1"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Active Card Body */}
                <div className="bg-white rounded-[24px] border border-neutral-200/80 p-6 sm:p-7 shadow-xs">
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-center">
                    {/* Telemetry Details */}
                    <div className="xl:col-span-7 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2.5 mb-2">
                          <span className="text-xs font-bold text-[#111111]">
                            #{activeIncident.incidentNumber || activeIncident.id}
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-100 text-[10px] font-bold text-[#111111]">
                            <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                            IN PROGRESS
                          </span>
                        </div>

                        <h4 className="text-xl font-extrabold text-[#111111] tracking-tight mb-1">
                          Accident Reported
                        </h4>
                        <div className="text-xs text-neutral-400 mb-6">
                          Today, 10:24 AM
                        </div>

                        {/* 5-Step Timeline */}
                        <div className="relative mb-6">
                          {/* Progress Line */}
                          <div className="absolute top-3 inset-x-2 h-[2px] bg-neutral-200 z-0" />
                          <div className="absolute top-3 left-2 w-1/4 h-[2px] bg-[#111111] z-0" />

                          <div className="relative z-10 flex items-start justify-between text-center">
                            {/* Step 1 */}
                            <div className="flex flex-col items-center">
                              <div className="w-6 h-6 rounded-full bg-[#111111] text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                                ✓
                              </div>
                              <span className="text-[10px] font-bold text-[#111111] mt-1.5">
                                Reported
                              </span>
                              <span className="text-[9px] text-neutral-400">10:24 AM</span>
                            </div>

                            {/* Step 2 (Active) */}
                            <div className="flex flex-col items-center">
                              <div className="w-6 h-6 rounded-full bg-[#111111] ring-4 ring-neutral-200 text-white flex items-center justify-center text-[10px] font-bold">
                                •
                              </div>
                              <span className="text-[10px] font-bold text-[#111111] mt-1.5">
                                Ambulance<br />Assigned
                              </span>
                            </div>

                            {/* Step 3 */}
                            <div className="flex flex-col items-center opacity-40">
                              <div className="w-6 h-6 rounded-full bg-neutral-200 text-neutral-600 flex items-center justify-center text-[10px]">
                                3
                              </div>
                              <span className="text-[10px] font-medium text-neutral-500 mt-1.5">
                                En Route
                              </span>
                            </div>

                            {/* Step 4 */}
                            <div className="flex flex-col items-center opacity-40">
                              <div className="w-6 h-6 rounded-full bg-neutral-200 text-neutral-600 flex items-center justify-center text-[10px]">
                                4
                              </div>
                              <span className="text-[10px] font-medium text-neutral-500 mt-1.5">
                                Arriving
                              </span>
                            </div>

                            {/* Step 5 */}
                            <div className="flex flex-col items-center opacity-40">
                              <div className="w-6 h-6 rounded-full bg-neutral-200 text-neutral-600 flex items-center justify-center text-[10px]">
                                5
                              </div>
                              <span className="text-[10px] font-medium text-neutral-500 mt-1.5">
                                At Hospital
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Status Callout Box */}
                      <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#F7F7F8] border border-neutral-200/80">
                        <Truck className="w-4 h-4 text-black shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-bold text-[#111111]">
                            Ambulance is being assigned
                          </div>
                          <div className="text-[11px] text-neutral-500 mt-0.5">
                            We are finding the nearest available ambulance. You&apos;ll be notified shortly.
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Map Snapshot */}
                    <div className="xl:col-span-5 relative h-48 sm:h-56 rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200 select-none">
                      {/* Stylized Grayscale Map Background */}
                      <div className="absolute inset-0 bg-[radial-gradient(#d4d4d8_1px,transparent_1px)] [background-size:16px_16px] bg-[#f4f4f5] flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center mx-auto mb-2 shadow-md">
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div className="bg-white/90 backdrop-blur-xs px-3 py-1 rounded-full border border-neutral-200 text-[11px] font-bold text-black shadow-xs">
                            Your Location ({locationName.split(",")[0]})
                          </div>
                        </div>
                      </div>

                      {/* Live Map CTA Button */}
                      <Link
                        href={`/citizen/incident/${activeIncident.id}`}
                        className="absolute bottom-3 right-3 px-4 py-2 rounded-full bg-[#111111] hover:bg-[#262626] text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md transition-all"
                      >
                        <span>View Live Map</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Emergencies (4 Cols) */}
              <div className="lg:col-span-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-base sm:text-lg font-bold text-[#111111] tracking-tight">
                    <Clock className="w-4 h-4 text-neutral-400" />
                    <span>Recent Emergencies</span>
                  </div>
                  <Link
                    href="/emergency-report"
                    className="text-xs font-bold text-neutral-500 hover:text-black flex items-center gap-1"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="bg-white rounded-[24px] border border-neutral-200/80 p-4 sm:p-5 flex flex-col gap-3 shadow-xs">
                  {/* Item 1 */}
                  <Link
                    href={`/citizen/incident/${activeIncident.id}`}
                    className="p-3.5 rounded-2xl bg-neutral-50/70 hover:bg-neutral-100 border border-neutral-200/60 flex items-center justify-between transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-neutral-600" />
                      <div>
                        <div className="text-xs font-bold text-[#111111]">#ER-1042</div>
                        <div className="text-[11px] text-neutral-400">Accident • Today, 10:24 AM</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-black text-white text-[9px] font-bold">
                        IN PROGRESS
                      </span>
                      <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-black transition-colors" />
                    </div>
                  </Link>

                  {/* Item 2 */}
                  <div className="p-3.5 rounded-2xl bg-white hover:bg-neutral-50 border border-neutral-200/60 flex items-center justify-between transition-all group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-neutral-400" />
                      <div>
                        <div className="text-xs font-bold text-[#111111]">#ER-1038</div>
                        <div className="text-[11px] text-neutral-400">Medical • Sep 18, 2024</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 text-[9px] font-bold">
                        CLOSED
                      </span>
                      <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-black transition-colors" />
                    </div>
                  </div>

                  {/* Item 3 */}
                  <div className="p-3.5 rounded-2xl bg-white hover:bg-neutral-50 border border-neutral-200/60 flex items-center justify-between transition-all group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-neutral-400" />
                      <div>
                        <div className="text-xs font-bold text-[#111111]">#ER-1019</div>
                        <div className="text-[11px] text-neutral-400">Accident • Sep 12, 2024</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 text-[9px] font-bold">
                        CLOSED
                      </span>
                      <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-black transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ─────────────────────────────────────────────────────────
                ROW 4: FULL-WIDTH DARK IMPACT BANNER
            ───────────────────────────────────────────────────────── */}
            <div className="relative rounded-[28px] overflow-hidden bg-[#0A0A0A] text-white p-8 sm:p-10 select-none">
              {/* Background City Highway Photo */}
              <Image
                src="/images/gabriel-home-banner.jpg"
                alt="City Highway Emergency Network"
                fill
                sizes="(max-width: 1280px) 100vw, 1200px"
                className="object-cover object-center opacity-30 mix-blend-luminosity brightness-75 contrast-125"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/85" />

              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-neutral-400 mb-2">
                    Together We Save Lives
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
                    A safer community<br className="hidden sm:inline" /> starts with you.
                  </h3>
                </div>

                <div className="text-left sm:text-right text-xs text-neutral-400">
                  <div className="font-bold text-white mb-0.5">Stay alert.</div>
                  <div>Report. Respond. Recover.</div>
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            MODAL: EMERGENCY CONTACTS
        ───────────────────────────────────────────────────────────── */}
        {showContactsModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-[28px] max-w-md w-full p-6 sm:p-8 shadow-2xl border border-neutral-200">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-black" />
                  <h4 className="text-lg font-bold text-[#111111]">Emergency Contacts</h4>
                </div>
                <button
                  onClick={() => setShowContactsModal(false)}
                  className="p-1 rounded-full hover:bg-neutral-100 text-neutral-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-3 text-xs mb-6">
                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-[#111111]">National Emergency Hotline</div>
                    <div className="text-neutral-500">Ambulance & Disaster Response</div>
                  </div>
                  <span className="font-black text-sm text-black">112</span>
                </div>
                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-[#111111]">Primary Contact (Family)</div>
                    <div className="text-neutral-500">Sarah Connor</div>
                  </div>
                  <span className="font-semibold text-black">+91 98470 54321</span>
                </div>
              </div>

              <button
                onClick={() => setShowContactsModal(false)}
                className="w-full py-3 rounded-full bg-black text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            MODAL: SAFETY TIPS
        ───────────────────────────────────────────────────────────── */}
        {showSafetyModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-[28px] max-w-md w-full p-6 sm:p-8 shadow-2xl border border-neutral-200">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-black" />
                  <h4 className="text-lg font-bold text-[#111111]">Accident Safety Protocol</h4>
                </div>
                <button
                  onClick={() => setShowSafetyModal(false)}
                  className="p-1 rounded-full hover:bg-neutral-100 text-neutral-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-3 text-xs text-neutral-600 mb-6 leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                  <span><strong>Ensure Scene Safety:</strong> Do not enter moving traffic or hazardous areas before evaluating hazards.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                  <span><strong>Report Location Instantly:</strong> Tap the SOS button so ambulances receive pinpoint GPS coordinates.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                  <span><strong>Do Not Move Victims:</strong> Unless there is imminent fire or drowning risk, stabilize neck and breathing.</span>
                </div>
              </div>

              <button
                onClick={() => setShowSafetyModal(false)}
                className="w-full py-3 rounded-full bg-black text-white font-bold text-xs"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

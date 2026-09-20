"use client";

import React, { useState, useEffect } from "react";
import { useGeolocation } from "@/lib/geolocation";
import { Incident, IncidentSeverity } from "@/types/incident";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import {
  ShieldAlert,
  MapPin,
  Crosshair,
  AlertTriangle,
  Users,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Phone,
  FileText,
} from "lucide-react";
import { GpsStateFallback } from "@/components/ui/GpsStateFallback";
import Link from "next/link";

const SEVERITIES: Array<{
  value: IncidentSeverity;
  label: string;
  description: string;
}> = [
  {
    value: "CRITICAL",
    label: "Critical / Life Threatening",
    description: "Unconscious, trapped, severe bleeding, head injury",
  },
  {
    value: "HIGH",
    label: "High Severity",
    description: "Major collision, serious bone fractures, multiple injured",
  },
  {
    value: "MODERATE",
    label: "Moderate",
    description: "Conscious victims, non-life-threatening trauma",
  },
  {
    value: "LOW",
    label: "Minor",
    description: "Minor cuts, fender bender, no apparent major trauma",
  },
];

export function EmergencyReportForm() {
  const { state: geoState, location, errorMessage: geoError, requestLocation, resetLocation, setCustomLocation } =
    useGeolocation();

  const [severity, setSeverity] = useState<IncidentSeverity>("CRITICAL");
  const [victimCount, setVictimCount] = useState<number>(1);
  const [description, setDescription] = useState<string>("");
  const [contactPhone, setContactPhone] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submittedIncident, setSubmittedIncident] = useState<Incident | null>(null);

  // Automatically initiate GPS scan on form load for rapid emergency reporting
  useEffect(() => {
    if (geoState === "IDLE" && !location) {
      requestLocation();
    }
  }, [geoState, location, requestLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!location) {
      setSubmissionError("Accident location is required. Please acquire your GPS position.");
      return;
    }

    setSubmissionError(null);
    setIsSubmitting(true);

    try {
      const response = await api.reportAccident({
        latitude: location.latitude,
        longitude: location.longitude,
        locationAccuracy: location.accuracy,
        severity,
        victimCount,
        description: description.trim() || undefined,
        phone: contactPhone.trim() || undefined,
      });

      setSubmittedIncident(response.incident);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send emergency report.";
      setSubmissionError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success / Incident Confirmation Screen
  if (submittedIncident) {
    return (
      <div className="w-full max-w-xl mx-auto p-4 animate-fade-in">
        <Card variant="surface" className="p-8 sm:p-10 border border-[#E0E0E0] text-center">
          <div className="w-16 h-16 rounded-full bg-[#141414] text-white flex items-center justify-center mx-auto mb-6 shadow-md">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>

          <div className="inline-flex items-center gap-2 bg-[#141414] text-white text-[11px] font-semibold px-3.5 py-1 rounded-full uppercase tracking-wider mb-3">
            Emergency Dispatched
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#141414]">
            EMERGENCY REPORTED
          </h1>

          <div className="my-5 p-4 rounded-[18px] bg-white border border-[#E0E0E0] inline-block">
            <div className="text-xs text-[#707070] font-semibold uppercase tracking-wider">
              Incident Identification
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-[#141414] mt-1">
              #{submittedIncident.incidentNumber}
            </div>
          </div>

          <p className="text-sm text-[#707070] max-w-md mx-auto leading-relaxed mb-6">
            Your GPS location has been sent to the AIMLESS emergency response network.
            Nearest available ambulance units and trauma centers are being alerted.
          </p>

          <div className="p-5 rounded-[18px] bg-[#FFFFFF] border border-[#E0E0E0] text-left space-y-3 mb-8 text-xs text-[#707070]">
            <div className="flex justify-between items-center py-1 border-b border-[#F0F0F0]">
              <span className="font-semibold text-[#141414]">GPS Position:</span>
              <span className="font-mono text-[#141414]">
                {submittedIncident.location.latitude.toFixed(5)}, {submittedIncident.location.longitude.toFixed(5)}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[#F0F0F0]">
              <span className="font-semibold text-[#141414]">Severity Level:</span>
              <Badge variant="dark">{submittedIncident.severity}</Badge>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[#F0F0F0]">
              <span className="font-semibold text-[#141414]">Victim Count:</span>
              <span className="font-semibold text-[#141414]">{submittedIncident.victimCount} Person(s)</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="font-semibold text-[#141414]">Status:</span>
              <Badge variant="default">{submittedIncident.status}</Badge>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setSubmittedIncident(null);
                resetLocation();
                setDescription("");
              }}
              className="flex-1 justify-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Report Another Incident
            </Button>
            <Link href="/" className="flex-1">
              <Button variant="primary" size="md" className="w-full justify-center">
                Return to Home <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4 animate-fade-in">
      <Card variant="surface" className="p-6 sm:p-10 border border-[#E0E0E0]">
        <div className="flex flex-col gap-2 mb-8 text-left">
          <div className="inline-flex items-center gap-2 self-start bg-[#141414] text-white text-[11px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider mb-1">
            <ShieldAlert className="w-3.5 h-3.5" /> Instant SOS
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#141414]">
            Report Road Accident
          </h1>
          <p className="text-sm text-[#707070] leading-relaxed">
            No account required. Please ensure location access is enabled so dispatchers can lock onto the accident scene.
          </p>
        </div>

        {submissionError && (
          <div className="mb-6 p-4 rounded-[16px] bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{submissionError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-8 text-left">
          {/* Section 1: Geolocation Acquisition */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#141414] tracking-tight uppercase flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> 1. Incident Location (GPS)
              </label>
              {location && (
                <span className="text-xs font-mono text-green-700 font-semibold flex items-center gap-1">
                  <Crosshair className="w-3.5 h-3.5" /> ±{location.accuracy}m accuracy
                </span>
              )}
            </div>

            {/* Geolocation Status Card */}
            {geoState === "REQUESTING" ? (
              <div className="p-5 rounded-[18px] bg-white border border-[#E0E0E0] flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-[#141414] border-t-transparent animate-spin" />
                  <div>
                    <div className="text-xs font-bold text-[#141414] uppercase tracking-wider">
                      Locating Incident Scene...
                    </div>
                    <div className="text-xs text-[#707070]">Acquiring high-precision GPS telemetry...</div>
                  </div>
                </div>
                <Badge variant="default">Scanning</Badge>
              </div>
            ) : geoState === "LOCATED" && location ? (
              <div className="p-5 rounded-[18px] bg-white border border-[#141414] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-600" />
                    <span className="text-xs font-bold text-[#141414] uppercase tracking-wider">
                      Location Acquired
                    </span>
                  </div>
                  <div className="text-xs font-mono text-[#707070] mt-1">
                    Lat: {location.latitude.toFixed(6)} | Long: {location.longitude.toFixed(6)}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={requestLocation}
                  className="text-xs self-start sm:self-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Re-scan GPS
                </Button>
              </div>
            ) : geoState === "DENIED" || geoState === "UNAVAILABLE" || geoState === "ERROR" ? (
              <GpsStateFallback
                status={geoState === "DENIED" ? "DENIED" : geoState === "UNAVAILABLE" ? "UNAVAILABLE" : "ERROR"}
                onRetry={requestLocation}
                onManualOverride={() =>
                  setCustomLocation({
                    latitude: 8.9146,
                    longitude: 76.6321,
                    accuracy: 10,
                  })
                }
              />
            ) : (
              <div className="p-5 rounded-[18px] bg-white border border-[#E0E0E0] flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-[#141414]">No Location Telemetry</div>
                  <div className="text-xs text-[#707070]">Click to capture device coordinates</div>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={requestLocation}>
                  <MapPin className="w-3.5 h-3.5 mr-1.5" /> Acquire Location
                </Button>
              </div>
            )}
          </div>

          {/* Section 2: Severity Selection */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-[#141414] tracking-tight uppercase flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> 2. Incident Severity
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SEVERITIES.map((s) => {
                const isSelected = severity === s.value;
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSeverity(s.value)}
                    className={`p-4 rounded-[16px] text-left transition-all duration-200 border flex flex-col justify-between ${
                      isSelected
                        ? "bg-[#141414] text-white border-[#141414] shadow-sm"
                        : "bg-white text-[#141414] border-[#E0E0E0] hover:bg-[#F3F3F3]"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="font-bold text-xs tracking-wider uppercase">
                        {s.label}
                      </span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      )}
                    </div>
                    <span
                      className={`text-[11px] leading-snug ${
                        isSelected ? "text-[#ADADAD]" : "text-[#707070]"
                      }`}
                    >
                      {s.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Victim Count */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-[#141414] tracking-tight uppercase flex items-center gap-1.5">
              <Users className="w-4 h-4" /> 3. Estimated Victims / Casualties
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setVictimCount(count)}
                  className={`flex-1 py-3 rounded-[16px] text-xs font-bold border transition-all duration-150 ${
                    victimCount === count
                      ? "bg-[#141414] text-white border-[#141414]"
                      : "bg-white text-[#141414] border-[#E0E0E0] hover:bg-[#F3F3F3]"
                  }`}
                >
                  {count === 5 ? "5+" : count}
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: Optional Details */}
          <div className="space-y-4 pt-2 border-t border-[#E0E0E0]">
            <div>
              <label className="text-xs font-semibold text-[#141414] tracking-tight uppercase flex items-center gap-1.5 mb-1.5">
                <FileText className="w-4 h-4" /> Incident Details (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Brief description (e.g. 2 cars collided near main intersection, vehicle smoking...)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-[#F0F0F0] text-[#141414] placeholder-[#ADADAD] text-xs sm:text-sm rounded-[16px] border border-transparent transition-all duration-200 outline-none focus:bg-[#FFFFFF] focus:border-[#141414]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#141414] tracking-tight uppercase flex items-center gap-1.5 mb-1.5">
                <Phone className="w-4 h-4" /> Your Contact Phone (Optional)
              </label>
              <Input
                type="tel"
                placeholder="e.g. 9876543210"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                helperText="Optional phone for responders to call back for navigation assistance."
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting || !location}
              isLoading={isSubmitting}
              className="w-full justify-center bg-[#141414] hover:bg-[#262626] text-white uppercase tracking-wider font-bold shadow-md h-16 text-base"
            >
              <ShieldAlert className="w-5 h-5 mr-2" />
              Transmit Emergency SOS
            </Button>
            {!location && (
              <p className="text-center text-xs text-[#707070] mt-2">
                * Please acquire location above to enable emergency transmission.
              </p>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}

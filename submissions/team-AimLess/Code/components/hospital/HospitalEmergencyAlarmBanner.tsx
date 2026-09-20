"use client";

import React, { useState, useEffect } from "react";
import { Incident } from "@/types/incident";
import { Ambulance, AMBULANCE_LEVEL_CONFIGS } from "@/types/ambulance";
import { Hospital } from "@/types/hospital";
import { emergencySiren, getSirenSpeedForSeverity } from "@/lib/audio";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  BellRing,
  Volume2,
  VolumeX,
  Navigation,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Flame,
  Zap,
} from "lucide-react";

interface HospitalEmergencyAlarmBannerProps {
  incident: Incident;
  ambulance?: Ambulance | null;
  hospital?: Hospital | null;
  distanceKm?: number;
  etaMinutes?: number;
  onAcknowledge: (incident: Incident) => void;
  isAcknowledged: boolean;
  isProcessing?: boolean;
}

export function HospitalEmergencyAlarmBanner({
  incident,
  ambulance,
  hospital,
  distanceKm,
  etaMinutes,
  onAcknowledge,
  isAcknowledged,
  isProcessing = false,
}: HospitalEmergencyAlarmBannerProps) {
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [hasInteracted, setHasInteracted] = useState<boolean>(true);

  const sirenSpeed = getSirenSpeedForSeverity(incident.severity);
  const isHighUrgency = sirenSpeed >= 2.0;

  useEffect(() => {
    // If not acknowledged, trigger emergency siren with appropriate speed
    if (!isAcknowledged && !isMuted && hasInteracted) {
      emergencySiren.start(incident.severity, sirenSpeed);
    } else {
      emergencySiren.stop();
    }

    return () => {
      emergencySiren.stop();
    };
  }, [isAcknowledged, isMuted, hasInteracted, incident.severity, sirenSpeed]);

  const toggleMute = () => {
    setHasInteracted(true);
    if (isMuted) {
      setIsMuted(false);
      if (!isAcknowledged) {
        emergencySiren.start(incident.severity, sirenSpeed);
      }
    } else {
      setIsMuted(true);
      emergencySiren.stop();
    }
  };

  const handleAcknowledgeClick = () => {
    setHasInteracted(true);
    emergencySiren.stop();
    onAcknowledge(incident);
  };

  const ambConfig = ambulance?.type ? AMBULANCE_LEVEL_CONFIGS[ambulance.type] : null;
  const ambulanceName = ambulance?.vehicleNumber || ambulance?.callSign || incident.assignedAmbulanceId || "Paramedic Unit";
  const formattedEta = etaMinutes !== undefined ? `${etaMinutes} min` : "Calculating ETA...";

  return (
    <Card
      variant="dark"
      className={`p-6 sm:p-8 bg-[#0A0A0A] text-white border-2 transition-all duration-300 relative overflow-hidden shadow-2xl ${
        !isAcknowledged
          ? isHighUrgency
            ? "border-red-500 shadow-red-950/40"
            : "border-amber-500 shadow-amber-950/40"
          : "border-neutral-800"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-lg ${
              !isAcknowledged
                ? isHighUrgency
                  ? "bg-red-600 text-white animate-pulse"
                  : "bg-amber-600 text-white animate-pulse"
                : "bg-white text-[#141414]"
            }`}
          >
            <BellRing className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-mono font-bold tracking-widest uppercase ${
                  isHighUrgency ? "text-red-400" : "text-amber-400"
                }`}
              >
                {!isAcknowledged
                  ? isHighUrgency
                    ? "Priority Emergency Alert • Critical Acuity"
                    : "Incoming Emergency Trauma Alert"
                  : "Trauma Alert Acknowledged"}
              </span>
              {!isAcknowledged && (
                <span
                  className={`w-2.5 h-2.5 rounded-full animate-ping ${
                    isHighUrgency ? "bg-red-500" : "bg-amber-500"
                  }`}
                />
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-mono font-bold text-white mt-0.5">
              Incident #{incident.incidentNumber}
            </h2>
          </div>
        </div>

        {/* Top Right Controls & Siren Indicator */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Siren Speed Badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold border ${
              isHighUrgency
                ? "bg-red-950/80 border-red-700 text-red-300"
                : "bg-amber-950/80 border-amber-700 text-amber-300"
            }`}
          >
            {isHighUrgency ? (
              <Zap className="w-3.5 h-3.5 text-red-400 animate-bounce" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>Siren: {sirenSpeed.toFixed(1)}x {isHighUrgency ? "(Severe/Critical)" : "(Minor/Moderate)"}</span>
          </div>

          <button
            type="button"
            onClick={toggleMute}
            className="p-2.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white text-xs flex items-center gap-1.5 transition-colors border border-neutral-700 cursor-pointer"
            title={isMuted ? "Unmute Siren" : "Mute Siren"}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-neutral-400" />
            ) : (
              <Volume2 className={`w-4 h-4 animate-pulse ${isHighUrgency ? "text-red-400" : "text-amber-400"}`} />
            )}
            <span className="text-[11px] font-mono">{isMuted ? "MUTED" : "SIREN PLAYING"}</span>
          </button>

          <Badge
            variant="dark"
            className={`text-xs px-3.5 py-1 font-bold ${
              incident.severity === "CRITICAL"
                ? "bg-red-950 text-red-200 border-red-700"
                : incident.severity === "HIGH"
                ? "bg-orange-950 text-orange-200 border-orange-700"
                : incident.severity === "MODERATE"
                ? "bg-amber-950 text-amber-200 border-amber-700"
                : "bg-emerald-950 text-emerald-200 border-emerald-700"
            }`}
          >
            {incident.severity}
          </Badge>
        </div>
      </div>

      {/* Telemetry Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-5 border-b border-neutral-800 text-xs">
        <div className="p-4 rounded-[16px] bg-neutral-900/90 border border-neutral-800">
          <div className="text-neutral-400 mb-1 flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-white" /> Inbound Unit
          </div>
          <div className="text-sm font-bold text-white truncate">
            {ambulanceName}
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5 flex items-center gap-1.5">
            {ambConfig ? (
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${ambConfig.tagColor}`}>
                {ambConfig.letter} • {ambConfig.shortTitle.split("•")[1] || "EMS"}
              </span>
            ) : (
              <span>Paramedic unit in transit</span>
            )}
          </div>
        </div>

        <div className="p-4 rounded-[16px] bg-neutral-900/90 border border-neutral-800">
          <div className="text-neutral-400 mb-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-white" /> Estimated Arrival (ETA)
          </div>
          <div className="text-sm font-mono font-bold text-white">
            {formattedEta} {distanceKm !== undefined && `(${distanceKm.toFixed(1)} km)`}
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5">
            Status: <span className="text-emerald-400 font-semibold">{incident.status}</span>
          </div>
        </div>

        <div className="p-4 rounded-[16px] bg-neutral-900/90 border border-neutral-800">
          <div className="text-neutral-400 mb-1 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-white" /> Casualties & Acuity
          </div>
          <div className="text-sm font-bold text-white">
            {incident.victimCount} Patient{incident.victimCount > 1 ? "s" : ""} ({incident.severity})
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5">Prepare trauma resuscitation bay</div>
        </div>

        <div className="p-4 rounded-[16px] bg-neutral-900/90 border border-neutral-800">
          <div className="text-neutral-400 mb-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-white" /> Incident Scene
          </div>
          <div className="text-sm font-mono font-bold text-white truncate">
            {incident.location?.address || `${incident.location.latitude.toFixed(4)}, ${incident.location.longitude.toFixed(4)}`}
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5">Direct telemetry link</div>
        </div>
      </div>

      {incident.description && (
        <div className="my-4 p-3.5 rounded-[14px] bg-neutral-900/90 border border-neutral-800 text-xs text-neutral-300 italic flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>&ldquo;{incident.description}&rdquo;</span>
        </div>
      )}

      {/* Alarm Acknowledge Action Area */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-neutral-400">
          {!isAcknowledged ? (
            <span className="flex items-center gap-1.5 text-amber-300 font-medium">
              <Flame className="w-4 h-4 text-amber-400" />
              Audible siren ({sirenSpeed}x) sounding at trauma desk. Staff must acknowledge and prepare emergency department.
            </span>
          ) : (
            <span className="text-emerald-400 font-medium">
              ✓ Alarm acknowledged. Surgical trauma team and emergency bay standing by.
            </span>
          )}
        </div>

        {!isAcknowledged ? (
          <Button
            variant="primary"
            size="lg"
            disabled={isProcessing}
            isLoading={isProcessing}
            onClick={handleAcknowledgeClick}
            className="w-full sm:w-auto bg-white text-[#141414] hover:bg-neutral-200 font-bold text-xs uppercase tracking-wider h-12 px-8 shadow-lg cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5 mr-2" /> Acknowledge &amp; Silence Siren
          </Button>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 text-white text-xs font-semibold uppercase tracking-wider border border-neutral-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Siren Silenced • ER Staff Alerted
          </div>
        )}
      </div>
    </Card>
  );
}

import React from "react";
import { Incident } from "@/types/incident";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ShieldAlert, Navigation, Users, MapPin, Check, X } from "lucide-react";

interface IncomingEmergencyAlertProps {
  incident: Incident;
  onAccept: (incident: Incident) => void;
  onDecline?: (incident: Incident) => void;
  isProcessing?: boolean;
}

export function IncomingEmergencyAlert({
  incident,
  onAccept,
  onDecline,
  isProcessing = false,
}: IncomingEmergencyAlertProps) {
  return (
    <Card
      variant="dark"
      className="p-6 sm:p-8 bg-[#141414] text-white border-2 border-white shadow-xl animate-fade-in relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#262626]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white text-[#141414] flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6 text-[#141414] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-widest text-red-400 uppercase">
                Incoming Emergency Alert
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            </div>
            <h3 className="text-2xl font-mono font-bold text-white mt-0.5">
              #{incident.incidentNumber}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="dark" className="bg-red-950 text-red-200 border-red-700">
            {incident.severity}
          </Badge>
          <Badge variant="default" className="text-[#141414]">
            {incident.victimCount} Victim{incident.victimCount > 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      {/* Emergency Scene Telemetry */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-5 text-xs">
        <div className="p-4 rounded-[16px] bg-[#1E1E1E] border border-[#2B2B2B]">
          <div className="text-[#ADADAD] mb-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> Incident Coordinates
          </div>
          <div className="text-sm font-mono font-bold text-white">
            {incident.location.latitude.toFixed(4)}, {incident.location.longitude.toFixed(4)}
          </div>
          <div className="text-[11px] text-[#ADADAD] mt-0.5">Estimated proximity: 1.8 km</div>
        </div>

        <div className="p-4 rounded-[16px] bg-[#1E1E1E] border border-[#2B2B2B]">
          <div className="text-[#ADADAD] mb-1 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Triage Information
          </div>
          <div className="text-sm font-bold text-white">
            {incident.severity} PRIORITY
          </div>
          <div className="text-[11px] text-[#ADADAD] mt-0.5">
            {incident.victimCount} casualty onboard requirement
          </div>
        </div>

        <div className="p-4 rounded-[16px] bg-[#1E1E1E] border border-[#2B2B2B]">
          <div className="text-[#ADADAD] mb-1 flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5" /> Estimated En-Route Time
          </div>
          <div className="text-sm font-mono font-bold text-white">
            ~04:30 min
          </div>
          <div className="text-[11px] text-[#ADADAD] mt-0.5">Direct response corridor</div>
        </div>
      </div>

      {incident.description && (
        <div className="p-3 bg-[#1E1E1E] rounded-[14px] text-xs text-[#E0E0E0] mb-6 italic border border-[#2B2B2B]">
          &ldquo;{incident.description}&rdquo;
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <Button
          variant="primary"
          size="lg"
          disabled={isProcessing}
          isLoading={isProcessing}
          onClick={() => onAccept(incident)}
          className="w-full sm:flex-1 bg-white text-[#141414] hover:bg-[#F0F0F0] font-bold text-sm tracking-wider uppercase h-14"
        >
          <Check className="w-5 h-5 mr-2" /> Accept Emergency Mission
        </Button>

        {onDecline && (
          <Button
            variant="outline"
            size="lg"
            disabled={isProcessing}
            onClick={() => onDecline(incident)}
            className="w-full sm:w-auto border-[#3A3A3A] text-[#ADADAD] hover:text-white hover:bg-[#262626] h-14 px-6 text-xs font-semibold uppercase tracking-wider"
          >
            <X className="w-4 h-4 mr-1.5" /> Decline
          </Button>
        )}
      </div>
    </Card>
  );
}

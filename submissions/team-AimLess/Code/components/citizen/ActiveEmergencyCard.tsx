import React from "react";
import { Incident } from "@/types/incident";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { IncidentTimeline } from "./IncidentTimeline";
import Link from "next/link";
import {
  ShieldAlert,
  Navigation,
  Clock,
  MapPin,
  Users,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

interface ActiveEmergencyCardProps {
  incident: Incident;
}

export function ActiveEmergencyCard({ incident }: ActiveEmergencyCardProps) {
  return (
    <Card variant="dark" className="p-6 sm:p-8 bg-[#141414] text-white border border-[#262626] shadow-md animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#262626]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white text-[#141414] flex items-center justify-center shrink-0 shadow">
            <ShieldAlert className="w-5 h-5 text-[#141414] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono tracking-widest text-[#ADADAD] uppercase">
                Active Incident
              </span>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            </div>
            <h2 className="text-xl sm:text-2xl font-mono font-bold tracking-tight text-white mt-0.5">
              #{incident.incidentNumber}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white text-[#141414]">
            {incident.status}
          </span>
          <span className="px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#262626] text-white border border-[#3A3A3A]">
            {incident.severity}
          </span>
        </div>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-6 border-b border-[#262626]">
        {/* Metric 1: Location */}
        <div className="p-4 rounded-[16px] bg-[#1E1E1E] border border-[#2B2B2B]">
          <div className="flex items-center gap-2 text-xs text-[#ADADAD] mb-1">
            <MapPin className="w-3.5 h-3.5" /> GPS Coordinates
          </div>
          <div className="text-sm font-mono font-bold text-white">
            {incident.location.latitude.toFixed(4)}, {incident.location.longitude.toFixed(4)}
          </div>
          <div className="text-[11px] text-[#ADADAD] mt-1">
            {incident.location.accuracy ? `±${incident.location.accuracy}m GPS precision` : "Scene locked"}
          </div>
        </div>

        {/* Metric 2: Casualties */}
        <div className="p-4 rounded-[16px] bg-[#1E1E1E] border border-[#2B2B2B]">
          <div className="flex items-center gap-2 text-xs text-[#ADADAD] mb-1">
            <Users className="w-3.5 h-3.5" /> Victims Reported
          </div>
          <div className="text-sm font-bold text-white">
            {incident.victimCount} Person{incident.victimCount > 1 ? "s" : ""}
          </div>
          <div className="text-[11px] text-[#ADADAD] mt-1">
            {incident.description ? "Notes recorded" : "Immediate triage"}
          </div>
        </div>

        {/* Metric 3: Assigned Unit */}
        <div className="p-4 rounded-[16px] bg-[#1E1E1E] border border-[#2B2B2B]">
          <div className="flex items-center gap-2 text-xs text-[#ADADAD] mb-1">
            <Navigation className="w-3.5 h-3.5" /> Ambulance Unit
          </div>
          <div className="text-sm font-bold text-white">
            {incident.assignedAmbulanceId || "Dispatching Unit..."}
          </div>
          <div className="text-[11px] text-[#ADADAD] mt-1">
            {incident.assignedAmbulanceId ? "Real-time telemetry" : "Locating nearest fleet"}
          </div>
        </div>

        {/* Metric 4: ETA */}
        <div className="p-4 rounded-[16px] bg-[#1E1E1E] border border-[#2B2B2B]">
          <div className="flex items-center gap-2 text-xs text-[#ADADAD] mb-1">
            <Clock className="w-3.5 h-3.5" /> Estimated ETA
          </div>
          <div className="text-sm font-mono font-bold text-white">
            {incident.assignedAmbulanceId ? "04:32 min" : "Calculating..."}
          </div>
          <div className="text-[11px] text-[#ADADAD] mt-1">
            Route calculation active
          </div>
        </div>
      </div>

      {/* Progress Timeline Stepper */}
      <div className="pt-4">
        <IncidentTimeline currentStatus={incident.status} />
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-4 border-t border-[#262626]">
        <div className="text-xs text-[#ADADAD] text-center sm:text-left">
          Reported: {new Date(incident.createdAt).toLocaleString()} • Incident ID: {incident.id}
        </div>
        <Link href={`/citizen/incident/${incident.id}`}>
          <Button
            variant="secondary"
            size="md"
            className="bg-white text-[#141414] hover:bg-[#E5E5E5] text-xs font-bold uppercase tracking-wider"
          >
            View Live Incident Details <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}

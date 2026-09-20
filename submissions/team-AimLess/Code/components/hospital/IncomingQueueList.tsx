import React from "react";
import { Incident } from "@/types/incident";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Navigation, Clock, Users, ShieldAlert, MapPin } from "lucide-react";

interface IncomingQueueListProps {
  incidents: Incident[];
  activeIncidentId?: string;
  onSelectIncident?: (incident: Incident) => void;
}

export function IncomingQueueList({
  incidents,
  activeIncidentId,
  onSelectIncident,
}: IncomingQueueListProps) {
  if (incidents.length === 0) {
    return (
      <EmptyState
        icon={<ShieldAlert className="w-5 h-5 text-[#707070]" />}
        title="No Incoming Dispatches"
        description="No active ambulance emergency missions are currently inbound to this trauma center."
      />
    );
  }

  return (
    <div className="space-y-3">
      {incidents.map((inc) => {
        const isSelected = inc.id === activeIncidentId;

        return (
          <div
            key={inc.id}
            onClick={() => onSelectIncident && onSelectIncident(inc)}
            className={`p-4 rounded-[16px] border transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
              isSelected
                ? "bg-[#141414] text-white border-[#141414] shadow-md"
                : "bg-white text-[#141414] border-[#E0E0E0] hover:border-[#141414]"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                  isSelected
                    ? "bg-white text-[#141414]"
                    : "bg-[#F0F0F0] text-[#141414]"
                }`}
              >
                <Navigation className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm">
                    #{inc.incidentNumber}
                  </span>
                  <Badge
                    variant={isSelected ? "default" : "dark"}
                    className="text-[10px] px-2 py-0.5"
                  >
                    {inc.status}
                  </Badge>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      isSelected
                        ? "bg-[#262626] text-white"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {inc.severity}
                  </span>
                </div>
                <div
                  className={`flex flex-wrap items-center gap-3 mt-1 ${
                    isSelected ? "text-[#ADADAD]" : "text-[#707070]"
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Navigation className="w-3 h-3" /> {inc.assignedAmbulanceId || "Unit A-01"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" /> {inc.victimCount} Casualty(s)
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <MapPin className="w-3 h-3" />
                    {inc.location.latitude.toFixed(4)}, {inc.location.longitude.toFixed(4)}
                  </span>
                </div>
              </div>
            </div>

            <div
              className={`text-right sm:self-center shrink-0 ${
                isSelected ? "text-white" : "text-[#141414]"
              }`}
            >
              <div className="text-[10px] uppercase font-bold text-[#ADADAD]">Est. ETA</div>
              <div className="text-sm font-mono font-bold">~04:32 min</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

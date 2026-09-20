import React from "react";
import { Ambulance } from "@/types/ambulance";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Navigation, MapPin, Gauge, Radio, Phone, User } from "lucide-react";

interface AdminAmbulanceMonitorProps {
  ambulances: Ambulance[];
}

export function AdminAmbulanceMonitor({ ambulances }: AdminAmbulanceMonitorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {ambulances.map((amb) => (
        <Card key={amb.id} variant="white" className="p-5 border border-[#E0E0E0]">
          <div className="flex items-center justify-between pb-3 border-b border-[#E0E0E0]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#141414] text-white flex items-center justify-center font-bold text-xs">
                {amb.vehicleNumber.split(" ")[1] || "A-01"}
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#141414]">{amb.vehicleNumber}</h4>
                <span className="text-[11px] text-[#707070]">{amb.driverName}</span>
              </div>
            </div>

            <Badge
              variant="dark"
              className={
                amb.status === "AVAILABLE"
                  ? "bg-green-700"
                  : amb.status === "RESPONDING"
                  ? "bg-amber-600"
                  : amb.status === "TRANSPORTING"
                  ? "bg-blue-600"
                  : "bg-gray-600"
              }
            >
              {amb.status}
            </Badge>
          </div>

          <div className="pt-3 space-y-2 text-xs text-[#707070]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#141414]">
                <MapPin className="w-3.5 h-3.5 text-[#707070]" /> GPS Telemetry:
              </span>
              <span className="font-mono text-[#141414]">
                {amb.latitude.toFixed(4)}, {amb.longitude.toFixed(4)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#141414]">
                <Phone className="w-3.5 h-3.5 text-[#707070]" /> Driver Contact:
              </span>
              <span className="text-[#141414]">{amb.driverPhone}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#141414]">
                <Navigation className="w-3.5 h-3.5 text-[#707070]" /> Active Mission:
              </span>
              <span className="font-semibold text-[#141414]">
                {amb.currentIncidentId ? `#${amb.currentIncidentId}` : "None (Standby)"}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-[#F0F0F0]">
              <span className="flex items-center gap-1.5 text-green-700 font-medium">
                <Radio className="w-3.5 h-3.5" /> Fleet Beacon:
              </span>
              <span className="text-green-700 font-semibold">Active Stream</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

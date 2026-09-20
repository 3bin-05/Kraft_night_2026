import React from "react";
import { Card } from "@/components/ui/Card";
import { Incident } from "@/types/incident";
import { Ambulance } from "@/types/ambulance";
import { Hospital } from "@/types/hospital";
import { User } from "@/types/auth";
import { Activity, Navigation, Building2, Users } from "lucide-react";

interface AdminMetricsOverviewProps {
  incidents: Incident[];
  ambulances: Ambulance[];
  hospitals: Hospital[];
  users: User[];
}

export function AdminMetricsOverview({
  incidents,
  ambulances,
  hospitals,
  users,
}: AdminMetricsOverviewProps) {
  const activeIncidentsCount = incidents.filter((i) => i.status !== "CLOSED").length;
  const respondingAmbulancesCount = ambulances.filter(
    (a) => a.status === "RESPONDING" || a.status === "TRANSPORTING"
  ).length;
  const availableBedsTotal = hospitals.reduce(
    (sum, h) => sum + (h.availableBeds || 0),
    0
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Metric 1 */}
      <Card variant="white" className="p-5 border border-[#E0E0E0]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#707070]">
            Active Incidents
          </span>
          <div className="w-8 h-8 rounded-full bg-[#141414] text-white flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-mono font-bold text-[#141414]">
          {activeIncidentsCount}
        </div>
        <div className="text-xs text-[#707070] mt-1 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          {incidents.length} total logged in system
        </div>
      </Card>

      {/* Metric 2 */}
      <Card variant="white" className="p-5 border border-[#E0E0E0]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#707070]">
            Ambulance Fleet
          </span>
          <div className="w-8 h-8 rounded-full bg-[#141414] text-white flex items-center justify-center">
            <Navigation className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-mono font-bold text-[#141414]">
          {ambulances.length}
        </div>
        <div className="text-xs text-[#707070] mt-1">
          <strong className="text-[#141414]">{respondingAmbulancesCount}</strong> currently on active dispatch
        </div>
      </Card>

      {/* Metric 3 */}
      <Card variant="white" className="p-5 border border-[#E0E0E0]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#707070]">
            Trauma Center Beds
          </span>
          <div className="w-8 h-8 rounded-full bg-[#141414] text-white flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-mono font-bold text-[#141414]">
          {availableBedsTotal}
        </div>
        <div className="text-xs text-[#707070] mt-1">
          Across <strong className="text-[#141414]">{hospitals.length}</strong> trauma facilities
        </div>
      </Card>

      {/* Metric 4 */}
      <Card variant="white" className="p-5 border border-[#E0E0E0]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#707070]">
            Stakeholder Users
          </span>
          <div className="w-8 h-8 rounded-full bg-[#141414] text-white flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-mono font-bold text-[#141414]">
          {users.length}
        </div>
        <div className="text-xs text-[#707070] mt-1">
          PostgreSQL server accounts
        </div>
      </Card>
    </div>
  );
}

import React from "react";
import { Incident, IncidentStatus } from "@/types/incident";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ShieldAlert, MapPin, Users, Navigation, Building2, Clock, ArrowRight } from "lucide-react";

interface AdminIncidentsTableProps {
  incidents: Incident[];
  onUpdateStatus?: (incidentId: string, status: IncidentStatus) => void;
}

export function AdminIncidentsTable({
  incidents,
  onUpdateStatus,
}: AdminIncidentsTableProps) {
  if (incidents.length === 0) {
    return (
      <Card variant="white" className="p-8 text-center border border-[#E0E0E0]">
        <div className="w-10 h-10 rounded-full bg-[#F3F3F3] flex items-center justify-center mx-auto mb-3 text-[#707070]">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-bold text-[#141414]">No Emergency Incidents</h4>
        <p className="text-xs text-[#707070] mt-1">
          No accidents logged in the response network yet.
        </p>
      </Card>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-[#E0E0E0] bg-[#F3F3F3] text-[#707070] uppercase tracking-wider font-semibold">
            <th className="py-3.5 px-4 rounded-l-[14px]">Incident ID</th>
            <th className="py-3.5 px-4">Severity / Victims</th>
            <th className="py-3.5 px-4">GPS Location</th>
            <th className="py-3.5 px-4">Ambulance</th>
            <th className="py-3.5 px-4">Trauma Center</th>
            <th className="py-3.5 px-4">Status</th>
            <th className="py-3.5 px-4">Created</th>
            <th className="py-3.5 px-4 rounded-r-[14px] text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E0E0E0]">
          {incidents.map((inc) => (
            <tr
              key={inc.id}
              className="hover:bg-[#F9F9F9] transition-colors"
            >
              <td className="py-4 px-4 font-mono font-bold text-sm text-[#141414]">
                #{inc.incidentNumber}
              </td>

              <td className="py-4 px-4">
                <div className="flex items-center gap-1.5">
                  <Badge variant="dark" className="text-[10px] px-2 py-0.5">
                    {inc.severity}
                  </Badge>
                  <span className="text-[#141414] font-medium">
                    {inc.victimCount} Victim{inc.victimCount > 1 ? "s" : ""}
                  </span>
                </div>
              </td>

              <td className="py-4 px-4 font-mono text-[#707070]">
                {inc.location.latitude.toFixed(4)}, {inc.location.longitude.toFixed(4)}
              </td>

              <td className="py-4 px-4 font-medium text-[#141414]">
                {inc.assignedAmbulanceId || (
                  <span className="text-[#ADADAD] italic">Unassigned</span>
                )}
              </td>

              <td className="py-4 px-4 font-medium text-[#141414]">
                {inc.targetHospitalId || (
                  <span className="text-[#ADADAD] italic">Pending Destination</span>
                )}
              </td>

              <td className="py-4 px-4">
                <Badge
                  variant={inc.status === "CLOSED" ? "default" : "dark"}
                  className="text-[10px] px-2 py-0.5"
                >
                  {inc.status}
                </Badge>
              </td>

              <td className="py-4 px-4 text-[#707070]">
                {new Date(inc.createdAt).toLocaleString()}
              </td>

              <td className="py-4 px-4 text-right">
                <Link href={`/citizen/incident/${inc.id}`}>
                  <Button variant="outline" size="sm" className="text-xs">
                    Inspect <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

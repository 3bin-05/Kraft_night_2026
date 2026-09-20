import React from "react";
import { Incident } from "@/types/incident";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import Link from "next/link";
import { ShieldAlert, ArrowRight, Calendar, MapPin } from "lucide-react";

interface IncidentHistoryListProps {
  incidents: Incident[];
}

export function IncidentHistoryList({ incidents }: IncidentHistoryListProps) {
  if (incidents.length === 0) {
    return (
      <EmptyState
        icon={<ShieldAlert className="w-5 h-5 text-[#707070]" />}
        title="No Emergency History"
        description="You have not logged any emergency reports yet. When you report an accident, its telemetry record will appear here."
      />
    );
  }

  return (
    <div className="space-y-3">
      {incidents.map((inc) => (
        <Card
          key={inc.id}
          variant="white"
          className="p-5 sm:p-6 border border-[#E0E0E0] hover:border-[#141414] transition-all duration-200"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F0F0F0] text-[#141414] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                SOS
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-base text-[#141414]">
                    #{inc.incidentNumber}
                  </span>
                  <Badge variant="dark" className="text-[10px] px-2 py-0.5">
                    {inc.status}
                  </Badge>
                  <Badge variant="default" className="text-[10px] px-2 py-0.5">
                    {inc.severity}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#707070] mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(inc.createdAt).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <MapPin className="w-3.5 h-3.5" />
                    {inc.location.latitude.toFixed(4)}, {inc.location.longitude.toFixed(4)}
                  </span>
                  <span>• {inc.victimCount} Victim(s)</span>
                </div>
                {inc.description && (
                  <p className="text-xs text-[#141414] mt-2 line-clamp-1 italic bg-[#F3F3F3] px-2.5 py-1 rounded-[8px]">
                    &ldquo;{inc.description}&rdquo;
                  </p>
                )}
              </div>
            </div>

            <Link href={`/citizen/incident/${inc.id}`} className="self-end sm:self-center shrink-0">
              <Button variant="outline" size="sm" className="text-xs">
                View Log <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </Card>
      ))}
    </div>
  );
}

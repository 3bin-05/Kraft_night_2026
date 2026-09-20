import React from "react";
import { Ambulance, AmbulanceStatus, AMBULANCE_LEVEL_CONFIGS, AmbulanceLevel } from "@/types/ambulance";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AmbulanceStatusSelector } from "./AmbulanceStatusSelector";
import { Navigation, Radio, MapPin, Gauge, Compass, Shield, Stethoscope, CheckCircle2 } from "lucide-react";

interface AmbulanceTelemetryCardProps {
  ambulance: Ambulance;
  onStatusChange: (status: AmbulanceStatus) => void;
  disabled?: boolean;
}

export function AmbulanceTelemetryCard({
  ambulance,
  onStatusChange,
  disabled = false,
}: AmbulanceTelemetryCardProps) {
  const levelKey: AmbulanceLevel = ambulance.type || "TYPE_C";
  const levelConfig = AMBULANCE_LEVEL_CONFIGS[levelKey] || AMBULANCE_LEVEL_CONFIGS.TYPE_C;
  const callSignDisplay = ambulance.callSign || "A-01";

  return (
    <Card variant="white" className="p-6 border border-[#E0E0E0]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E0E0E0]">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-2xl ${levelConfig.activeBg} flex flex-col items-center justify-center font-black shadow-sm`}>
            <span className="text-[9px] uppercase tracking-tighter opacity-85 leading-none">TYPE</span>
            <span className="text-base leading-none">{levelConfig.letter}</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-base text-[#141414]">
                {ambulance.vehicleNumber}
              </h3>
              <span className={`text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${levelConfig.tagColor}`}>
                Level {levelConfig.letter} &bull; {levelConfig.name.split("(")[0]}
              </span>
            </div>
            <p className="text-xs text-[#707070] mt-0.5">
              Driver: <strong className="text-neutral-800">{ambulance.driverName}</strong> ({ambulance.driverPhone})
              {ambulance.vehicleModel && (
                <span className="ml-1 text-neutral-500">&bull; {ambulance.vehicleModel}</span>
              )}
            </p>
          </div>
        </div>

        <Badge
          variant="dark"
          className={
            ambulance.status === "AVAILABLE"
              ? "bg-green-700"
              : ambulance.status === "RESPONDING"
              ? "bg-amber-600"
              : ambulance.status === "TRANSPORTING"
              ? "bg-blue-600"
              : "bg-gray-600"
          }
        >
          {ambulance.status}
        </Badge>
      </div>

      {/* Ambulance Classification & Onboard Capabilities Summary */}
      <div className="py-3 px-3.5 my-3 rounded-xl bg-neutral-50 border border-neutral-200/80 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-neutral-800">
            <Shield className="w-3.5 h-3.5 text-neutral-600" />
            <span>Call Sign: <strong className="font-mono text-black">{callSignDisplay}</strong></span>
            {ambulance.baseStation && (
              <span className="text-neutral-500 font-normal">| Station: {ambulance.baseStation}</span>
            )}
          </div>
          <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider">
            {levelConfig.badge}
          </span>
        </div>

        {ambulance.equipmentList && ambulance.equipmentList.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-neutral-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Kit:</span>
            {ambulance.equipmentList.map((eq, idx) => (
              <span
                key={idx}
                className="text-[10px] px-2 py-0.5 bg-white border border-neutral-200 rounded-md text-neutral-700 font-medium"
              >
                {eq}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Driver Status Mode Switcher */}
      <div className="py-3 border-b border-[#E0E0E0]">
        <div className="text-xs font-bold uppercase tracking-wider text-[#141414] mb-2">
          Fleet Availability Control
        </div>
        <AmbulanceStatusSelector
          currentStatus={ambulance.status}
          onStatusChange={onStatusChange}
          disabled={disabled}
        />
      </div>

      {/* Live Telemetry Data */}
      <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-[#707070]">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-[#141414]" />
          <span>
            GPS:{" "}
            <strong className="text-[#141414] font-mono">
              {ambulance.latitude.toFixed(4)}, {ambulance.longitude.toFixed(4)}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Gauge className="w-3.5 h-3.5 text-[#141414]" />
          <span>
            Speed: <strong className="text-[#141414]">{ambulance.speed || 0} km/h</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Compass className="w-3.5 h-3.5 text-[#141414]" />
          <span>
            Heading: <strong className="text-[#141414]">{ambulance.heading || 90}° E</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-[#141414]" />
          <span>
            Telemetry Link: <strong className="text-green-700">Online</strong>
          </span>
        </div>
      </div>
    </Card>
  );
}

import React from "react";
import { AmbulanceStatus } from "@/types/ambulance";
import { Button } from "@/components/ui/Button";

interface AmbulanceStatusSelectorProps {
  currentStatus: AmbulanceStatus;
  onStatusChange: (newStatus: AmbulanceStatus) => void;
  disabled?: boolean;
}

const STATUSES: Array<{
  value: AmbulanceStatus;
  label: string;
}> = [
  { value: "AVAILABLE", label: "Available / Standby" },
  { value: "RESPONDING", label: "Responding" },
  { value: "TRANSPORTING", label: "Transporting" },
  { value: "OFFLINE", label: "Off Duty / Offline" },
];

export function AmbulanceStatusSelector({
  currentStatus,
  onStatusChange,
  disabled = false,
}: AmbulanceStatusSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#F0F0F0] rounded-[20px] border border-[#E0E0E0]">
      {STATUSES.map((s) => {
        const isSelected = currentStatus === s.value;
        return (
          <button
            key={s.value}
            type="button"
            disabled={disabled}
            onClick={() => onStatusChange(s.value)}
            className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 select-none ${
              isSelected
                ? "bg-[#141414] text-white shadow-sm"
                : "text-[#707070] hover:text-[#141414] hover:bg-white/60"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                s.value === "AVAILABLE"
                  ? "bg-green-500"
                  : s.value === "RESPONDING"
                  ? "bg-amber-500"
                  : s.value === "TRANSPORTING"
                  ? "bg-blue-500"
                  : "bg-gray-400"
              }`}
            />
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

import React from "react";
import { IncidentStatus } from "@/types/incident";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface IncidentTimelineProps {
  currentStatus: IncidentStatus;
}

const STEPS: Array<{ key: IncidentStatus; label: string }> = [
  { key: "REPORTED", label: "Reported" },
  { key: "DISPATCHING", label: "Dispatching" },
  { key: "AMBULANCE_ASSIGNED", label: "Ambulance Assigned" },
  { key: "AMBULANCE_EN_ROUTE", label: "En Route to Scene" },
  { key: "PATIENT_PICKED_UP", label: "Patient Picked Up" },
  { key: "HOSPITAL_NOTIFIED", label: "Hospital Notified" },
  { key: "ARRIVED", label: "Hospital Arrived" },
  { key: "CLOSED", label: "Incident Closed" },
];

export function IncidentTimeline({ currentStatus }: IncidentTimelineProps) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStatus);
  const activeIdx = currentIndex !== -1 ? currentIndex : 0;

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#141414]">
          Response Coordination Progress
        </span>
        <span className="text-xs font-mono text-[#707070]">
          Step {activeIdx + 1} of {STEPS.length}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mt-3">
        {STEPS.map((step, idx) => {
          const isDone = idx < activeIdx;
          const isCurrent = idx === activeIdx;
          const isUpcoming = idx > activeIdx;

          return (
            <div
              key={step.key}
              className={`p-3 rounded-[16px] border text-left flex flex-col justify-between transition-all duration-200 ${
                isCurrent
                  ? "bg-[#141414] text-white border-[#141414] shadow-sm"
                  : isDone
                  ? "bg-white text-[#141414] border-[#141414]"
                  : "bg-[#F3F3F3] text-[#707070] border-[#E0E0E0]/60 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-semibold">
                  0{idx + 1}
                </span>
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#141414]" />
                ) : isCurrent ? (
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-[#ADADAD]" />
                )}
              </div>
              <span className="text-xs font-semibold leading-tight">
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

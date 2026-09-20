import React from "react";
import { HospitalReadinessState } from "@/types/hospital";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  CheckCircle2,
  Clock,
  Activity,
  Bed,
  UserCheck,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

interface HospitalReadinessWorkflowProps {
  currentState: HospitalReadinessState;
  onAdvanceState: (nextState: HospitalReadinessState) => void;
  disabled?: boolean;
}

const READINESS_STEPS: Array<{
  key: HospitalReadinessState;
  label: string;
  description: string;
}> = [
  {
    key: "ALERT_RECEIVED",
    label: "Alert Received",
    description: "Inbound trauma alert received by hospital",
  },
  {
    key: "ACKNOWLEDGED",
    label: "Acknowledged",
    description: "Emergency desk staff notified and confirmed",
  },
  {
    key: "PREPARING",
    label: "Preparing Trauma Bay",
    description: "Trauma room allocated & equipment staged",
  },
  {
    key: "READY",
    label: "Team Ready",
    description: "Surgical team & triage station on active standby",
  },
  {
    key: "PATIENT_ARRIVED",
    label: "Patient Arrived",
    description: "Ambulance arrived & patient transferred to bay",
  },
  {
    key: "CLOSED",
    label: "Admitted / Closed",
    description: "Emergency room handover complete",
  },
];

export function HospitalReadinessWorkflow({
  currentState,
  onAdvanceState,
  disabled = false,
}: HospitalReadinessWorkflowProps) {
  const currentIndex = READINESS_STEPS.findIndex((s) => s.key === currentState);
  const activeIdx = currentIndex !== -1 ? currentIndex : 0;

  return (
    <Card variant="surface" className="p-6 sm:p-8 border border-[#E0E0E0]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E0E0E0]">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[#707070] mb-0.5">
            Hospital Operational Protocol
          </div>
          <h3 className="text-lg font-bold text-[#141414]">
            Emergency Department Readiness Workflow
          </h3>
        </div>
        <Badge variant="dark" className="self-start sm:self-center">
          Current State: {currentState}
        </Badge>
      </div>

      {/* Workflow Stepper */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 py-6">
        {READINESS_STEPS.map((step, idx) => {
          const isDone = idx < activeIdx;
          const isCurrent = idx === activeIdx;

          return (
            <div
              key={step.key}
              className={`p-4 rounded-[16px] border text-left flex flex-col justify-between transition-all duration-200 ${
                isCurrent
                  ? "bg-[#141414] text-white border-[#141414] shadow-md"
                  : isDone
                  ? "bg-white text-[#141414] border-[#141414]"
                  : "bg-[#F3F3F3] text-[#707070] border-[#E0E0E0]/60 opacity-60"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold">
                    0{idx + 1}
                  </span>
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-[#141414]" />
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  ) : (
                    <Clock className="w-4 h-4 text-[#ADADAD]" />
                  )}
                </div>
                <h4 className="text-xs font-bold leading-tight">{step.label}</h4>
              </div>
              <p
                className={`text-[10px] mt-2 leading-snug ${
                  isCurrent ? "text-[#ADADAD]" : "text-[#707070]"
                }`}
              >
                {step.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* State Transition Actions */}
      <div className="p-4 rounded-[16px] bg-white border border-[#E0E0E0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-xs text-[#707070]">
          <strong className="text-[#141414]">Next Action: </strong>
          {currentState === "ALERT_RECEIVED"
            ? "Acknowledge the incoming emergency siren."
            : currentState === "ACKNOWLEDGED"
            ? "Allocate trauma bay and medical supplies."
            : currentState === "PREPARING"
            ? "Confirm surgical trauma team is standing by."
            : currentState === "READY"
            ? "Await ambulance arrival at trauma ambulance bay."
            : currentState === "PATIENT_ARRIVED"
            ? "Complete medical admission handover."
            : "Emergency department ready for next alert."}
        </div>

        <div className="flex items-center gap-2">
          {currentState === "ALERT_RECEIVED" && (
            <Button
              variant="primary"
              size="sm"
              disabled={disabled}
              onClick={() => onAdvanceState("ACKNOWLEDGED")}
              className="text-xs uppercase tracking-wider font-semibold"
            >
              Acknowledge Alert
            </Button>
          )}

          {currentState === "ACKNOWLEDGED" && (
            <Button
              variant="primary"
              size="sm"
              disabled={disabled}
              onClick={() => onAdvanceState("PREPARING")}
              className="text-xs uppercase tracking-wider font-semibold"
            >
              <Bed className="w-3.5 h-3.5 mr-1.5" /> Mark Preparing Trauma Bay
            </Button>
          )}

          {currentState === "PREPARING" && (
            <Button
              variant="primary"
              size="sm"
              disabled={disabled}
              onClick={() => onAdvanceState("READY")}
              className="text-xs uppercase tracking-wider font-semibold"
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> Mark Trauma Team Ready
            </Button>
          )}

          {currentState === "READY" && (
            <Button
              variant="primary"
              size="sm"
              disabled={disabled}
              onClick={() => onAdvanceState("PATIENT_ARRIVED")}
              className="text-xs uppercase tracking-wider font-semibold"
            >
              <UserCheck className="w-3.5 h-3.5 mr-1.5" /> Confirm Patient Arrived
            </Button>
          )}

          {currentState === "PATIENT_ARRIVED" && (
            <Button
              variant="secondary"
              size="sm"
              disabled={disabled}
              onClick={() => onAdvanceState("CLOSED")}
              className="text-xs uppercase tracking-wider font-semibold"
            >
              Complete Handover &amp; Close Incident
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

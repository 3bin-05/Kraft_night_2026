import { EmergencyReportForm } from "@/components/emergency/EmergencyReportForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Report Emergency (SOS) — AIMLESS",
  description:
    "Instant emergency road accident reporting with live GPS location telemetry, severity tagging, and hospital/ambulance dispatch.",
};

export default function EmergencyReportPage() {
  return (
    <div className="flex-1 flex items-center justify-center py-8 sm:py-12 bg-[#FFFFFF]">
      <EmergencyReportForm />
    </div>
  );
}

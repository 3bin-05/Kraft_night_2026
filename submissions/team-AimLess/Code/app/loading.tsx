import React from "react";
import { LoadingState } from "@/components/ui/LoadingState";

export default function GlobalLoading() {
  return <LoadingState fullScreen title="Initializing AIMLESS Telemetry" message="Loading emergency response interface..." />;
}

"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MapPinOff, Navigation, RefreshCw } from "lucide-react";

interface GpsStateFallbackProps {
  status: "DENIED" | "UNAVAILABLE" | "TIMEOUT" | "ERROR";
  onRetry?: () => void;
  onManualOverride?: () => void;
  className?: string;
}

export function GpsStateFallback({
  status,
  onRetry,
  onManualOverride,
  className = "",
}: GpsStateFallbackProps) {
  const isDenied = status === "DENIED";

  return (
    <Card
      variant="surface"
      className={`p-6 border border-amber-200 bg-amber-50/50 rounded-[24px] ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
          <MapPinOff className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-900">
              {isDenied ? "GPS Permission Required" : "GPS Signal Inactive"}
            </span>
          </div>
          <h4 className="text-sm font-bold text-[#141414] mt-0.5 mb-1">
            {isDenied
              ? "Location Services Blocked by Browser"
              : "Unable to Acquire High-Accuracy GPS Fix"}
          </h4>
          <p className="text-xs text-[#707070] leading-relaxed mb-4">
            {isDenied
              ? "AIMLESS requires location permissions to pinpoint the crash scene. Please enable location in your browser address bar settings or use manual coordinates fallback."
              : "GPS acquisition timed out or hardware is unavailable. Standard fallback coordinates are active for dispatch."}
          </p>

          <div className="flex flex-wrap items-center gap-2.5">
            {onRetry && (
              <Button variant="secondary" size="sm" onClick={onRetry} className="text-xs">
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Re-request GPS Fix
              </Button>
            )}
            {onManualOverride && (
              <Button variant="outline" size="sm" onClick={onManualOverride} className="text-xs">
                <Navigation className="w-3.5 h-3.5 mr-1.5" /> Use Default Grid Point
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

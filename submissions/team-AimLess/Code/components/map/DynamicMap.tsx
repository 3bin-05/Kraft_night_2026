"use client";

import dynamic from "next/dynamic";
import React, { useState } from "react";
import type { MapPoint, MapRoute } from "./GoogleMapContainer";

const GoogleMapContainer = dynamic(() => import("./GoogleMapContainer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[380px] rounded-[24px] bg-[#F3F3F3] border border-[#E0E0E0] flex flex-col items-center justify-center animate-pulse">
      <div className="w-7 h-7 rounded-full border-2 border-[#141414] border-t-transparent animate-spin mb-2" />
      <span className="text-xs font-mono font-medium text-[#707070] uppercase tracking-wider">
        Loading Google Maps Tactical Grid...
      </span>
    </div>
  ),
});

const LeafletMapContainer = dynamic(() => import("./MapContainer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[380px] rounded-[24px] bg-[#F3F3F3] border border-[#E0E0E0] flex flex-col items-center justify-center animate-pulse">
      <div className="w-6 h-6 rounded-full border-2 border-[#141414] border-t-transparent animate-spin mb-2" />
      <span className="text-xs font-mono font-medium text-[#707070] uppercase tracking-wider">
        Loading Leaflet Tactical Grid...
      </span>
    </div>
  ),
});

export interface DynamicMapProps {
  markers?: MapPoint[];
  route?: MapRoute;
  center?: [number, number];
  zoom?: number;
  height?: string;
  className?: string;
  showTelemetryOverlay?: boolean;
  interactive?: boolean;
  provider?: "google" | "leaflet";
}

export function DynamicMap({
  provider = "google",
  ...props
}: DynamicMapProps) {
  if (provider === "leaflet") {
    return <LeafletMapContainer {...props} />;
  }

  return <GoogleMapContainer {...props} />;
}

export type { MapPoint, MapRoute };

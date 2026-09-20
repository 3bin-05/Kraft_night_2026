"use client";

import React, { useEffect, useRef, useState } from "react";
import type * as L from "leaflet";

export interface MapPoint {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  subtitle?: string;
  type: "accident" | "ambulance" | "hospital" | "destination";
  severity?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status?: string;
  heading?: number; // degrees 0-360
  eta?: string;
}

export interface MapRoute {
  coordinates: [number, number][]; // [lat, lng] array
  label?: string;
  distanceKm?: number;
  eta?: string;
}

interface MapContainerProps {
  markers?: MapPoint[];
  route?: MapRoute;
  center?: [number, number];
  zoom?: number;
  height?: string;
  className?: string;
  showTelemetryOverlay?: boolean;
  interactive?: boolean;
}

export default function MapContainer({
  markers = [],
  route,
  center,
  zoom = 14,
  height = "380px",
  className = "",
  showTelemetryOverlay = true,
  interactive = true,
}: MapContainerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const leafletRef = useRef<typeof L | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Initialize Leaflet map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === "undefined" || !mapContainerRef.current) return;
      if (mapInstanceRef.current) return;

      try {
        const leafletModule = await import("leaflet");
        const L = leafletModule.default || leafletModule;
        leafletRef.current = L;

        if (!isMounted || !mapContainerRef.current) return;

        // Default center fallback (Central City: 40.7128, -74.0060 if none provided)
        const defaultCenter: [number, number] = center ||
          (markers.length > 0 ? [markers[0].latitude, markers[0].longitude] : [40.7128, -74.006]);

        const map = L.map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: zoom,
          zoomControl: false,
          attributionControl: false,
          dragging: interactive,
          scrollWheelZoom: interactive ? "center" : false,
          doubleClickZoom: interactive,
          touchZoom: interactive,
        });

        // Add high-contrast tactical OpenStreetMap tile layer (styled via CSS grayscale)
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          subdomains: ["a", "b", "c"],
          maxZoom: 19,
        }).addTo(map);

        // Add custom minimal zoom control if interactive
        if (interactive) {
          L.control.zoom({ position: "bottomright" }).addTo(map);
        }

        const markersGroup = L.layerGroup().addTo(map);
        markersGroupRef.current = markersGroup;
        mapInstanceRef.current = map;

        setIsLoaded(true);
      } catch (err: unknown) {
        console.error("Leaflet initialization failed:", err);
        setLoadError("Unable to initialize tactical map rendering.");
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers & Route
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !leafletRef.current || !markersGroupRef.current) {
      return;
    }

    const L = leafletRef.current;
    const map = mapInstanceRef.current;
    const group = markersGroupRef.current;

    group.clearLayers();

    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }

    const validLatLngs: [number, number][] = [];

    markers.forEach((m) => {
      if (isNaN(m.latitude) || isNaN(m.longitude)) return;

      const latLng: [number, number] = [m.latitude, m.longitude];
      validLatLngs.push(latLng);

      // Create Custom High-Contrast HTML DivIcon
      let iconHtml = "";

      if (m.type === "accident") {
        iconHtml = `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-8 h-8 rounded-full bg-red-500 opacity-30 animate-ping"></div>
            <div class="relative w-7 h-7 rounded-full bg-[#141414] text-white border-2 border-white shadow-lg flex items-center justify-center font-bold text-[11px]">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
          </div>
        `;
      } else if (m.type === "ambulance") {
        const rotation = m.heading ? `transform: rotate(${m.heading}deg);` : "";
        iconHtml = `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-9 h-9 rounded-full bg-green-500 opacity-25 animate-pulse"></div>
            <div class="relative w-8 h-8 rounded-full bg-[#141414] text-white border-2 border-green-500 shadow-xl flex items-center justify-center" style="${rotation}">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="3 11 22 2 13 21 11 13 3 11"/>
              </svg>
            </div>
          </div>
        `;
      } else if (m.type === "hospital") {
        iconHtml = `
          <div class="relative flex items-center justify-center">
            <div class="relative w-7 h-7 rounded-full bg-white text-[#141414] border-2 border-[#141414] shadow-lg flex items-center justify-center font-bold">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
                <path d="M9 22v-4h6v4"/>
                <path d="M8 6h.01"/>
                <path d="M16 6h.01"/>
                <path d="M12 6v4"/>
                <path d="M10 8h4"/>
              </svg>
            </div>
          </div>
        `;
      } else {
        iconHtml = `
          <div class="w-5 h-5 rounded-full bg-[#141414] border-2 border-white shadow-md"></div>
        `;
      }

      const customIcon = L.divIcon({
        className: "aimless-map-marker",
        html: iconHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18],
      });

      const marker = L.marker(latLng, { icon: customIcon }).addTo(group);

      // Clean, high contrast popup
      const popupContent = `
        <div style="font-family: system-ui, sans-serif; padding: 4px; min-width: 140px; color: #141414;">
          <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #707070; letter-spacing: 0.05em;">
            ${m.type.toUpperCase()}
          </div>
          <div style="font-size: 13px; font-weight: 700; margin-top: 2px;">
            ${m.title}
          </div>
          ${m.subtitle ? `<div style="font-size: 11px; color: #707070; margin-top: 2px;">${m.subtitle}</div>` : ""}
          ${m.status ? `<div style="display: inline-block; margin-top: 6px; padding: 2px 6px; background: #F0F0F0; border-radius: 9999px; font-size: 10px; font-weight: 600;">${m.status}</div>` : ""}
          ${m.eta ? `<div style="margin-top: 4px; font-size: 11px; font-weight: 700; color: #141414;">ETA: ${m.eta}</div>` : ""}
        </div>
      `;

      marker.bindPopup(popupContent);
    });

    // Draw Route Polyline
    if (route && route.coordinates.length > 1) {
      const polyline = L.polyline(route.coordinates, {
        color: "#141414",
        weight: 3.5,
        opacity: 0.85,
        dashArray: "6, 8",
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);

      routePolylineRef.current = polyline;
      route.coordinates.forEach((pt) => validLatLngs.push(pt));
    }

    // Auto-fit bounds if multiple points are available
    if (validLatLngs.length > 1) {
      const bounds = L.latLngBounds(validLatLngs);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    } else if (validLatLngs.length === 1) {
      map.setView(validLatLngs[0], zoom);
    }
  }, [markers, route, isLoaded, zoom]);

  // Calculate active ambulance and accident for the telemetry header
  const ambulanceMarker = markers.find((m) => m.type === "ambulance");
  const accidentMarker = markers.find((m) => m.type === "accident");
  const hospitalMarker = markers.find((m) => m.type === "hospital");

  return (
    <div
      className={`relative w-full rounded-[24px] overflow-hidden border border-[#E0E0E0] bg-[#F3F3F3] shadow-inner ${className}`}
      style={{ height }}
    >
      {/* Leaflet DOM Anchor */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Loading Skeleton */}
      {!isLoaded && !loadError && (
        <div className="absolute inset-0 bg-[#F3F3F3] flex flex-col items-center justify-center z-10">
          <div className="w-6 h-6 rounded-full border-2 border-[#141414] border-t-transparent animate-spin mb-2" />
          <span className="text-xs font-mono font-medium text-[#707070] uppercase tracking-wider">
            Loading Tactical GPS Grid...
          </span>
        </div>
      )}

      {/* Error Fallback */}
      {loadError && (
        <div className="absolute inset-0 bg-[#F3F3F3] flex flex-col items-center justify-center p-6 text-center z-10">
          <span className="text-xs font-semibold text-red-600 mb-1">GPS Telemetry Error</span>
          <span className="text-xs text-[#707070]">{loadError}</span>
        </div>
      )}

      {/* Tactical Telemetry Badge Overlay */}
      {showTelemetryOverlay && isLoaded && (
        <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-sm border border-[#E0E0E0] px-3.5 py-2 rounded-[16px] shadow-sm flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600" />
            </span>
            <span className="text-[11px] font-mono font-bold tracking-wider text-[#141414] uppercase">
              Tactical GPS Active
            </span>
          </div>

          {(route?.eta || ambulanceMarker?.eta) && (
            <div className="border-l border-[#E0E0E0] pl-3 flex items-center gap-1.5 text-xs">
              <span className="text-[#707070]">ETA:</span>
              <span className="font-mono font-bold text-[#141414]">
                {route?.eta || ambulanceMarker?.eta}
              </span>
            </div>
          )}

          {route?.distanceKm !== undefined && (
            <div className="border-l border-[#E0E0E0] pl-3 text-xs">
              <span className="text-[#707070]">Distance:</span>{" "}
              <span className="font-mono font-bold text-[#141414]">
                {route.distanceKm.toFixed(1)} km
              </span>
            </div>
          )}
        </div>
      )}

      {/* Tactical Legend Overlay */}
      {isLoaded && markers.length > 0 && (
        <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-sm border border-[#E0E0E0] px-3 py-1.5 rounded-full shadow-sm flex items-center gap-3 text-[10px] font-medium text-[#707070]">
          {accidentMarker && (
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-600" />
              <span>Incident</span>
            </div>
          )}
          {ambulanceMarker && (
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-600" />
              <span>Ambulance</span>
            </div>
          )}
          {hospitalMarker && (
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>Hospital</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

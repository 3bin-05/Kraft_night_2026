"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Layers, Compass, Eye, ShieldAlert, Sparkles, Activity } from "lucide-react";

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

export interface GoogleMapContainerProps {
  markers?: MapPoint[];
  route?: MapRoute;
  center?: [number, number];
  zoom?: number;
  height?: string;
  className?: string;
  showTelemetryOverlay?: boolean;
  interactive?: boolean;
  apiKey?: string;
}

const DEFAULT_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

// Premium Emergency High-Contrast Google Maps Theme (Dark / Silver Tactical)
const TACTICAL_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "on" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
  {
    featureType: "administrative.land_parcel",
    elementType: "labels.text.fill",
    stylers: [{ color: "#bdbdbd" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#eeeeee" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#e5e5e5" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road.arterial",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#dadada" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }],
  },
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
  {
    featureType: "transit.line",
    elementType: "geometry",
    stylers: [{ color: "#e5e5e5" }],
  },
  {
    featureType: "transit.station",
    elementType: "geometry",
    stylers: [{ color: "#eeeeee" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#c9c9c9" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
];

export default function GoogleMapContainer({
  markers = [],
  route,
  center,
  zoom = 14,
  height = "380px",
  className = "",
  showTelemetryOverlay = true,
  interactive = true,
  apiKey = DEFAULT_API_KEY,
}: GoogleMapContainerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const trafficLayerRef = useRef<google.maps.TrafficLayer | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showTraffic, setShowTraffic] = useState(true);
  const [mapTypeId, setMapTypeId] = useState<"roadmap" | "hybrid">("roadmap");

  // Load Google Maps JavaScript API SDK dynamically
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    const existingScript = document.getElementById("google-maps-script");
    if (existingScript) {
      existingScript.addEventListener("load", () => setIsLoaded(true));
      existingScript.addEventListener("error", () =>
        setLoadError("Failed to load Google Maps script.")
      );
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setIsLoaded(true);
    };

    script.onerror = () => {
      console.error("Google Maps API script load error");
      setLoadError("Unable to authenticate Google Maps API. Verify network or API key.");
    };

    document.head.appendChild(script);
  }, [apiKey]);

  // Initialize Map Instance
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || mapInstanceRef.current) return;

    try {
      const defaultCenter: google.maps.LatLngLiteral = center
        ? { lat: center[0], lng: center[1] }
        : markers.length > 0
        ? { lat: markers[0].latitude, lng: markers[0].longitude }
        : { lat: 8.915, lng: 76.633 };

      const map = new google.maps.Map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: zoom,
        disableDefaultUI: !interactive,
        zoomControl: interactive,
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_BOTTOM,
        },
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: mapTypeId === "roadmap" ? TACTICAL_MAP_STYLE : undefined,
        mapTypeId: mapTypeId,
        gestureHandling: interactive ? "auto" : "none",
      });

      // Initialize live traffic layer
      const traffic = new google.maps.TrafficLayer();
      if (showTraffic) {
        traffic.setMap(map);
      }
      trafficLayerRef.current = traffic;

      mapInstanceRef.current = map;
    } catch (err) {
      console.error("Failed to initialize Google Map:", err);
      setLoadError("Failed to initialize Google Maps view.");
    }
  }, [isLoaded, center, zoom, interactive, markers, showTraffic, mapTypeId]);

  // Toggle Traffic Layer
  const toggleTraffic = useCallback(() => {
    setShowTraffic((prev) => {
      const nextState = !prev;
      if (trafficLayerRef.current && mapInstanceRef.current) {
        trafficLayerRef.current.setMap(nextState ? mapInstanceRef.current : null);
      }
      return nextState;
    });
  }, []);

  // Toggle Map Type (Roadmap / Satellite Hybrid)
  const toggleMapType = useCallback(() => {
    setMapTypeId((prev) => {
      const nextType = prev === "roadmap" ? "hybrid" : "roadmap";
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setMapTypeId(nextType);
        if (nextType === "roadmap") {
          mapInstanceRef.current.setOptions({ styles: TACTICAL_MAP_STYLE });
        } else {
          mapInstanceRef.current.setOptions({ styles: [] });
        }
      }
      return nextType;
    });
  }, []);

  // Render Markers and Polyline
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Clear previous markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // Clear previous polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    const bounds = new google.maps.LatLngBounds();
    let hasPoints = false;

    // Create Custom SVG Markers
    markers.forEach((m) => {
      if (isNaN(m.latitude) || isNaN(m.longitude)) return;

      const pos = { lat: m.latitude, lng: m.longitude };
      bounds.extend(pos);
      hasPoints = true;

      let icon: google.maps.Icon | google.maps.Symbol;

      if (m.type === "accident") {
        // Red Emergency Scene Beacon
        icon = {
          url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="#DC2626" fill-opacity="0.25"/>
              <circle cx="18" cy="18" r="12" fill="#141414" stroke="#FFFFFF" stroke-width="2.5"/>
              <path d="M18 11v8M18 23h.01" stroke="#DC2626" stroke-width="2.5" stroke-linecap="round" fill="none"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(36, 36),
          anchor: new google.maps.Point(18, 18),
        };
      } else if (m.type === "ambulance") {
        // Green Ambulance Beacon with Direction Heading
        const rotation = m.heading || 0;
        icon = {
          url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 38 38">
              <circle cx="19" cy="19" r="17" fill="#16A34A" fill-opacity="0.25"/>
              <circle cx="19" cy="19" r="13" fill="#141414" stroke="#16A34A" stroke-width="2.5"/>
              <g transform="rotate(${rotation} 19 19)">
                <polygon points="19,10 25,26 19,23 13,26" fill="#FFFFFF"/>
              </g>
            </svg>
          `),
          scaledSize: new google.maps.Size(38, 38),
          anchor: new google.maps.Point(19, 19),
        };
      } else if (m.type === "hospital") {
        // Blue Trauma Center Beacon
        icon = {
          url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="#2563EB" fill-opacity="0.2"/>
              <rect x="6" y="6" width="24" height="24" rx="6" fill="#FFFFFF" stroke="#141414" stroke-width="2"/>
              <path d="M18 11v14M11 18h14" stroke="#2563EB" stroke-width="3" stroke-linecap="round"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(36, 36),
          anchor: new google.maps.Point(18, 18),
        };
      } else {
        icon = {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: "#141414",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 2,
        };
      }

      const marker = new google.maps.Marker({
        position: pos,
        map: map,
        title: m.title,
        icon: icon,
        zIndex: m.type === "ambulance" ? 100 : m.type === "accident" ? 90 : 80,
      });

      // InfoWindow on click
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="font-family: system-ui, sans-serif; padding: 6px; min-width: 150px; color: #141414;">
            <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #707070; letter-spacing: 0.05em;">
              ${m.type.toUpperCase()}
            </div>
            <div style="font-size: 13px; font-weight: 700; margin-top: 2px;">
              ${m.title}
            </div>
            ${m.subtitle ? `<div style="font-size: 11px; color: #707070; margin-top: 2px;">${m.subtitle}</div>` : ""}
            ${m.status ? `<div style="display: inline-block; margin-top: 6px; padding: 2px 6px; background: #F0F0F0; border-radius: 9999px; font-size: 10px; font-weight: 600;">${m.status}</div>` : ""}
            ${m.eta ? `<div style="margin-top: 4px; font-size: 11px; font-weight: 700; color: #16A34A;">ETA: ${m.eta}</div>` : ""}
          </div>
        `,
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
      });

      markersRef.current.push(marker);
    });

    // Draw Route Polyline
    if (route && route.coordinates.length > 1) {
      const path = route.coordinates.map(([lat, lng]) => {
        const pt = { lat, lng };
        bounds.extend(pt);
        return pt;
      });
      hasPoints = true;

      const polyline = new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: "#141414",
        strokeOpacity: 0.9,
        strokeWeight: 4,
        map: map,
      });

      polylineRef.current = polyline;
    }

    // Auto fit viewport
    if (hasPoints && interactive) {
      if (markers.length === 1 && (!route || route.coordinates.length <= 1)) {
        map.setCenter({ lat: markers[0].latitude, lng: markers[0].longitude });
        map.setZoom(zoom);
      } else {
        map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
      }
    }
  }, [isLoaded, markers, route, zoom, interactive]);

  const ambulanceMarker = markers.find((m) => m.type === "ambulance");
  const accidentMarker = markers.find((m) => m.type === "accident");
  const hospitalMarker = markers.find((m) => m.type === "hospital");

  return (
    <div
      className={`relative w-full rounded-[24px] overflow-hidden border border-[#E0E0E0] bg-[#F3F3F3] shadow-inner ${className}`}
      style={{ height }}
    >
      {/* Google Map Anchor */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Loading State */}
      {!isLoaded && !loadError && (
        <div className="absolute inset-0 bg-[#F3F3F3] flex flex-col items-center justify-center z-10">
          <div className="w-7 h-7 rounded-full border-2 border-[#141414] border-t-transparent animate-spin mb-2" />
          <span className="text-xs font-mono font-medium text-[#707070] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#141414]" /> Initializing Google Maps Satellite Matrix...
          </span>
        </div>
      )}

      {/* Error Fallback */}
      {loadError && (
        <div className="absolute inset-0 bg-[#F3F3F3] flex flex-col items-center justify-center p-6 text-center z-10">
          <ShieldAlert className="w-8 h-8 text-red-600 mb-2" />
          <span className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">
            Google Maps API Initialization
          </span>
          <span className="text-xs text-[#707070] max-w-sm">{loadError}</span>
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
            <span className="text-[11px] font-mono font-bold tracking-wider text-[#141414] uppercase flex items-center gap-1">
              Google Maps Live
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

      {/* Quick Map Controls (Traffic & Satellite View Toggle) */}
      {isLoaded && interactive && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm border border-[#E0E0E0] p-1 rounded-[14px] shadow-sm">
          <button
            type="button"
            onClick={toggleTraffic}
            title={showTraffic ? "Hide Real-time Traffic" : "Show Real-time Traffic"}
            className={`px-2.5 py-1 rounded-[10px] text-[10.5px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
              showTraffic
                ? "bg-[#141414] text-white shadow-sm"
                : "text-[#707070] hover:text-[#141414] hover:bg-[#F0F0F0]"
            }`}
          >
            <Activity className="w-3 h-3" />
            <span>Traffic</span>
          </button>

          <button
            type="button"
            onClick={toggleMapType}
            title="Toggle Satellite / Tactical View"
            className={`px-2.5 py-1 rounded-[10px] text-[10.5px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
              mapTypeId === "hybrid"
                ? "bg-[#141414] text-white shadow-sm"
                : "text-[#707070] hover:text-[#141414] hover:bg-[#F0F0F0]"
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>{mapTypeId === "hybrid" ? "Satellite" : "Tactical"}</span>
          </button>
        </div>
      )}

      {/* Tactical Legend Overlay */}
      {isLoaded && markers.length > 0 && (
        <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-sm border border-[#E0E0E0] px-3 py-1.5 rounded-full shadow-sm flex items-center gap-3 text-[10px] font-medium text-[#707070]">
          {accidentMarker && (
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-600" />
              <span>Accident Scene</span>
            </div>
          )}
          {ambulanceMarker && (
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-600" />
              <span>Ambulance Unit</span>
            </div>
          )}
          {hospitalMarker && (
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>Trauma Center</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
